const Message = require('../model/message.model');
const { getIo } = require('../../../config/socket');
const { createNotification } = require('../../notifications/service/notification.service');

const getChatHistory = async (chatId, userId) => {
  // Verify that the user is part of this conversation
  const messages = await Message.find({ chatId })
    .populate('senderId', 'name email')
    .populate('receiverId', 'name email')
    .sort({ createdAt: 1 })
    .lean();

  // Verify user is either sender or receiver in at least one message
  const isParticipant = messages.some(
    (msg) => msg.senderId._id.toString() === userId.toString() || 
             msg.receiverId._id.toString() === userId.toString()
  );

  if (messages.length > 0 && !isParticipant) {
    const error = new Error('Not authorized to view this chat');
    error.statusCode = 403;
    throw error;
  }

  // Mark messages as read if the current user is the receiver
  await Message.updateMany(
    { chatId, receiverId: userId, isRead: false },
    { isRead: true }
  );

  return messages;
};

const sendMessage = async (userId, { chatId, receiverId, bookingId, text }) => {
  if (!chatId || !receiverId || !text) {
    const error = new Error('chatId, receiverId, and text are required');
    error.statusCode = 422;
    throw error;
  }

  const message = await Message.create({
    chatId,
    senderId: userId,
    receiverId,
    bookingId: bookingId || null,
    text,
    isRead: false,
  });

  const populatedMessage = await message.populate('senderId', 'name email').populate('receiverId', 'name email');

  // Emit real-time message via socket
  try {
    const io = getIo();
    // Emit to the specific chat room
    io.to(`chat_${chatId}`).emit('receiveMessage', populatedMessage);
    // Also emit to the receiver's personal room for global notification if they aren't in the chat screen
    io.to(receiverId.toString()).emit('newMessageNotification', populatedMessage);
  } catch (e) {
    console.log('Socket not ready');
  }

  // Create notification
  await createNotification(
    receiverId,
    `New Message from ${populatedMessage.senderId.name}`,
    text.length > 30 ? text.substring(0, 30) + '...' : text,
    'NEW_MESSAGE',
    { chatId, bookingId, messageId: message._id }
  );

  return populatedMessage;
};

const markAsRead = async (chatId, userId) => {
  const result = await Message.updateMany(
    { chatId, receiverId: userId, isRead: false },
    { isRead: true }
  );

  return result;
};

const getUnreadCount = async (userId) => {
  return Message.countDocuments({
    receiverId: userId,
    isRead: false,
  });
};

module.exports = {
  getChatHistory,
  sendMessage,
  markAsRead,
  getUnreadCount,
};
