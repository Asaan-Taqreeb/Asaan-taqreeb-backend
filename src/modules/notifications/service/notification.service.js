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
    let notification;

    // Handle grouping for NEW_MESSAGE type
    if (type === 'NEW_MESSAGE' && data.chatId) {
      const existingNotification = await Notification.findOne({
        user: userId,
        type: 'NEW_MESSAGE',
        isRead: false,
        'data.chatId': data.chatId,
      });

      if (existingNotification) {
        // Update existing notification
        const currentCount = existingNotification.data.unreadCount || 1;
        const newCount = currentCount + 1;
        
        existingNotification.title = title; // Keep the latest title (usually "New Message from Name")
        existingNotification.body = `${newCount} new messages`;
        existingNotification.data = { ...existingNotification.data, ...data, unreadCount: newCount };
        existingNotification.createdAt = new Date(); // Update timestamp to bring to top
        
        notification = await existingNotification.save();
      }
    }

    if (!notification) {
      notification = await Notification.create({
        user: userId,
        title,
        body,
        type,
        data: { ...data, unreadCount: 1 },
      });
    }

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
      const pushBody = type === 'NEW_MESSAGE' && notification.data.unreadCount > 1
        ? `${notification.data.unreadCount} new messages from ${title.replace('New Message from ', '')}`
        : body;
      await sendExpoPushNotification(user.expoPushToken, title, pushBody, data);
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

const markChatNotificationsAsRead = async (userId, chatId) => {
  await Notification.updateMany(
    { user: userId, type: 'NEW_MESSAGE', 'data.chatId': chatId, isRead: false },
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
  markChatNotificationsAsRead,
};
