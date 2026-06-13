const Game = {
  // State
  world: [],
  players: new Map(),
  myId: null,
  myPlayer: null,
  roomName: null,
  animFrame: null,
  lastMove: 0,
  walkTick: 0,
  t: 0,

  init() {
    WorldRenderer.init('game-canvas');
    Network.connect();
    this.bindInput();
  },

  // Called when server sends full world state
  onInit(data) {
    this.world = data.world;
    this.myId = data.playerId;
    this.roomName = data.roomName;

    // Clear and rebuild players map
    this.players.clear();
    data.players.forEach(p => {
      this.players.set(p.id, {
        ...p,
        walkTick: 0,
        frame: 0,
        moving: false
      });
    });

    this.myPlayer = this.players.get(this.myId);

    // Update HUD
    document.getElementById('hud-room').textContent = data.roomName;
    document.getElementById('hud-online').textContent = data.playerCount + '/60';
    document.getElementById('hud-name').textContent = this.myPlayer.nickname;

    // Build sidebar
    UI.buildBlockLegend();
    UI.buildShop(this.myPlayer);
    Network.getLeaderboard();

    // Start game loop
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.loop();

    showToast('⛏ Joined ' + data.roomName + ' — start mining!');
  },

  onPlayerJoined(data) {
    this.players.set(data.id, { ...data, walkTick: 0, frame: 0, moving: false });
    const count = this.players.size;
    document.getElementById('hud-online').textContent = count + '/60';
    showToast('👤 ' + data.nickname + ' joined the server');
  },

  onPlayerMoved(data) {
    const p = this.players.get(data.id);
    if (p) {
      p.x = data.x;
      p.y = data.y;
      p.frame = data.frame;
      p.moving = true;
    }
  },

  onPlayerLeft(data) {
    const p = this.players.get(data.id);
    if (p) showToast('👤 ' + p.nickname + ' left the server');
    this.players.delete(data.id);
    const count = this.players.size;
    document.getElementById('hud-online').textContent = count + '/60';
  },

  onBlockBroken(data) {
    const idx = data.row * WORLD_COLS + data.col;
    this.world[idx] = -1;
    WorldRenderer.clearCrack(data.col, data.row);

    // If it was our block
    if (data.minedBy === this.myId) {
      this.myPlayer.points = data.playerPoints;
      this.myPlayer.totalBlocks = data.playerBlocks;
      document.getElementById('hud-pts').textContent = data.playerPoints.toLocaleString();
      document.getElementById('hud-blocks').textContent = data.playerBlocks;
      UI.buildShop(this.myPlayer);
      spawnFloatText(
        this.myPlayer.x * TILE_SIZE + TILE_SIZE/2,
        this.myPlayer.y * TILE_SIZE - 10,
        '+' + data.points + ' pts',
        BLOCKS[data.blockType] ? BLOCKS[data.blockType].color : '#fff'
      );
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
    if (p) p.pickaxe = data.tier;
  },

  bindInput() {
    const canvas = document.getElementById('game-canvas');
    canvas.addEventListener('click', (e) => {
      if (!this.myPlayer) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const block = WorldRenderer.getBlockAt(mx, my);
      if (!block) return;

      const idx = block.row * WORLD_COLS + block.col;
      if (this.world[idx] < 0) return; // air

      // Move player toward the block
      this.myPlayer.x = block.col;
      this.myPlayer.y = block.row;
      this.walkTick++;
      this.myPlayer.frame = this.walkTick % 2;
      Network.move(this.myPlayer.x, this.myPlayer.y, this.myPlayer.frame);

      // Mine it
      Network.mineBlock(block.col, block.row);
    });
  },

  loop() {
    this.animFrame = requestAnimationFrame(() => this.loop());
    this.t += 0.02;

    const ctx = WorldRenderer.ctx;
    const canvas = WorldRenderer.canvas;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw world
    WorldRenderer.drawWorld(this.world);

    // Draw all players
    this.players.forEach((p, id) => {
      const px = p.x * TILE_SIZE;
      const py = p.y * TILE_SIZE - 20;
      const S = 2;
      const bob = Math.sin(this.t * 3 + (p.x + p.y)) * 1.2;

      drawPixelChar(ctx, px - 8, py + bob, {
        skin: p.skin,
        hair: p.hair,
        shirt: p.shirt,
        pants: p.pants
      }, p.frame || 0, S);

      drawNameTag(ctx, px - 8, py + bob, p.nickname, id === this.myId, S);
    });
  },

  leave() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.world = [];
    this.players.clear();
    this.myId = null;
    this.myPlayer = null;
    if (Network.socket) Network.socket.disconnect();
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
