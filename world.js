const TILE_SIZE = 32;
const WORLD_COLS = 40;
const WORLD_ROWS = 30;

// Isometric world renderer
const WorldRenderer = {
  canvas: null,
  ctx: null,
  cracks: {}, // { "col,row": { hits, hitsNeeded } }

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

  // Convert grid col/row to canvas x/y (top-down 2D view)
  toScreen(col, row) {
    return {
      x: col * TILE_SIZE,
      y: row * TILE_SIZE
    };
  },

  drawWorld(world) {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;

    // Sky background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#87ceeb');
    skyGrad.addColorStop(0.15, '#5ba3d0');
    skyGrad.addColorStop(1, '#1a0a00');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // Sun
    ctx.fillStyle = '#ffe566';
    ctx.fillRect(W - 80, 20, 40, 40);
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(W - 76, 24, 32, 32);

    // Draw blocks
    for (let r = 0; r < WORLD_ROWS; r++) {
      for (let c = 0; c < WORLD_COLS; c++) {
        const idx = r * WORLD_COLS + c;
        const blockType = world[idx];
        if (blockType < 0) continue;

        const B = BLOCKS[blockType];
        const { x, y } = this.toScreen(c, r);

        // Skip if off screen
        if (x > W || y > H || x + TILE_SIZE < 0 || y + TILE_SIZE < 0) continue;

        // Block face
        ctx.fillStyle = B.color;
        ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);

        // Top highlight
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, 4);

        // Left highlight
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(x + 1, y + 1, 3, TILE_SIZE - 2);

        // Border
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);

        // $GC ore glow
        if (blockType === 12) {
          ctx.shadowColor = '#00ff88';
          ctx.shadowBlur = 8;
          ctx.fillStyle = 'rgba(0,255,136,0.15)';
          ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
          ctx.shadowBlur = 0;
        }

        // Crack overlay
        const key = `${c},${r}`;
        if (this.cracks[key]) {
          const { hits, hitsNeeded } = this.cracks[key];
          const progress = hits / hitsNeeded;
          ctx.fillStyle = `rgba(0,0,0,${progress * 0.55})`;
          ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
          // Crack lines
          ctx.strokeStyle = `rgba(0,0,0,${progress * 0.9})`;
          ctx.lineWidth = 1;
          if (progress > 0.2) { ctx.beginPath(); ctx.moveTo(x+8,y+4); ctx.lineTo(x+14,y+20); ctx.stroke(); }
          if (progress > 0.4) { ctx.beginPath(); ctx.moveTo(x+20,y+6); ctx.lineTo(x+10,y+26); ctx.stroke(); }
          if (progress > 0.6) { ctx.beginPath(); ctx.moveTo(x+4,y+14); ctx.lineTo(x+28,y+18); ctx.stroke(); }
          if (progress > 0.8) { ctx.beginPath(); ctx.moveTo(x+16,y+4); ctx.lineTo(x+6,y+28); ctx.stroke(); }
        }

        // Block label (only for rare blocks)
        if (blockType >= 10) {
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.font = 'bold 7px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(B.name.split(' ')[0], x + TILE_SIZE/2, y + TILE_SIZE - 5);
          ctx.textAlign = 'left';
        }
      }
    }
  },

  setCrack(col, row, hits, hitsNeeded) {
    const key = `${col},${row}`;
    if (hits <= 0) {
      delete this.cracks[key];
    } else {
      this.cracks[key] = { hits, hitsNeeded };
    }
  },

  clearCrack(col, row) {
    delete this.cracks[`${col},${row}`];
  },

  // Get block col/row from mouse click position
  getBlockAt(mouseX, mouseY) {
    const col = Math.floor(mouseX / TILE_SIZE);
    const row = Math.floor(mouseY / TILE_SIZE);
    if (col < 0 || col >= WORLD_COLS || row < 0 || row >= WORLD_ROWS) return null;
    return { col, row };
  }
};
