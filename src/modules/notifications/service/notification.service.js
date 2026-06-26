const Notification = require('../model/notification.model');
const User = require('../../auth/model/user.model');
const { getIo } = require('../../../config/socket');
const { sendFCMNotification } = require('../../../config/firebase');
const webpush = require('web-push');

const publicVapidKey = process.env.VAPID_PUBLIC_KEY || 'BG8KjEMYvfQBC6u-85YWGfV7ntxPkeMFV5lgfuXxIUa7dMofvkAuM1sfiA_TTuWJw3rVvrNM8rFTBVjd7Zx9XaA';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'AWA4GflPTx3gDAvfLH0BCIitOCSjBrqDPMA2pcMwwxQ';

try {
  webpush.setVapidDetails(
    'mailto:support@asaantaqreeb.com',
    publicVapidKey,
    privateVapidKey
  );
  console.log('✅ Web Push VAPID configuration loaded');
} catch (error) {
  console.error('❌ Failed to set VAPID details:', error.message);
}

// Send push notification via Web Push (PWA)
const sendWebPushNotification = async (subscription, title, body, data = {}) => {
  if (!subscription) return;
  try {
    const payload = JSON.stringify({
      title,
      body,
      data,
    });
    await webpush.sendNotification(subscription, payload);
    console.log('✅ Web Push notification sent successfully');
  } catch (error) {
    console.error('❌ Error sending Web Push:', error.message);
  }
};

// Send push notification via Expo Push API
const sendExpoPushNotification = async (expoPushToken, title, body, data = {}) => {
  if (!expoPushToken) return;

  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data,
    channelId: 'default',
    priority: 'high',
  };

  try {
    console.log(`Attempting to send push notification to token: ${expoPushToken}`);
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    
    const result = await response.json();
    console.log('Expo Push API Response:', JSON.stringify(result, null, 2));

    if (!response.ok) {
      console.error('Expo Push API Error Response:', result);
    }
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

    // Send Push Notifications (Expo + FCM) if tokens exist
    if (user) {
      const pushBody = type === 'NEW_MESSAGE' && notification.data.unreadCount > 1
        ? `${notification.data.unreadCount} new messages from ${title.replace('New Message from ', '')}`
        : body;

      // Fire and forget (don't block the main flow)
      const promises = [];

      // Send Expo Push Notification
      if (user.expoPushToken) {
        promises.push(
          sendExpoPushNotification(user.expoPushToken, title, pushBody, data).catch(e => 
            console.error('Expo Push error:', e)
          )
        );
      }

      // Send FCM Notification (works outside app)
      if (user.fcmToken) {
        promises.push(
          sendFCMNotification(user.fcmToken, title, pushBody, {
            ...data,
            bookingId: data.bookingId || '',
            chatId: data.chatId || '',
            userId: userId.toString(),
            type,
          }).catch(e => console.error('FCM error:', e))
        );
      }

      // Send Web Push Notification (PWA)
      if (user.webPushSubscription) {
        promises.push(
          sendWebPushNotification(user.webPushSubscription, title, pushBody, {
            ...data,
            bookingId: data.bookingId || '',
            chatId: data.chatId || '',
            userId: userId.toString(),
            type,
          }).catch(e => console.error('Web Push error:', e))
        );
      }

      // Execute all push notifications in parallel
      if (promises.length > 0) {
        Promise.all(promises).catch(e => console.error('Error sending notifications:', e));
      }
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

const deleteNotification = async (notificationId, userId) => {
  const result = await Notification.deleteOne({ _id: notificationId, user: userId });
  if (result.deletedCount === 0) {
    const error = new Error('Notification not found');
    error.statusCode = 404;
    throw error;
  }
  return { success: true };
};

const deleteAllNotifications = async (userId) => {
  await Notification.deleteMany({ user: userId });
  return { success: true };
};

module.exports = {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  markChatNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
};
