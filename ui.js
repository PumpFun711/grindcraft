const UI = {
  char: {
    skin: SKIN_COLORS[0],
    hair: HAIR_COLORS[0],
    shirt: SHIRT_COLORS[0],
    pants: PANTS_COLORS[0],
    nickname: ''
  },

  init() {
    document.getElementById('btn-connect-nav').onclick = () => this.openCharModal();
    document.getElementById('btn-play-now').onclick = () => this.openCharModal();
    document.getElementById('btn-gate-connect').onclick = () => this.openCharModal();
    document.getElementById('btn-spectate').onclick = () => showToast('👁 Spectate mode coming soon!');

    document.getElementById('modal-char-close').onclick = () => this.closeCharModal();
    document.getElementById('btn-enter-world').onclick = () => this.enterWorld();
    document.getElementById('modal-char').onclick = (e) => {
      if(e.target === document.getElementById('modal-char')) this.closeCharModal();
    };

    document.getElementById('char-nickname').oninput = () => {
      this.char.nickname = document.getElementById('char-nickname').value;
      document.getElementById('char-preview-name').textContent = this.char.nickname || 'Player';
      this.updateCharPreview();
    };

    document.getElementById('btn-leave').onclick = () => {
      if(confirm('Leave the server?')) Game.leave();
    };

    document.getElementById('ca-copy').onclick = () => {
      navigator.clipboard.writeText('7xGCpump').catch(() => {});
      showToast('📋 Contract address copied!');
    };

    // Color pickers
    buildColorPicker('skin-colors', SKIN_COLORS, (c) => {
      this.char.skin = c; this.updateCharPreview();
    });
    buildColorPicker('hair-colors', HAIR_COLORS, (c) => {
      this.char.hair = c; this.updateCharPreview();
    });
    buildColorPicker('shirt-colors', SHIRT_COLORS, (c) => {
      this.char.shirt = c; this.updateCharPreview();
    });
    buildColorPicker('pants-colors', PANTS_COLORS, (c) => {
      this.char.pants = c; this.updateCharPreview();
    });

    this.buildPickaxeGrid();
    this.buildBlockGrid();
    this.animateLiveCount();

    // Add controls hint to game area
    this.buildControlsHint();

    Game.init();
  },

  buildControlsHint() {
    const area = document.getElementById('game-area');
    if(!area) return;
    const hint = document.createElement('div');
    hint.id = 'controls-hint';
    hint.innerHTML = `
      <span>W A S D</span> — Move<br>
      <span>Click</span> — Mine block<br>
      <span>Hold</span> — Keep mining<br>
      <span>Shop</span> — Buy pickaxes →
    `;
    area.appendChild(hint);
  },

  // ── CHARACTER ──
  openCharModal() {
    document.getElementById('modal-char').classList.add('open');
    this.updateCharPreview();
  },

  closeCharModal() {
    document.getElementById('modal-char').classList.remove('open');
  },

  updateCharPreview() {
    const cv = document.getElementById('char-preview-canvas');
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.imageSmoothingEnabled = false;
    drawPixelChar(ctx, 10, 4, this.char, 0, 4, 0);
  },

  enterWorld() {
    const nickname = document.getElementById('char-nickname').value.trim() || 'Player';
    this.char.nickname = nickname;
    this.closeCharModal();

    document.getElementById('game-screen').classList.add('active');
    document.getElementById('hud-name').textContent = nickname;

    Network.join({
      nickname,
      skin: this.char.skin,
      hair: this.char.hair,
      shirt: this.char.shirt,
      pants: this.char.pants,
      walletVerified: true
    });
  },

  // ── SIDEBAR ──
  buildBlockLegend() {
    const el = document.getElementById('block-legend');
    if(!el) return;
    el.innerHTML = BLOCKS.map(b =>
      `<div class="block-legend-item">
        <div class="block-legend-dot" style="background:${b.color}"></div>
        <span>${b.name}</span>
        <span class="block-legend-pts">+${b.pts}</span>
      </div>`
    ).join('');
  },

  buildShop(player) {
    const el = document.getElementById('shop-list');
    if(!el || !player) return;
    el.innerHTML = PICKS.map((p, i) => {
      const owned = i <= player.pickaxe;
      const isNext = i === player.pickaxe + 1;
      const canAfford = player.points >= p.cost && isNext;
      const label = owned
        ? `✓ ${p.name} Pickaxe`
        : `${p.name} — ${p.cost.toLocaleString()} pts`;
      return `<button
        class="shop-btn${owned ? ' owned' : ''}"
        ${!owned && !canAfford ? 'disabled' : ''}
        onclick="Network.buyPickaxe(${i})"
        style="${owned ? `color:${p.color}` : ''}"
      >${label}</button>`;
    }).join('');
  },

  updateLeaderboard(data) {
    const el = document.getElementById('leaderboard-list');
    if(!el) return;
    el.innerHTML = data.map((p, i) => {
      const isMe = Game.myPlayer && p.nickname === Game.myPlayer.nickname;
      const medals = ['🥇','🥈','🥉'];
      const rank = medals[i] || `${i+1}.`;
      return `<div class="lb-item${isMe ? ' me' : ''}">
        <span><span class="lb-rank">${rank}</span>${p.nickname}</span>
        <span class="lb-pts">${p.points.toLocaleString()}</span>
      </div>`;
    }).join('');
  },

  // ── LANDING PAGE ──
  buildPickaxeGrid() {
    const PICK_EMOJIS = ['🪵','🪨','⚙️','✨','💎','⛏'];
    document.getElementById('picks-grid').innerHTML = PICKS.map((p, i) =>
      `<div class="pick-card${i === PICKS.length-1 ? ' featured' : ''}">
        <span class="pick-emoji">${PICK_EMOJIS[i]}</span>
        <div class="pick-name" style="color:${p.color}">${p.name} Pickaxe</div>
        <div class="pick-cost" style="color:${i===PICKS.length-1?'#00ff88':'rgba(255,255,255,0.5)'}">
          ${p.cost === 0 ? 'Free' : p.cost.toLocaleString() + ' pts'}
        </div>
        <div class="pick-power">Power: ${p.power}×</div>
      </div>`
    ).join('');
  },

  buildBlockGrid() {
    const RARE_COLORS = ['#888','#888','#888','#888','#4fc3f7','#4fc3f7','#4fc3f7','#ffd700','#ffd700','#ffd700','#aa44ff','#aa44ff','#00ff88'];
    const RARE_NAMES  = ['Common','Common','Common','Common','Uncommon','Uncommon','Uncommon','Rare','Rare','Rare','Epic','Epic','Legendary'];
    document.getElementById('blocks-grid').innerHTML = BLOCKS.map((b, i) =>
      `<div class="block-card">
        <div class="block-swatch" style="background:${b.color};border:1px solid rgba(255,255,255,0.1)"></div>
        <div>
          <div class="block-name">${b.name}</div>
          <div class="block-pts">+${b.pts} pts</div>
          <div class="block-rare" style="color:${RARE_COLORS[i]}">${RARE_NAMES[i]}</div>
        </div>
      </div>`
    ).join('');
  },

  animateLiveCount() {
    let base = 847;
    setInterval(() => {
      base += Math.floor((Math.random() - 0.45) * 3);
      base = Math.max(600, Math.min(1200, base));
      const el = document.getElementById('live-players');
      if(el) el.textContent = base.toLocaleString() + ' players online';
    }, 3000);
  }
};

window.addEventListener('DOMContentLoaded', () => {
  UI.init();
});
