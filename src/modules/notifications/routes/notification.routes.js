const express = require('express');
const { protect } = require('../../../shared/middleware/auth.middleware');
const notificationController = require('../controller/notification.controller');

const router = express.Router();

router.use(protect);

router.get('/', notificationController.getMyNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.put('/:id/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);
router.post('/push-token', notificationController.updatePushToken);

module.exports = router;
