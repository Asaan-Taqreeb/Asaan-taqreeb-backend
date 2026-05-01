const Notification = require('../model/notification.model');
const User = require('../../auth/model/user.model');
const { getIo } = require('../../../config/socket');

// Send push notification via Expo Push API
const sendExpoPushNotification = async (expoPushToken, title, body, data = {}) => {
  if (!expoPushToken) return;

  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data,
  };

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error('Error sending Expo push notification:', error);
  }
};

const createNotification = async (userId, title, body, type = 'SYSTEM', data = {}) => {
  try {
    const notification = await Notification.create({
      user: userId,
      title,
      body,
      type,
      data,
    });

    const user = await User.findById(userId);

    // Send real-time socket event
    try {
      const io = getIo();
      io.to(userId.toString()).emit('newNotification', notification);
    } catch (e) {
      console.log('Socket not ready or user offline');
    }

    // Send Push Notification if token exists
    if (user && user.expoPushToken) {
      await sendExpoPushNotification(user.expoPushToken, title, body, data);
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

const getUserNotifications = async (userId) => {
  return Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(50);
};

const getUnreadCount = async (userId) => {
  return Notification.countDocuments({ user: userId, isRead: false });
};

const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { isRead: true },
    { new: true }
  );
  if (!notification) {
    const error = new Error('Notification not found');
    error.statusCode = 404;
    throw error;
  }
  return notification;
};

const markAllAsRead = async (userId) => {
  await Notification.updateMany(
    { user: userId, isRead: false },
    { isRead: true }
  );
  return { success: true };
};

module.exports = {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
