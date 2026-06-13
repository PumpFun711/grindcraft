const Game = {
  world: [],
  players: new Map(),
  myId: null,
  myPlayer: null,
  roomName: null,
  animFrame: null,
  t: 0,

  // Input state
  keys: {},
  mouseCol: -1,
  mouseRow: -1,
  miningInterval: null,
  miningTarget: null,

  // Movement
  moveTimer: 0,
  MOVE_SPEED: 0.12,

  init() {
    WorldRenderer.init('game-canvas');
    Network.connect();
    this.bindInput();
  },

  onInit(data) {
    this.world = data.world;
    this.myId = data.playerId;
    this.roomName = data.roomName;

    this.players.clear();
    data.players.forEach(p => {
      this.players.set(p.id, {
        ...p,
        walkFrame: 0,
        walkTick: 0,
        direction: 0,
        vx: 0,
        vy: 0,
        px: p.x,
        py: p.y
      });
    });

    this.myPlayer = this.players.get(this.myId);

    document.getElementById('hud-room').textContent = data.roomName;
    document.getElementById('hud-online').textContent = data.playerCount + '/60';
    document.getElementById('hud-name').textContent = this.myPlayer.nickname;
    document.getElementById('hud-pts').textContent = '0';
    document.getElementById('hud-blocks').textContent = '0';
    document.getElementById('hud-pick').textContent = PICKS[0].name;
    document.getElementById('hud-pick').style.color = PICKS[0].color;

    UI.buildBlockLegend();
    UI.buildShop(this.myPlayer);
    Network.getLeaderboard();

    if(this.animFrame) cancelAnimationFrame(this.animFrame);
    this.loop();

    showToast('⛏ Joined ' + data.roomName + ' — use WASD to move, click to mine!');
  },

  onPlayerJoined(data) {
    this.players.set(data.id, {
      ...data,
      walkFrame: 0,
      walkTick: 0,
      direction: 0,
      px: data.x,
      py: data.y
    });
    document.getElementById('hud-online').textContent = this.players.size + '/60';
    showToast('👤 ' + data.nickname + ' joined');
  },

  onPlayerMoved(data) {
    const p = this.players.get(data.id);
    if(p && data.id !== this.myId) {
      p.x = data.x;
      p.y = data.y;
      p.px = data.px || data.x;
      p.py = data.py || data.y;
      p.direction = data.direction || 0;
      p.walkFrame = data.walkFrame || 0;
    }
  },

  onPlayerLeft(data) {
    const p = this.players.get(data.id);
    if(p) showToast('👤 ' + p.nickname + ' left');
    this.players.delete(data.id);
    document.getElementById('hud-online').textContent = this.players.size + '/60';
  },

  onBlockBroken(data) {
    const idx = data.row * WORLD_COLS + data.col;
    this.world[idx] = -1;
    WorldRenderer.clearCrack(data.col, data.row);

    if(data.minedBy === this.myId) {
      this.myPlayer.points = data.playerPoints;
      this.myPlayer.totalBlocks = data.playerBlocks;
      document.getElementById('hud-pts').textContent = data.playerPoints.toLocaleString();
      document.getElementById('hud-blocks').textContent = data.playerBlocks;
      UI.buildShop(this.myPlayer);

      // Float text at block position
      const { x, y } = WorldRenderer.worldToScreen(data.col, data.row);
      spawnFloatText(x + TILE_SIZE/2, y, '+' + data.points + ' pts',
        BLOCKS[data.blockType] ? BLOCKS[data.blockType].color : '#fff');
    }

    // Stop mining if this was our target
    if(this.miningTarget && this.miningTarget.col === data.col && this.miningTarget.row === data.row) {
      this.stopMining();
    }
  },

  onBlockHit(data) {
    const hitsApplied = data.hitsNeeded - data.hitsLeft;
    WorldRenderer.setCrack(data.col, data.row, hitsApplied, data.hitsNeeded);
  },

  onPickaxeUpgraded(data) {
    this.myPlayer.pickaxe = data.tier;
    this.myPlayer.points = data.newPoints;
    document.getElementById('hud-pts').textContent = data.newPoints.toLocaleString();
    document.getElementById('hud-pick').textContent = PICKS[data.tier].name;
    document.getElementById('hud-pick').style.color = PICKS[data.tier].color;
    UI.buildShop(this.myPlayer);
    showToast('⛏ Upgraded to ' + PICKS[data.tier].name + ' Pickaxe!');
  },

  onPlayerPickaxeChanged(data) {
    const p = this.players.get(data.id);
    if(p) p.pickaxe = data.tier;
  },

  bindInput() {
    // WASD keyboard
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      // Space to jump (visual only bob)
      if(e.key === ' ') e.preventDefault();
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    const canvas = document.getElementById('game-canvas');

    // Mouse move — highlight block
    canvas.addEventListener('mousemove', (e) => {
      if(!this.myPlayer) return;
      const rect = canvas.getBoundingClientRect();
      const block = WorldRenderer.getBlockAt(e.clientX - rect.left, e.clientY - rect.top);
      if(block) {
        this.mouseCol = block.col;
        this.mouseRow = block.row;
      }
    });

    // Click to start mining
    canvas.addEventListener('mousedown', (e) => {
      if(!this.myPlayer || e.button !== 0) return;
      const rect = canvas.getBoundingClientRect();
      const block = WorldRenderer.getBlockAt(e.clientX - rect.left, e.clientY - rect.top);
      if(!block) return;
      const idx = block.row * WORLD_COLS + block.col;
      if(this.world[idx] < 0) return;

      // Check range — must be within 4 tiles
      const dist = Math.abs(block.col - this.myPlayer.x) + Math.abs(block.row - this.myPlayer.y);
      if(dist > 4) {
        showToast('⚠️ Too far away! Move closer to mine.');
        return;
      }

      this.startMining(block.col, block.row);
    });

    canvas.addEventListener('mouseup', () => this.stopMining());
    canvas.addEventListener('mouseleave', () => this.stopMining());
  },

  startMining(col, row) {
    this.stopMining();
    this.miningTarget = { col, row };

    // Face toward block
    if(this.myPlayer) {
      const dx = col - this.myPlayer.x;
      const dy = row - this.myPlayer.y;
      if(Math.abs(dx) > Math.abs(dy)) {
        this.myPlayer.direction = dx > 0 ? 2 : 1;
      } else {
        this.myPlayer.direction = dy > 0 ? 0 : 3;
      }
    }

    // Mine immediately then every 250ms
    Network.mineBlock(col, row);
    this.miningInterval = setInterval(() => {
      if(!this.miningTarget) return;
      const idx = this.miningTarget.row * WORLD_COLS + this.miningTarget.col;
      if(this.world[idx] < 0) { this.stopMining(); return; }
      Network.mineBlock(this.miningTarget.col, this.miningTarget.row);
    }, 250);
  },

  stopMining() {
    if(this.miningInterval) {
      clearInterval(this.miningInterval);
      this.miningInterval = null;
    }
    this.miningTarget = null;
  },

  updateMovement(dt) {
    if(!this.myPlayer) return;

    const p = this.myPlayer;
    let dx = 0, dy = 0;

    if(this.keys['w'] || this.keys['arrowup'])    dy = -1;
    if(this.keys['s'] || this.keys['arrowdown'])  dy =  1;
    if(this.keys['a'] || this.keys['arrowleft'])  dx = -1;
    if(this.keys['d'] || this.keys['arrowright']) dx =  1;

    const moving = dx !== 0 || dy !== 0;

    if(moving) {
      // Set direction
      if(Math.abs(dx) > Math.abs(dy)) {
        p.direction = dx > 0 ? 2 : 1;
      } else {
        p.direction = dy > 0 ? 0 : 3;
      }

      // Normalize diagonal
      if(dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

      const speed = this.MOVE_SPEED * dt;
      const newX = p.x + dx * speed;
      const newY = p.y + dy * speed;

      // Collision check
      const tileX = Math.round(newX);
      const tileY = Math.round(newY);

      const canMoveX = this.isTileWalkable(Math.round(newX), Math.round(p.y));
      const canMoveY = this.isTileWalkable(Math.round(p.x), Math.round(newY));

      if(canMoveX) p.x = Math.max(0, Math.min(WORLD_COLS-1, newX));
      if(canMoveY) p.y = Math.max(0, Math.min(WORLD_ROWS-1, newY));

      // Walk animation
      p.walkTick = (p.walkTick || 0) + dt * 0.008;
      p.walkFrame = Math.floor(p.walkTick) % 4;

      // Send position to server every 50ms
      this.moveTimer += dt;
      if(this.moveTimer > 50) {
        this.moveTimer = 0;
        Network.move(p.x, p.y, p.direction, p.walkFrame);
      }

      // Stop mining if moving
      if(this.miningTarget) this.stopMining();

    } else {
      p.walkFrame = 0;
    }
  },

  isTileWalkable(col, row) {
    if(col < 0 || col >= WORLD_COLS || row < 0 || row >= WORLD_ROWS) return false;
    const idx = row * WORLD_COLS + col;
    return this.world[idx] < 0; // -1 = air = walkable
  },

  loop() {
    this.animFrame = requestAnimationFrame((ts) => this.loop(ts));
    this.t += 1;

    const dt = 16; // ~60fps target
    this.updateMovement(dt);

    if(this.myPlayer) {
      WorldRenderer.updateCamera(this.myPlayer.x, this.myPlayer.y);
    }

    const ctx = WorldRenderer.ctx;
    const canvas = WorldRenderer.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw world with mouse highlight
    WorldRenderer.drawWorld(this.world, this.mouseCol, this.mouseRow);

    // Draw all players sorted by Y (depth)
    const sortedPlayers = Array.from(this.players.values()).sort((a,b) => a.y - b.y);

    sortedPlayers.forEach(p => {
      const { x, y } = WorldRenderer.worldToScreen(p.x, p.y);
      const S = 3;
      const charH = 20 * S;

      // Mining animation shake
      let shakeX = 0, shakeY = 0;
      if(p.id === this.myId && this.miningTarget) {
        shakeX = Math.sin(this.t * 0.8) * 2;
        shakeY = Math.cos(this.t * 0.8) * 1;
      }

      drawPixelChar(
        ctx,
        x - 4*S + shakeX,
        y - charH + shakeY,
        { skin: p.skin, hair: p.hair, shirt: p.shirt, pants: p.pants },
        p.walkFrame || 0,
        S,
        p.direction || 0
      );

      drawNameTag(ctx, x - 4*S, y - charH, p.nickname, p.id === this.myId, S);

      // Pickaxe tier badge
      if(p.pickaxe > 0) {
        const pick = PICKS[p.pickaxe];
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = pick.color;
        ctx.textAlign = 'center';
        ctx.fillText('⛏' + pick.name, x, y - charH - 20);
        ctx.textAlign = 'left';
      }
    });

    // Mining progress bar
    if(this.miningTarget && this.myPlayer) {
      const key = `${this.miningTarget.col},${this.miningTarget.row}`;
      const crack = WorldRenderer.cracks[key];
      if(crack) {
        const progress = crack.hits / crack.hitsNeeded;
        const barW = 120, barH = 10;
        const bx = canvas.width/2 - barW/2;
        const by = canvas.height - 60;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(bx-2, by-2, barW+4, barH+4);
        ctx.fillStyle = '#333';
        ctx.fillRect(bx, by, barW, barH);
        ctx.fillStyle = BLOCKS[this.world[this.miningTarget.row*WORLD_COLS+this.miningTarget.col]]?.color || '#00ff88';
        ctx.fillRect(bx, by, barW*progress, barH);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('MINING...', canvas.width/2, by-4);
        ctx.textAlign = 'left';
      }
    }
  },

  leave() {
    if(this.animFrame) cancelAnimationFrame(this.animFrame);
    this.stopMining();
    this.world = [];
    this.players.clear();
    this.myId = null;
    this.myPlayer = null;
    if(Network.socket) Network.socket.disconnect();
    document.getElementById('game-screen').classList.remove('active');
  }
};

function spawnFloatText(x, y, text, color) {
  const area = document.getElementById('game-area');
  const el = document.createElement('div');
  el.className = 'float-text';
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  el.style.color = color;
  el.textContent = text;
  area.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}
