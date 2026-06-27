const { validationResult } = require('express-validator');
const messageService = require('../service/message.service');
const { uploadToCloudinary } = require('../../../shared/utils/upload.util');

const getChatHistory = async (req, res, next) => {
  try {
    const messages = await messageService.getChatHistory(req.params.chatId, req.user.id);
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};

const deleteChat = async (req, res, next) => {
  try {
    const result = await messageService.deleteChat(req.params.chatId, req.user.id);
    res.status(200).json({ success: true, message: 'Chat deleted successfully', data: result });
  } catch (error) {
    next(error);
  }
};

const getUserChats = async (req, res, next) => {
  try {
    const chats = await messageService.getUserChats(req.user.id);
    res.status(200).json({ success: true, data: chats });
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    let imageUrl = req.body.imageUrl || '';
    let audioUrl = req.body.audioUrl || '';
    if (req.file) {
      const isAudio = req.file.mimetype.startsWith('audio/') || (req.file.originalname && req.file.originalname.match(/\.(m4a|caf|mp3|wav|ogg|aac|3gp)$/i));
      const url = await uploadToCloudinary(req.file, 'messages');
      if (isAudio) {
        audioUrl = url;
      } else {
        imageUrl = url;
      }
    }

    const message = await messageService.sendMessage(req.user.id, {
      ...req.body,
      imageUrl,
      audioUrl,
    });
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const result = await messageService.markAsRead(req.params.chatId, req.user.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const count = await messageService.getUnreadCount(req.user.id);
    res.status(200).json({ success: true, data: { unreadCount: count } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getChatHistory,
  getUserChats,
  deleteChat,
  sendMessage,
  markAsRead,
  getUnreadCount,
};
