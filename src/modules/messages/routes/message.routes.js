const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../../../shared/middleware/auth.middleware');
const { upload } = require('../../../shared/utils/upload.util');
const messageController = require('../controller/message.controller');

const router = express.Router();

const sendMessageValidation = [
  body('chatId').trim().notEmpty().withMessage('chatId is required'),
  body('receiverId').trim().notEmpty().withMessage('receiverId is required'),
  body('text').optional().trim(),
  body('imageUrl').optional().trim(),
];

// Protected: get all user chats (inbox)
router.get('/', protect, messageController.getUserChats);

// Protected: get chat history
router.get('/:chatId', protect, messageController.getChatHistory);

// Protected: delete chat
router.delete('/:chatId', protect, messageController.deleteChat);

// Protected: send message
router.post('/', protect, upload.single('image'), sendMessageValidation, messageController.sendMessage);

// Protected: mark chat as read
router.patch('/:chatId/read', protect, messageController.markAsRead);

// Protected: get unread message count
router.get('/count/unread', protect, messageController.getUnreadCount);

module.exports = router;
