const UI = {
  // Character creation state
  char: {
    skin: SKIN_COLORS[0],
    hair: HAIR_COLORS[0],
    shirt: SHIRT_COLORS[0],
    pants: PANTS_COLORS[0],
    nickname: ''
  },

  walletVerified: false,

  init() {
    // Nav buttons
    document.getElementById('btn-connect-nav').onclick = () => this.openWalletModal();
    document.getElementById('btn-play-now').onclick = () => this.openWalletModal();
    document.getElementById('btn-gate-connect').onclick = () => this.openWalletModal();
    document.getElementById('btn-spectate').onclick = () => showToast('👁 Spectate mode coming soon!');

    // Wallet modal
    document.getElementById('modal-wallet-close').onclick = () => this.closeWalletModal();
    document.getElementById('btn-verify-wallet').onclick = () => this.verifyWallet();
    document.getElementById('modal-wallet').onclick = (e) => {
      if (e.target === document.getElementById('modal-wallet')) this.closeWalletModal();
    };

    // Character modal
    document.getElementById('modal-char-close').onclick = () => this.closeCharModal();
    document.getElementById('btn-enter-world').onclick = () => this.enterWorld();
    document.getElementById('modal-char').onclick = (e) => {
      if (e.target === document.getElementById('modal-char')) this.closeCharModal();
    };
    document.getElementById('char-nickname').oninput = () => {
      this.char.nickname = document.getElementById('char-nickname').value;
      document.getElementById('char-preview-name').textContent = this.char.nickname || 'Player';
      this.updateCharPreview();
    };

    // Leave game
    document.getElementById('btn-leave').onclick = () => {
      if (confirm('Leave the server?')) Game.leave();
    };

    // CA copy
    document.getElementById('ca-copy').onclick = () => {
      navigator.clipboard.writeText('7xGCpump').catch(() => {});
      showToast('📋 Contract address copied!');
    };

    // Build color pickers
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

    // Landing page content
    this.buildPickaxeGrid();
    this.buildBlockGrid();

    // Animate live player count
    this.animateLiveCount();

    // Init game
    Game.init();
  },

  // ── WALLET ──
  openWalletModal() {
    document.getElementById('modal-wallet').classList.add('open');
    document.getElementById('wallet-error').style.display = 'none';
    document.getElementById('wallet-loading').style.display = 'none';
  },

  closeWalletModal() {
    document.getElementById('modal-wallet').classList.remove('open');
  },

  verifyWallet() {
    const input = document.getElementById('wallet-address-input').value.trim();
    const errEl = document.getElementById('wallet-error');
    const loadEl = document.getElementById('wallet-loading');
    errEl.style.display = 'none';

    if (!input) {
      errEl.style.display = 'block';
      errEl.textContent = '❌ Please enter your wallet address.';
      return;
    }

    // Show loading state
    loadEl.style.display = 'block';
    document.getElementById('btn-verify-wallet').disabled = true;

    // Simulate on-chain check (replace with real Solana RPC call)
    setTimeout(() => {
      loadEl.style.display = 'none';
      document.getElementById('btn-verify-wallet').disabled = false;

      // For now accept any valid-looking address (44 chars) or number >= 300000
      const num = parseFloat(input.replace(/[^0-9.]/g, ''));
      const isAddress = input.length >= 32;
      const hasEnough = !isNaN(num) && num >= 300000;

      if (isAddress || hasEnough) {
        this.walletVerified = true;
        this.closeWalletModal();
        this.openCharModal();
      } else {
        errEl.style.display = 'block';
        errEl.textContent = '❌ Insufficient $GC balance. Buy more tokens to play.';
      }
    }, 1800);
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
    drawPixelChar(ctx, 8, 4, this.char, 0, 4);
  },

  enterWorld() {
    const nickname = document.getElementById('char-nickname').value.trim() || 'Player';
    this.char.nickname = nickname;
    this.closeCharModal();

    // Show game screen
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('hud-name').textContent = nickname;

    // Join server
    Network.join({
      nickname,
      skin: this.char.skin,
      hair: this.char.hair,
      shirt: this.char.shirt,
      pants: this.char.pants,
      walletVerified: this.walletVerified
    });
  },

  // ── SIDEBAR ──
  buildBlockLegend() {
    const el = document.getElementById('block-legend');
    if (!el) return;
    el.innerHTML = BLOCKS.map(b =>
      `<div class="block-legend-item">
        <div class="block-legend-dot" style="background:${b.color}"></div>
        <span>${b.name}</span>
        <span style="margin-left:auto;color:#ffd700">${b.pts}pt</span>
      </div>`
    ).join('');
  },

  buildShop(player) {
    const el = document.getElementById('shop-list');
    if (!el || !player) return;
    el.innerHTML = PICKS.map((p, i) => {
      const owned = i <= player.pickaxe;
      const isNext = i === player.pickaxe + 1;
      const canAfford = player.points >= p.cost && isNext;
      const label = owned
        ? '✓ ' + p.name + ' Pickaxe'
        : p.name + ' — ' + p.cost.toLocaleString() + ' pts';
      return `<button
        class="shop-btn${owned ? ' owned' : ''}"
        ${!owned && !canAfford ? 'disabled' : ''}
        onclick="Network.buyPickaxe(${i})"
        style="color:${owned ? p.color : ''}"
      >${label}</button>`;
    }).join('');
  },

  updateLeaderboard(data) {
    const el = document.getElementById('leaderboard-list');
    if (!el) return;
    el.innerHTML = data.map((p, i) => {
      const isMe = Game.myPlayer && p.nickname === Game.myPlayer.nickname;
      return `<div class="lb-item${isMe ? ' me' : ''}">
        <span>${i + 1}. ${p.nickname}</span>
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
    const RARE_COLORS = {
      0:'#888', 1:'#888', 2:'#888', 3:'#888',
      4:'#4fc3f7', 5:'#4fc3f7', 6:'#4fc3f7',
      7:'#ffd700', 8:'#ffd700', 9:'#ffd700',
      10:'#aa44ff', 11:'#aa44ff',
      12:'#00ff88'
    };
    const RARE_NAMES = {
      0:'Common',1:'Common',2:'Common',3:'Common',
      4:'Uncommon',5:'Uncommon',6:'Uncommon',
      7:'Rare',8:'Rare',9:'Rare',
      10:'Epic',11:'Epic',
      12:'Legendary'
    };
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
      if (el) el.textContent = base.toLocaleString() + ' players online';
    }, 3000);
  }
};

// Boot everything when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  UI.init();
});
