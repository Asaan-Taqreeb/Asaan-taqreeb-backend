const express = require('express');
const { body } = require('express-validator');
const authController = require('../controller/auth.controller');
const { protect } = require('../../../shared/middleware/auth.middleware');
const ROLES = require('../../../shared/enums/roles.enum');

const router = express.Router();

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(Object.values(ROLES))
    .withMessage(`Role must be one of: ${Object.values(ROLES).join(', ')}`),
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
];

const verifyOtpValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be a 6-digit code'),
];

const resetPasswordValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

const restoreAccountValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const updateProfileValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().trim(),
  body('profileImage').optional().trim(),
];

router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);
router.patch('/me', protect, updateProfileValidation, authController.updateProfile);
router.put('/me', protect, updateProfileValidation, authController.updateProfile); // Keep PUT for backward compatibility
router.delete('/me', protect, authController.deleteAccount);

router.post('/forgot-password', forgotPasswordValidation, authController.forgotPassword);
router.post('/verify-otp', verifyOtpValidation, authController.verifyOtp);
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);
router.post('/verify-email', verifyOtpValidation, authController.verifyEmail);
router.post('/resend-verification-otp', forgotPasswordValidation, authController.resendOtp);
router.post('/restore-account', restoreAccountValidation, authController.restoreAccount);

router.get('/inspect/:email', async (req, res) => {
  try {
    const user = await require('../model/user.model').findOne({ email: req.params.email });
    res.json({ success: true, user });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

router.get('/fix/:email', async (req, res) => {
  try {
    const User = require('../model/user.model');
    const user = await User.findOne({ email: req.params.email });
    if (user) {
      if (!user.roles || user.roles.length === 0) {
        user.roles = [user.role || 'client'];
      }
      if (!user.roles.includes('vendor') && user.role === 'vendor') {
        user.roles.push('vendor');
      }
      if (!user.roles.includes('client') && user.role === 'client') {
        user.roles.push('client');
      }
      await user.save();
      res.json({ success: true, message: "User roles fixed successfully", user });
    } else {
      res.json({ success: false, message: "User not found" });
    }
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

module.exports = router;
