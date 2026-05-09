const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let initialized = false;

const initializeFirebase = () => {
  if (initialized) {
    return admin;
  }

  try {
    // Try to load service account from file first
    let serviceAccount;
    const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');
    
    if (fs.existsSync(serviceAccountPath)) {
      serviceAccount = require(serviceAccountPath);
      console.log('Using Firebase service account from file');
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // Parse from environment variable (base64 encoded JSON)
      const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf-8');
      serviceAccount = JSON.parse(decoded);
      console.log('Using Firebase service account from environment');
    } else {
      console.warn('⚠️  Firebase service account not found. FCM notifications will be disabled.');
      console.warn('Please provide either:');
      console.warn('1. firebase-service-account.json in the project root');
      console.warn('2. FIREBASE_SERVICE_ACCOUNT environment variable (base64 encoded JSON)');
      return null;
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
    });

    initialized = true;
    console.log('✅ Firebase Admin SDK initialized successfully');
    return admin;
  } catch (error) {
    console.error('❌ Error initializing Firebase:', error.message);
    return null;
  }
};

const sendFCMNotification = async (fcmToken, title, body, data = {}) => {
  if (!fcmToken) {
    console.log('No FCM token provided');
    return null;
  }

  const admin = initializeFirebase();
  if (!admin) {
    console.log('Firebase not initialized, skipping FCM notification');
    return null;
  }

  try {
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        timestamp: new Date().toISOString(),
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title,
              body,
            },
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().send({
      token: fcmToken,
      ...message,
    });

    console.log('✅ FCM notification sent successfully:', response);
    return response;
  } catch (error) {
    console.error('❌ Error sending FCM notification:', error.message);
    return null;
  }
};

const sendFCMMulticast = async (fcmTokens, title, body, data = {}) => {
  if (!fcmTokens || fcmTokens.length === 0) {
    console.log('No FCM tokens provided');
    return null;
  }

  const admin = initializeFirebase();
  if (!admin) {
    console.log('Firebase not initialized, skipping FCM notifications');
    return null;
  }

  try {
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        timestamp: new Date().toISOString(),
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title,
              body,
            },
            sound: 'default',
          },
        },
      },
    };

    const response = await admin.messaging().sendMulticast({
      tokens: fcmTokens,
      ...message,
    });

    console.log(`✅ FCM multicast sent: ${response.successCount} successful, ${response.failureCount} failed`);
    return response;
  } catch (error) {
    console.error('❌ Error sending FCM multicast:', error.message);
    return null;
  }
};

module.exports = {
  initializeFirebase,
  sendFCMNotification,
  sendFCMMulticast,
};
