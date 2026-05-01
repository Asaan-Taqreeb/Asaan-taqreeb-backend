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

const getUserChats = async (userId) => {
  const chats = await Message.aggregate([
    {
      $match: {
        $or: [
          { senderId: new require('mongoose').Types.ObjectId(userId) },
          { receiverId: new require('mongoose').Types.ObjectId(userId) }
        ]
      }
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$chatId",
        lastMessage: { $first: "$$ROOT" },
        unreadCount: {
          $sum: {
            $cond: [
              { 
                $and: [
                  { $eq: ["$isRead", false] },
                  { $eq: ["$receiverId", new require('mongoose').Types.ObjectId(userId)] }
                ]
              }, 
              1, 
              0
            ]
          }
        }
      }
    },
    { $sort: { "lastMessage.createdAt": -1 } }
  ]);

  // Populate the last message and participant details
  const populatedChats = await Message.populate(chats, [
    { path: 'lastMessage.senderId', select: 'name email profileImage' },
    { path: 'lastMessage.receiverId', select: 'name email profileImage' }
  ]);

  return populatedChats.map(chat => {
    const isSender = chat.lastMessage.senderId._id.toString() === userId.toString();
    const otherUser = isSender ? chat.lastMessage.receiverId : chat.lastMessage.senderId;

    return {
      chatId: chat._id,
      lastMessage: chat.lastMessage,
      unreadCount: chat.unreadCount,
      otherUser
    };
  });
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

  const populatedMessage = await message.populate([
    { path: 'senderId', select: 'name email' },
    { path: 'receiverId', select: 'name email' }
  ]);

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
  getUserChats,
  sendMessage,
  markAsRead,
  getUnreadCount,
};
