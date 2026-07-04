const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

let io;

function initSockets(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth && socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    try {
      const payload = jwt.verify(token, env.jwtAccessSecret);
      socket.data.user = { id: payload.sub, role: payload.role };
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const { id, role } = socket.data.user;

    socket.join(`user:${id}`);

    if (role === 'ADMIN') {
      socket.join('admins');
    }
  });

  return io;
}

function emitTaskEvent(event, task) {
  if (!io) return;
  io.to(`user:${task.ownerId}`).to('admins').emit(event, task);
}

module.exports = { initSockets, emitTaskEvent };
