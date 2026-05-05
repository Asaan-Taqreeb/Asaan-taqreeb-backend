const express = require('express');
const router = express.Router();
const { sendExpoPushNotification } = require('../service/notification.service');
const { protect } = require('../../../shared/middleware/auth.middleware');

router.post('/test-push', protect, async (req, res) => {
  const { token, title, body } = req.body;
  
  if (!token) {
    return res.status(400).json({ success: false, message: 'Token is required' });
  }

  try {
    await sendExpoPushNotification(token, title || 'Test Notification', body || 'This is a test notification from Asaan Taqreeb');
    res.status(200).json({ success: true, message: 'Test notification sent to Expo' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
