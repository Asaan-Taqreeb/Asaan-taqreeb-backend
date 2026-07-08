const Message = require('../model/message.model');
const { getIo } = require('../../../config/socket');
const { createNotification } = require('../../notifications/service/notification.service');
const { Types } = require('mongoose');

const getChatIdVariants = (chatId) => {
  const roomId = String(chatId || '').trim();

  if (!roomId) {
    return [];
  }

  const variants = new Set([roomId]);

  if (roomId.startsWith('chat_')) {
    const segments = roomId.split('_');

    if (segments.length === 3) {
      const [, firstUserId, secondUserId] = segments;
      const canonicalChatId = getCanonicalChatId(firstUserId, secondUserId);
      variants.add(canonicalChatId);
      // Also add the reversed version to ensure all combinations of user IDs are covered
      variants.add(`chat_${secondUserId}_${firstUserId}`);
    }
  } else {
    variants.add(`chat_${roomId}`);
  }

  return [...variants].filter(Boolean);
};

const getCanonicalChatId = (firstUserId, secondUserId) => {
  const first = String(firstUserId || '').trim();
  const second = String(secondUserId || '').trim();

  if (!first || !second) {
    return '';
  }

  return first.localeCompare(second) <= 0 ? `chat_${first}_${second}` : `chat_${second}_${first}`;
};

const getChatHistory = async (chatId, userId) => {
  const chatIdVariants = getChatIdVariants(chatId);

  // Verify that the user is part of this conversation
  const messages = await Message.find({ chatId: { $in: chatIdVariants } })
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
    { chatId: { $in: chatIdVariants }, receiverId: userId, isRead: false },
    { isRead: true }
  );

  // Also mark notifications as read
  const { markChatNotificationsAsRead } = require('../../notifications/service/notification.service');
  await markChatNotificationsAsRead(userId, chatIdVariants);

  return messages;
};

const getUserChats = async (userId) => {
  const chats = await Message.aggregate([
    {
      $match: {
        $or: [
          { senderId: new Types.ObjectId(userId) },
          { receiverId: new Types.ObjectId(userId) }
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
                  { $eq: ["$receiverId", new Types.ObjectId(userId)] }
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
    { path: 'lastMessage.senderId', model: 'User', select: 'name email profileImage' },
    { path: 'lastMessage.receiverId', model: 'User', select: 'name email profileImage' }
  ]);

  const mergedChats = new Map();

  const getParticipantChatId = (lastMessage) => {
    if (!lastMessage?.senderId?._id || !lastMessage?.receiverId?._id) {
      return '';
    }

    return getCanonicalChatId(lastMessage.senderId._id.toString(), lastMessage.receiverId._id.toString());
  };

  populatedChats.forEach(chat => {
    const senderId = chat.lastMessage.senderId;
    const receiverId = chat.lastMessage.receiverId;
    const canonicalChatId = getParticipantChatId(chat.lastMessage) || chat._id;
    const existing = mergedChats.get(canonicalChatId);

    if (!senderId || !receiverId) {
      const fallbackChat = {
        chatId: chat._id,
        lastMessage: chat.lastMessage,
        unreadCount: chat.unreadCount,
        otherUser: { name: 'Unknown User', _id: 'deleted' }
      };

      if (!existing) {
        mergedChats.set(chat._id, fallbackChat);
      }
      return;
    }

    const isSender = senderId._id.toString() === userId.toString();
    const otherUser = isSender ? receiverId : senderId;

    const nextChat = {
      chatId: canonicalChatId,
      lastMessage: chat.lastMessage,
      unreadCount: chat.unreadCount,
      otherUser
    };

    if (!existing) {
      mergedChats.set(canonicalChatId, nextChat);
      return;
    }

    const existingCreatedAt = new Date(existing.lastMessage.createdAt).getTime();
    const nextCreatedAt = new Date(nextChat.lastMessage.createdAt).getTime();

    mergedChats.set(canonicalChatId, {
      ...existing,
      lastMessage: nextCreatedAt >= existingCreatedAt ? nextChat.lastMessage : existing.lastMessage,
      unreadCount: existing.unreadCount + nextChat.unreadCount,
      otherUser: existing.otherUser
    });
  });

  return [...mergedChats.values()].sort(
    (a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
  );
};

const deleteChat = async (chatId, userId) => {
  const chatIdVariants = getChatIdVariants(chatId);

  // We delete messages where the user is either sender or receiver
  // This ensures a user can only delete chats they belong to
  const result = await Message.deleteMany({
    chatId: { $in: chatIdVariants },
    $or: [
      { senderId: userId },
      { receiverId: userId }
    ]
  });

  return result;
};

const sendMessage = async (userId, { chatId, receiverId, bookingId, text, imageUrl, audioUrl }) => {
  if (!chatId || !receiverId || (!text && !imageUrl && !audioUrl)) {
    const error = new Error('chatId, receiverId, and either text, imageUrl, or audioUrl are required');
    error.statusCode = 422;
    throw error;
  }

  const canonicalChatId = getCanonicalChatId(userId, receiverId) || String(chatId).trim();
  const chatIdVariants = getChatIdVariants(chatId);
  const emitChatIds = [...new Set([canonicalChatId, ...chatIdVariants].filter(Boolean))];

  const message = await Message.create({
    chatId: canonicalChatId,
    senderId: userId,
    receiverId,
    bookingId: bookingId || null,
    text: text || '',
    imageUrl: imageUrl || '',
    audioUrl: audioUrl || '',
    isRead: false,
  });

  const populatedMessage = await message.populate([
    { path: 'senderId', select: 'name email' },
    { path: 'receiverId', select: 'name email' }
  ]);

  // Emit real-time message via socket
  try {
    const io = getIo();
    if (emitChatIds.length === 0) {
      throw new Error('Invalid chat room');
    }

    // Emit to the specific chat room
    emitChatIds.forEach((roomId) => {
      io.to(roomId).emit('receiveMessage', populatedMessage);
    });
    // Also emit to the receiver's personal room for global notification if they aren't in the chat screen
    io.to(receiverId.toString()).emit('newMessageNotification', populatedMessage);
  } catch (e) {
    console.log('Socket not ready');
  }

  // Create notification
  await createNotification(
    receiverId,
    `New Message from ${populatedMessage.senderId.name}`,
    text
      ? (text.length > 30 ? text.substring(0, 30) + '...' : text)
      : (imageUrl ? 'Sent a payment proof image' : (audioUrl ? 'Sent a voice message' : 'New message')),
    'NEW_MESSAGE',
    { chatId: canonicalChatId, bookingId, messageId: message._id }
  );

  return populatedMessage;
};

const markAsRead = async (chatId, userId) => {
  const chatIdVariants = getChatIdVariants(chatId);

  const result = await Message.updateMany(
    { chatId: { $in: chatIdVariants }, receiverId: userId, isRead: false },
    { isRead: true }
  );

  // Also mark notifications as read
  const { markChatNotificationsAsRead } = require('../../notifications/service/notification.service');
  await markChatNotificationsAsRead(userId, chatIdVariants);

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
  deleteChat,
  sendMessage,
  markAsRead,
  getUnreadCount,
};
