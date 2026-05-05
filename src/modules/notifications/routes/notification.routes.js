const express = require('express');
const { protect } = require('../../../shared/middleware/auth.middleware');
const notificationController = require('../controller/notification.controller');

const router = express.Router();

router.use(protect);

router.get('/', notificationController.getMyNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/:id/read', notificationController.markAsRead);
router.put('/:id/read', notificationController.markAsRead);
router.patch('/read-all', notificationController.markAllAsRead);
router.put('/read-all', notificationController.markAllAsRead);
router.post('/push-token', notificationController.updatePushToken);
router.delete('/:id', notificationController.deleteNotification);
router.delete('/', notificationController.deleteAllNotifications);

module.exports = router;
