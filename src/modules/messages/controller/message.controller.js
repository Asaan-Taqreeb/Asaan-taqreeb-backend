const { validationResult } = require('express-validator');
const messageService = require('../service/message.service');

const getChatHistory = async (req, res, next) => {
  try {
    const messages = await messageService.getChatHistory(req.params.chatId, req.user.id);
    res.status(200).json({ success: true, data: messages });
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

    const message = await messageService.sendMessage(req.user.id, req.body);
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
  sendMessage,
  markAsRead,
  getUnreadCount,
};
