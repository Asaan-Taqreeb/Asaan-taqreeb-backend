const notificationService = require('../service/notification.service');
const User = require('../../auth/model/user.model');

const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationService.getUserNotifications(req.user.id);
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    res.status(200).json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user.id);
    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user.id);
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

const updatePushToken = async (req, res, next) => {
  try {
    const { expoPushToken } = req.body;
    await User.findByIdAndUpdate(req.user.id, { expoPushToken });
    res.status(200).json({ success: true, message: 'Push token updated successfully' });
  } catch (error) {
    next(error);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    await notificationService.deleteNotification(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
};

const deleteAllNotifications = async (req, res, next) => {
  try {
    await notificationService.deleteAllNotifications(req.user.id);
    res.status(200).json({ success: true, message: 'All notifications deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  updatePushToken,
  deleteNotification,
  deleteAllNotifications,
};
