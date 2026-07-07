const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../modules/auth/model/user.model');

let io;

const getChatRoomId = (bookingId) => {
  const chatId = String(bookingId || '').trim();
  if (!chatId) {
    return '';
  }

  return chatId.startsWith('chat_') ? chatId : `chat_${chatId}`;
};

const initSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user || !user.isActive) {
        return next(new Error('Authentication error: User not found or inactive'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user._id} (${socket.user.role})`);

    // Join a personal room based on user ID for direct notifications/messages
    socket.join(socket.user._id.toString());

    // Join a chat room
    socket.on('joinChat', (bookingId) => {
      const roomId = getChatRoomId(bookingId);
      if (!roomId) {
        return;
      }

      socket.join(roomId);
      console.log(`User ${socket.user._id} joined ${roomId}`);
    });

    socket.on('leaveChat', (bookingId) => {
      const roomId = getChatRoomId(bookingId);
      if (!roomId) {
        return;
      }

      socket.leave(roomId);
      console.log(`User ${socket.user._id} left ${roomId}`);
    });

    // Handle typing indicators
    socket.on('typing', ({ bookingId, isTyping }) => {
      const roomId = getChatRoomId(bookingId);
      if (!roomId) {
        return;
      }

      socket.to(roomId).emit('typing', {
        userId: socket.user._id,
        isTyping
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user._id}`);
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = { initSocket, getIo };
