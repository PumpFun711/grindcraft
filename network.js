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
      console.log('[Network] Disconnected');
      showToast('❌ Disconnected from server. Reconnecting...');
    });

    this.socket.on('error', (data) => {
      showToast('❌ ' + data.message);
    });

    // Server sends full world + all players on join
    this.socket.on('init', (data) => {
      console.log('[Network] Init received, room:', data.roomName);
      Game.onInit(data);
    });

    // Another player joined
    this.socket.on('playerJoined', (data) => {
      Game.onPlayerJoined(data);
    });

    // Another player moved
    this.socket.on('playerMoved', (data) => {
      Game.onPlayerMoved(data);
    });

    // Another player left
    this.socket.on('playerLeft', (data) => {
      Game.onPlayerLeft(data);
    });

    // A block was fully broken (by anyone)
    this.socket.on('blockBroken', (data) => {
      Game.onBlockBroken(data);
    });

    // Your hit registered but block not broken yet
    this.socket.on('blockHit', (data) => {
      Game.onBlockHit(data);
    });

    // Your pickaxe was upgraded
    this.socket.on('pickaxeUpgraded', (data) => {
      Game.onPickaxeUpgraded(data);
    });

    // Another player changed pickaxe
    this.socket.on('playerPickaxeChanged', (data) => {
      Game.onPlayerPickaxeChanged(data);
    });

    // Leaderboard update
    this.socket.on('leaderboard', (data) => {
      UI.updateLeaderboard(data);
    });
  },

  // Join a room with character data
  join(playerData) {
    if (!this.socket) return;
    this.socket.emit('join', playerData);
  },

  // Send player position
  move(x, y, frame) {
    if (!this.socket) return;
    this.socket.emit('move', { x, y, frame });
  },

  // Mine a block
  mineBlock(col, row) {
    if (!this.socket) return;
    this.socket.emit('mineBlock', { col, row });
  },

  // Buy a pickaxe upgrade
  buyPickaxe(tier) {
    if (!this.socket) return;
    this.socket.emit('buyPickaxe', { tier });
  },

  // Request leaderboard
  getLeaderboard() {
    if (!this.socket) return;
    this.socket.emit('getLeaderboard');
  }
};
