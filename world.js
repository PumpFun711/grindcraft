const TILE_SIZE = 48;
const WORLD_COLS = 60;
const WORLD_ROWS = 40;

const WorldRenderer = {
  canvas: null,
  ctx: null,
  cracks: {},
  camX: 0,
  camY: 0,

  init(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  },

  resize() {
    const area = document.getElementById('game-area');
    const sidebar = document.getElementById('game-sidebar');
    this.canvas.width = area.clientWidth - sidebar.clientWidth;
    this.canvas.height = area.clientHeight;
  },

  // Camera follows player
  updateCamera(playerX, playerY) {
    const targetX = playerX * TILE_SIZE - this.canvas.width / 2 + TILE_SIZE / 2;
    const targetY = playerY * TILE_SIZE - this.canvas.height / 2 + TILE_SIZE / 2;
    // Smooth camera
    this.camX += (targetX - this.camX) * 0.12;
    this.camY += (targetY - this.camY) * 0.12;
    // Clamp to world bounds
    this.camX = Math.max(0, Math.min(this.camX, WORLD_COLS * TILE_SIZE - this.canvas.width));
    this.camY = Math.max(0, Math.min(this.camY, WORLD_ROWS * TILE_SIZE - this.canvas.height));
  },

  worldToScreen(col, row) {
    return {
      x: col * TILE_SIZE - this.camX,
      y: row * TILE_SIZE - this.camY
    };
  },

  screenToWorld(sx, sy) {
    return {
      col: Math.floor((sx + this.camX) / TILE_SIZE),
      row: Math.floor((sy + this.camY) / TILE_SIZE)
    };
  },

  drawBlock(ctx, x, y, blockType) {
    const B = BLOCKS[blockType];
    const T = TILE_SIZE;

    // Base color
    ctx.fillStyle = B.color;
    ctx.fillRect(x, y, T, T);

    // Draw pixel art texture per block type
    switch(blockType) {
      case 0: this.drawDirt(ctx, x, y, T); break;
      case 1: this.drawGrass(ctx, x, y, T); break;
      case 2: this.drawSand(ctx, x, y, T); break;
      case 3: this.drawWood(ctx, x, y, T); break;
      case 4: this.drawStone(ctx, x, y, T); break;
      case 5: this.drawCoal(ctx, x, y, T); break;
      case 6: this.drawOre(ctx, x, y, T, '#c0896e', '#e8b090'); break;
      case 7: this.drawOre(ctx, x, y, T, '#d4af37', '#f0d060'); break;
      case 8: this.drawOre(ctx, x, y, T, '#cc2200', '#ff4422'); break;
      case 9: this.drawOre(ctx, x, y, T, '#1a3db5', '#4466ff'); break;
      case 10: this.drawOre(ctx, x, y, T, '#00b865', '#00ff88'); break;
      case 11: this.drawDiamond(ctx, x, y, T); break;
      case 12: this.drawGCOre(ctx, x, y, T); break;
    }

    // Border
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, T - 1, T - 1);
  },

  drawDirt(ctx, x, y, T) {
    const spots = [[8,6],[20,14],[36,8],[12,28],[30,32],[42,20],[6,38],[38,36]];
    spots.forEach(([dx,dy]) => {
      ctx.fillStyle = '#6b4f0a';
      ctx.fillRect(x+dx, y+dy, 5, 3);
    });
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(x, y, T, 3);
    ctx.fillRect(x, y, 3, T);
  },

  drawGrass(ctx, x, y, T) {
    // Dirt base
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(x, y+10, T, T-10);
    // Dirt spots
    [[8,18],[22,26],[36,14],[14,34],[40,30]].forEach(([dx,dy]) => {
      ctx.fillStyle = '#6b4f0a';
      ctx.fillRect(x+dx, y+dy, 5, 3);
    });
    // Grass top
    ctx.fillStyle = '#5a8c3e';
    ctx.fillRect(x, y, T, 12);
    // Grass highlight
    ctx.fillStyle = '#6aaa4e';
    ctx.fillRect(x, y, T, 4);
    // Grass blades
    ctx.fillStyle = '#4a7a2e';
    [4,10,18,26,34,40].forEach(dx => {
      ctx.fillRect(x+dx, y+2, 2, 6);
    });
    ctx.fillStyle = '#7acc5e';
    [7,15,22,30,38,44].forEach(dx => {
      ctx.fillRect(x+dx, y, 2, 4);
    });
  },

  drawSand(ctx, x, y, T) {
    ctx.fillStyle = '#c8b460';
    [[6,4],[18,12],[32,6],[10,24],[28,30],[42,18],[4,36],[38,38]].forEach(([dx,dy]) => {
      ctx.fillRect(x+dx, y+dy, 4, 2);
    });
    ctx.fillStyle = 'rgba(255,255,200,0.15)';
    ctx.fillRect(x, y, T, 3);
  },

  drawWood(ctx, x, y, T) {
    // Wood grain lines
    ctx.fillStyle = '#8a5f30';
    [6,14,22,30,38].forEach(dy => {
      ctx.fillRect(x+2, y+dy, T-4, 2);
    });
    ctx.fillStyle = '#c09060';
    [0,8,16,24,32,40].forEach(dy => {
      ctx.fillRect(x+2, y+dy, T-4, 6);
    });
    // Bark edges
    ctx.fillStyle = '#6b3d1a';
    ctx.fillRect(x, y, 4, T);
    ctx.fillRect(x+T-4, y, 4, T);
  },

  drawStone(ctx, x, y, T) {
    // Stone cracks
    ctx.fillStyle = '#666666';
    ctx.fillRect(x+2, y+2, T-4, T-4);
    ctx.fillStyle = '#555555';
    [[4,8,20,2],[10,20,2,16],[28,4,2,20],[6,30,28,2],[32,22,12,2]].forEach(([rx,ry,rw,rh]) => {
      ctx.fillRect(x+rx, y+ry, rw, rh);
    });
    ctx.fillStyle = '#999999';
    ctx.fillRect(x, y, T, 2);
    ctx.fillRect(x, y, 2, T);
    ctx.fillStyle = '#444444';
    ctx.fillRect(x, y+T-2, T, 2);
    ctx.fillRect(x+T-2, y, 2, T);
  },

  drawCoal(ctx, x, y, T) {
    this.drawStone(ctx, x, y, T);
    ctx.fillStyle = '#1a1a1a';
    [[8,8,10,8],[24,16,8,10],[10,28,12,8],[30,30,10,6]].forEach(([rx,ry,rw,rh]) => {
      ctx.fillRect(x+rx, y+ry, rw, rh);
    });
    ctx.fillStyle = '#333333';
    [[10,10,4,4],[26,18,4,4]].forEach(([rx,ry,rw,rh]) => {
      ctx.fillRect(x+rx, y+ry, rw, rh);
    });
  },

  drawOre(ctx, x, y, T, oreColor, oreHighlight) {
    this.drawStone(ctx, x, y, T);
    const spots = [[6,6,8,6],[26,10,10,6],[8,24,8,8],[28,26,10,6],[16,16,8,6]];
    spots.forEach(([rx,ry,rw,rh]) => {
      ctx.fillStyle = oreColor;
      ctx.fillRect(x+rx, y+ry, rw, rh);
      ctx.fillStyle = oreHighlight;
      ctx.fillRect(x+rx, y+ry, rw, 2);
      ctx.fillRect(x+rx, y+ry, 2, rh);
    });
  },

  drawDiamond(ctx, x, y, T) {
    this.drawStone(ctx, x, y, T);
    const spots = [[6,6,10,8],[28,8,10,8],[8,26,10,8],[28,28,10,8],[18,16,10,8]];
    spots.forEach(([rx,ry,rw,rh]) => {
      ctx.fillStyle = '#2aafd4';
      ctx.fillRect(x+rx, y+ry, rw, rh);
      ctx.fillStyle = '#88eeff';
      ctx.fillRect(x+rx, y+ry, rw, 2);
      ctx.fillRect(x+rx, y+ry, 2, rh);
      ctx.fillStyle = 'rgba(136,238,255,0.4)';
      ctx.fillRect(x+rx+2, y+ry+2, 3, 3);
    });
  },

  drawGCOre(ctx, x, y, T) {
    this.drawStone(ctx, x, y, T);
    // Glow effect
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 12;
    const spots = [[4,4,12,10],[28,6,12,10],[6,26,12,10],[28,28,12,10],[16,14,14,10]];
    spots.forEach(([rx,ry,rw,rh]) => {
      ctx.fillStyle = '#00cc66';
      ctx.fillRect(x+rx, y+ry, rw, rh);
      ctx.fillStyle = '#00ff88';
      ctx.fillRect(x+rx, y+ry, rw, 3);
      ctx.fillRect(x+rx, y+ry, 3, rh);
      ctx.fillStyle = 'rgba(0,255,136,0.6)';
      ctx.fillRect(x+rx+2, y+ry+2, 4, 4);
    });
    ctx.shadowBlur = 0;
  },

  drawWorld(world, highlightCol, highlightRow) {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;

    // Background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#1a1a2e');
    skyGrad.addColorStop(1, '#0a0a14');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // Visible tile range
    const startCol = Math.floor(this.camX / TILE_SIZE) - 1;
    const startRow = Math.floor(this.camY / TILE_SIZE) - 1;
    const endCol = startCol + Math.ceil(W / TILE_SIZE) + 2;
    const endRow = startRow + Math.ceil(H / TILE_SIZE) + 2;

    for (let r = Math.max(0, startRow); r < Math.min(WORLD_ROWS, endRow); r++) {
      for (let c = Math.max(0, startCol); c < Math.min(WORLD_COLS, endCol); c++) {
        const idx = r * WORLD_COLS + c;
        const blockType = world[idx];
        if (blockType < 0) continue;

        const { x, y } = this.worldToScreen(c, r);

        // Depth darkness
        const depth = r / WORLD_ROWS;
        this.drawBlock(ctx, x, y, blockType);

        // Depth overlay (gets darker underground)
        if (depth > 0.15) {
          ctx.fillStyle = `rgba(0,0,0,${Math.min(0.6, (depth - 0.15) * 0.9)})`;
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        }

        // Hover highlight
        if (c === highlightCol && r === highlightRow) {
          ctx.fillStyle = 'rgba(255,255,255,0.18)';
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = 'rgba(255,255,255,0.7)';
          ctx.lineWidth = 2;
          ctx.strokeRect(x+1, y+1, TILE_SIZE-2, TILE_SIZE-2);
        }

        // Crack overlay
        const key = `${c},${r}`;
        if (this.cracks[key]) {
          const { hits, hitsNeeded } = this.cracks[key];
          const progress = hits / hitsNeeded;
          ctx.fillStyle = `rgba(0,0,0,${progress * 0.5})`;
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = `rgba(0,0,0,${progress})`;
          ctx.lineWidth = 1;
          if (progress > 0.2) { ctx.beginPath(); ctx.moveTo(x+8,y+4); ctx.lineTo(x+18,y+28); ctx.stroke(); }
          if (progress > 0.4) { ctx.beginPath(); ctx.moveTo(x+28,y+6); ctx.lineTo(x+14,y+36); ctx.stroke(); }
          if (progress > 0.6) { ctx.beginPath(); ctx.moveTo(x+4,y+18); ctx.lineTo(x+40,y+24); ctx.stroke(); }
          if (progress > 0.8) { ctx.beginPath(); ctx.moveTo(x+20,y+4); ctx.lineTo(x+8,y+40); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x+36,y+10); ctx.lineTo(x+24,y+44); ctx.stroke(); }
        }
      }
    }
  },

  setCrack(col, row, hits, hitsNeeded) {
    const key = `${col},${row}`;
    if (hits <= 0) delete this.cracks[key];
    else this.cracks[key] = { hits, hitsNeeded };
  },

  clearCrack(col, row) {
    delete this.cracks[`${col},${row}`];
  },

  getBlockAt(mouseX, mouseY) {
    const col = Math.floor((mouseX + this.camX) / TILE_SIZE);
    const row = Math.floor((mouseY + this.camY) / TILE_SIZE);
    if (col < 0 || col >= WORLD_COLS || row < 0 || row >= WORLD_ROWS) return null;
    return { col, row };
  }
};
