const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../../../shared/middleware/auth.middleware');
const messageController = require('../controller/message.controller');

const router = express.Router();

const sendMessageValidation = [
  body('chatId').trim().notEmpty().withMessage('chatId is required'),
  body('receiverId').trim().notEmpty().withMessage('receiverId is required'),
  body('text').trim().notEmpty().withMessage('Message text is required'),
];

// Protected: get chat history
router.get('/:chatId', protect, messageController.getChatHistory);

// Protected: send message
router.post('/', protect, sendMessageValidation, messageController.sendMessage);

// Protected: mark chat as read
router.patch('/:chatId/read', protect, messageController.markAsRead);

// Protected: get unread message count
router.get('/count/unread', protect, messageController.getUnreadCount);

module.exports = router;
