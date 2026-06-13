const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const RoomManager = require('./rooms');

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', rooms: roomManager.getRoomStats() });
});

const roomManager = new RoomManager();

io.on('connection', (socket) => {
  console.log(`[+] Player connected: ${socket.id}`);

  socket.on('join', (data) => {
    const { nickname, skin, hair, shirt, pants } = data;

    const room = roomManager.joinRoom(socket.id, {
      nickname: nickname || 'Player',
      skin, hair, shirt, pants,
      x: 5 + Math.floor(Math.random() * 10),
      y: 3 + Math.floor(Math.random() * 5),
      points: 0,
      totalBlocks: 0,
      pickaxe: 0
    });

    socket.join(room.id);
    socket.roomId = room.id;

    socket.emit('init', {
      playerId: socket.id,
      roomId: room.id,
      roomName: room.name,
      playerCount: room.getPlayerCount(),
      world: room.world,
      players: room.getPlayersData()
    });

    socket.to(room.id).emit('playerJoined', {
      id: socket.id,
      ...room.getPlayer(socket.id)
    });

    console.log(`[Room ${room.name}] ${nickname} joined (${room.getPlayerCount()}/60)`);
  });

  socket.on('move', (data) => {
    const room = roomManager.getRoom(socket.roomId);
    if (!room) return;
    room.updatePlayerPosition(socket.id, data.x, data.y);
    socket.to(socket.roomId).emit('playerMoved', {
      id: socket.id,
      x: data.x,
      y: data.y,
      frame: data.frame
    });
  });

  socket.on('mineBlock', (data) => {
    const room = roomManager.getRoom(socket.roomId);
    if (!room) return;

    const result = room.mineBlock(socket.id, data.col, data.row);
    if (!result) return;

    if (result.broken) {
      io.to(socket.roomId).emit('blockBroken', {
        col: data.col,
        row: data.row,
        minedBy: socket.id,
        points: result.points,
        playerPoints: result.playerPoints,
        playerBlocks: result.playerBlocks,
        blockType: result.blockType
      });
    } else {
      socket.emit('blockHit', {
        col: data.col,
        row: data.row,
        hitsLeft: result.hitsLeft,
        hitsNeeded: result.hitsNeeded
      });
    }
  });

  socket.on('buyPickaxe', (data) => {
    const room = roomManager.getRoom(socket.roomId);
    if (!room) return;

    const result = room.buyPickaxe(socket.id, data.tier);
    if (result.success) {
      socket.emit('pickaxeUpgraded', {
        tier: data.tier,
        newPoints: result.newPoints
      });
      socket.to(socket.roomId).emit('playerPickaxeChanged', {
        id: socket.id,
        tier: data.tier
      });
    } else {
      socket.emit('error', { message: result.message });
    }
  });

  socket.on('getLeaderboard', () => {
    const room = roomManager.getRoom(socket.roomId);
    if (!room) return;
    socket.emit('leaderboard', room.getLeaderboard());
  });

  socket.on('disconnect', () => {
    const room = roomManager.getRoom(socket.roomId);
    if (room) {
      room.removePlayer(socket.id);
      io.to(socket.roomId).emit('playerLeft', { id: socket.id });
      console.log(`[-] ${socket.id} left room ${room.name} (${room.getPlayerCount()}/60)`);
      if (room.getPlayerCount() === 0) {
        roomManager.removeRoom(room.id);
      }
    }
  });
});

setInterval(() => {
  roomManager.getAllRooms().forEach(room => {
    io.to(room.id).emit('leaderboard', room.getLeaderboard());
  });
}, 10000);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`\n⛏  GrindCraft server running on port ${PORT}`);
  console.log(`   http://localhost:${PORT}\n`);
});
