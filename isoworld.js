// Landing page animated isometric world background
(function () {
  const canvas = document.getElementById('iso-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  let W, H, t = 0;
  const TW = 72, TH = 36;
  let tiles = [], chars = [], particles = [];

  const TILE_TYPES = [
    { top: '#5a8c3e', sl: '#3d6128', sr: '#2e4d1e' }, // grass
    { top: '#8B6914', sl: '#5a3f0a', sr: '#3d2a06' }, // dirt
    { top: '#888888', sl: '#555555', sr: '#3a3a3a' }, // stone
    { top: '#5a9e3e', sl: '#3d7128', sr: '#2e5a1e' }, // bright grass
    { top: '#d9c47a', sl: '#a08840', sr: '#7a6428' }, // sand
  ];

  const CHAR_PRESETS = [
    { skin: '#f4b07a', hair: '#3b2314', shirt: '#3a6bc7', pants: '#2a3a6e', name: 'MineKing' },
    { skin: '#d4956a', hair: '#111111', shirt: '#c73a3a', pants: '#2a2a2a', name: 'GCHolder' },
    { skin: '#8b5e3c', hair: '#4a2a0a', shirt: '#3ac76b', pants: '#1a3a1a', name: 'DiamondD' },
    { skin: '#fddbb4', hair: '#d4b483', shirt: '#c7973a', pants: '#3a2a1a', name: 'PickMstr' },
    { skin: '#c07840', hair: '#1a0a00', shirt: '#8b3ac7', pants: '#2a1a3a', name: 'GrindBro' },
    { skin: '#f4b07a', hair: '#cc2222', shirt: '#1a7a7a', pants: '#0a2a2a', name: 'BlockBos' },
    { skin: '#d4956a', hair: '#888888', shirt: '#444444', pants: '#222222', name: 'StoneCut' },
    { skin: '#fddbb4', hair: '#7b4f1f', shirt: '#5a2a7a', pants: '#2a1a4a', name: 'OreHuntr' },
  ];

  function isoX(c, r) { return W / 2 + (c - r) * (TW / 2); }
  function isoY(c, r) { return H * 0.38 + (c + r) * (TH / 2); }

  function shadeC(hex, amt) {
    let r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    r = Math.max(0,Math.min(255,r+amt)); g = Math.max(0,Math.min(255,g+amt)); b = Math.max(0,Math.min(255,b+amt));
    return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
  }

  function buildWorld() {
    tiles = []; chars = [];
    const COLS = 20, ROWS = 20;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const rnd = Math.random();
        let type = rnd < 0.08 ? 2 : rnd < 0.13 ? 4 : rnd < 0.55 ? 0 : 1;
        const sp = rnd > 0.9 ? 'tree' : rnd > 0.95 ? 'ore' : rnd > 0.975 ? 'gc' : null;
        tiles.push({ c, r, type, sp, phase: Math.random() * Math.PI * 2 });
      }
    }
    CHAR_PRESETS.forEach(preset => {
      chars.push({
        col: 4 + Math.random() * 12,
        row: 4 + Math.random() * 12,
        dc: (Math.random() - 0.5) * 0.018,
        dr: (Math.random() - 0.5) * 0.018,
        preset,
        frame: 0,
        tick: Math.random() * Math.PI * 2,
        walkTick: 0
      });
    });
  }

  function drawIsoTile(ti) {
    const { c, r, type, sp, phase } = ti;
    const x = isoX(c, r), y = isoY(c, r);
    const T = TILE_TYPES[type] || TILE_TYPES[0];
    const H2 = TH * 0.55;

    // Top face
    ctx.beginPath();
    ctx.moveTo(x, y - TH/2); ctx.lineTo(x + TW/2, y);
    ctx.lineTo(x, y + TH/2); ctx.lineTo(x - TW/2, y);
    ctx.closePath();
    ctx.fillStyle = T.top; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 0.5; ctx.stroke();

    // Left face
    ctx.beginPath();
    ctx.moveTo(x - TW/2, y); ctx.lineTo(x, y + TH/2);
    ctx.lineTo(x, y + TH/2 + H2); ctx.lineTo(x - TW/2, y + H2);
    ctx.closePath();
    ctx.fillStyle = T.sl; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.stroke();

    // Right face
    ctx.beginPath();
    ctx.moveTo(x, y + TH/2); ctx.lineTo(x + TW/2, y);
    ctx.lineTo(x + TW/2, y + H2); ctx.lineTo(x, y + TH/2 + H2);
    ctx.closePath();
    ctx.fillStyle = T.sr; ctx.fill(); ctx.stroke();

    if (sp === 'tree') drawIsoTree(x, y, phase);
    if (sp === 'ore') drawIsoOre(x, y, '#c0896e', false);
    if (sp === 'gc') drawIsoOre(x, y, '#00ff88', true);
  }

  function drawIsoTree(x, y, phase) {
    const bob = Math.sin(t * 0.7 + phase) * 1.8;
    ctx.fillStyle = '#6b3d1a';
    ctx.fillRect(x - 4, y - TH/2 - 28, 8, 28);
    ctx.fillStyle = '#4a2510';
    ctx.fillRect(x + 2, y - TH/2 - 28, 3, 28);
    [[0,-64,32,26],[0,-50,26,20],[0,-38,20,14]].forEach(([dx,dy,w,h]) => {
      ctx.fillStyle = '#1a4a1a';
      ctx.fillRect(x+dx-w/2+2, y+dy+h*0.3+bob, w, h*0.5);
      ctx.fillStyle = '#2d7a2d';
      ctx.fillRect(x+dx-w/2, y+dy+bob, w, h);
      ctx.fillStyle = '#3a9a3a';
      ctx.fillRect(x+dx-w/2, y+dy+bob, w, 4);
    });
  }

  function drawIsoOre(x, y, color, glow) {
    if (glow) { ctx.shadowColor = color; ctx.shadowBlur = 8; }
    ctx.fillStyle = color;
    [[-12,-2],[8,-6],[2,4],[16,0],[-4,6],[10,5]].forEach(([dx,dy]) => {
      ctx.fillRect(x+dx-2, y+dy-2, 5, 5);
    });
    ctx.shadowBlur = 0;
  }

  function drawIsoChar(ch) {
    ch.col += ch.dc; ch.row += ch.dr;
    if (ch.col < 2 || ch.col > 17) ch.dc *= -1;
    if (ch.row < 2 || ch.row > 17) ch.dr *= -1;
    ch.tick += 0.06;
    ch.walkTick += Math.abs(ch.dc) + Math.abs(ch.dr);
    ch.frame = Math.floor(ch.walkTick * 8) % 2;

    const x = isoX(ch.col, ch.row);
    const y = isoY(ch.col, ch.row) - TH / 2;
    const S = 2;
    const bob = Math.sin(ch.tick * 2) * 1;
    const charH = 20 * S;

    // Name tag
    const nm = ch.preset.name;
    ctx.font = `bold 8px 'Courier New', monospace`;
    const tw = ctx.measureText(nm).width;
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(x - tw/2 - 4, y - charH - 14 + bob, tw + 8, 13);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#00ff88';
    ctx.textAlign = 'center';
    ctx.fillText(nm, x, y - charH - 4 + bob);
    ctx.textAlign = 'left';

    // Pixel sprite
    drawPixelChar(ctx, x - 4*S, y - charH + bob, ch.preset, ch.frame, S);
  }

  function resize() {
    W = canvas.offsetWidth;
    H = canvas.offsetHeight;
    canvas.width = W;
    canvas.height = H;
    ctx.imageSmoothingEnabled = false;
    buildWorld();
  }

  function loop() {
    requestAnimationFrame(loop);
    t += 0.018;
    ctx.clearRect(0, 0, W, H);

    // Sort tiles back to front
    [...tiles].sort((a, b) => (a.c + a.r) - (b.c + b.r)).forEach(drawIsoTile);

    // Draw characters
    chars.forEach(drawIsoChar);

    // Sparkle particles
    if (Math.random() < 0.05) {
      particles.push({
        x: Math.random() * W, y: Math.random() * H * 0.75,
        life: 1, vx: (Math.random() - 0.5) * 0.6,
        vy: -0.5 - Math.random() * 0.4,
        color: Math.random() > 0.4 ? '#00ff88' : '#ffd700',
        size: Math.random() > 0.5 ? 2 : 3
      });
    }
    particles = particles.filter(p => {
      p.x += p.vx; p.y += p.vy; p.life -= 0.01;
      ctx.globalAlpha = p.life * 0.7;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      ctx.globalAlpha = 1;
      return p.life > 0;
    });
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(loop);
})();
