const Network = {
  socket: null,
  connected: false,
  playerId: null,

  connect() {
    this.socket = io();

    this.socket.on('connect', () => {
      this.connected = true;
      this.playerId = this.socket.id;
      console.log('[Network] Connected:', this.playerId);
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      showToast('❌ Disconnected. Reconnecting...');
    });

    this.socket.on('error', (data) => {
      showToast('❌ ' + data.message);
    });

    this.socket.on('init', (data) => {
      Game.onInit(data);
    });

    this.socket.on('playerJoined', (data) => {
      Game.onPlayerJoined(data);
    });

    this.socket.on('playerMoved', (data) => {
      Game.onPlayerMoved(data);
    });

    this.socket.on('playerLeft', (data) => {
      Game.onPlayerLeft(data);
    });

    this.socket.on('blockBroken', (data) => {
      Game.onBlockBroken(data);
    });

    this.socket.on('blockHit', (data) => {
      Game.onBlockHit(data);
    });

    this.socket.on('pickaxeUpgraded', (data) => {
      Game.onPickaxeUpgraded(data);
    });

    this.socket.on('playerPickaxeChanged', (data) => {
      Game.onPlayerPickaxeChanged(data);
    });

    this.socket.on('leaderboard', (data) => {
      UI.updateLeaderboard(data);
    });
  },

  join(playerData) {
    if(!this.socket) return;
    this.socket.emit('join', playerData);
  },

  move(x, y, direction, walkFrame) {
    if(!this.socket) return;
    this.socket.emit('move', { x, y, direction, walkFrame });
  },

  mineBlock(col, row) {
    if(!this.socket) return;
    this.socket.emit('mineBlock', { col, row });
  },

  buyPickaxe(tier) {
    if(!this.socket) return;
    this.socket.emit('buyPickaxe', { tier });
  },

  getLeaderboard() {
    if(!this.socket) return;
    this.socket.emit('getLeaderboard');
  }
};
