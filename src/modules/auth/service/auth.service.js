const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Resend } = require('resend');
const User = require('../model/user.model');
const VendorService = require('../../vendor/model/vendorService.model');
const Message = require('../../messages/model/message.model');

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_123');

const otpStore = {}; // For password reset
const verificationOtpStore = {}; // For email verification


const generateAccessToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
};

const buildUserPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isEmailVerified: user.isEmailVerified,
  is2faEnabled: user.is2faEnabled,
  verificationStatus: user.verificationStatus,
});


const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const register = async ({ name, email, password, role, phone }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error('Email already in use');
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({ name, email, password, role, phone });

  // Generate and send verification OTP
  const otp = generateOTP();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  verificationOtpStore[email] = { otp, expiresAt };

  const fromEmail = process.env.RESET_EMAIL_FROM || 'onboarding@resend.dev';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #4F46E5;">Welcome to Asaan Taqreeb!</h2>
      <p>Please verify your email address to complete your registration.</p>
      <p>Your Verification Code is:</p>
      <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #4F46E5; margin: 16px 0;">
        ${otp}
      </div>
      <p style="color: #666;">This code is valid for <strong>10 minutes</strong>.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="font-size: 12px; color: #aaa;">Sent by Asaan Taqreeb</p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Verify your Asaan Taqreeb account',
      html,
    });
    console.log('Verification OTP sent via Resend:', { email, otp });
  } catch (error) {
    console.error('Resend error while sending verification OTP:', error);
    // We don't throw here to allow user to reach the verification screen and request resend
  }

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save();

  return { accessToken, refreshToken, user: buildUserPayload(user), otp: process.env.NODE_ENV === 'development' ? otp : undefined };
};


const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error('Account is deactivated');
    error.statusCode = 403;
    throw error;
  }

  // Handle unverified email: trigger OTP send if trying to login
  let otp;
  if (!user.isEmailVerified) {
    try {
      otp = await sendVerificationEmail(user.email);
      console.log(`Login attempt for unverified user ${user.email}. Sent new OTP.`);
    } catch (error) {
      console.error('Failed to send verification OTP during login:', error);
    }
  }

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save();

  return { 
    accessToken, 
    refreshToken, 
    user: buildUserPayload(user),
    otp: (process.env.NODE_ENV === 'development' && !user.isEmailVerified) ? otp : undefined 
  };
};

const refresh = async (token) => {
  if (!token) {
    const error = new Error('Refresh token is required');
    error.statusCode = 401;
    throw error;
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    const error = new Error('Invalid or expired refresh token');
    error.statusCode = 401;
    throw error;
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== token) {
    const error = new Error('Refresh token mismatch or user not found');
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error('Account is deactivated');
    error.statusCode = 403;
    throw error;
  }

  const newAccessToken = generateAccessToken(user._id, user.role);
  const newRefreshToken = generateRefreshToken(user._id);

  user.refreshToken = newRefreshToken;
  await user.save();

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

const logout = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};

const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return user;
};

const requestPasswordReset = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error('User with this email does not exist');
    error.statusCode = 404;
    throw error;
  }

  const otp = generateOTP();
  const expiresAt = Date.now() + 5 * 60 * 1000;

  otpStore[email] = { otp, expiresAt };
  const fromEmail = process.env.RESET_EMAIL_FROM || 'onboarding@resend.dev';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #4F46E5;">Password Reset Request</h2>
      <p>We received a request to reset your password for Asaan Taqreeb.</p>
      <p>Your One-Time Password (OTP) is:</p>
      <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #4F46E5; margin: 16px 0;">
        ${otp}
      </div>
      <p style="color: #666;">This OTP is valid for <strong>5 minutes</strong>.</p>
      <p style="color: #666;">If you did not request this, you can ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="font-size: 12px; color: #aaa;">Sent by Asaan Taqreeb — ${fromEmail}</p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Your OTP for Password Reset',
      html,
    });
    console.log('Password reset OTP sent via Resend:', { email, otp });
  } catch (error) {
    console.error('Resend error while sending OTP:', error);
    const err = new Error('Failed to send OTP email');
    err.statusCode = 500;
    throw err;
  }

  return { email, otp, message: `OTP sent successfully. (DEBUG: ${otp})` };
};

const verifyOtp = async (email, otp) => {
  const record = otpStore[email];

  if (!record) {
    const error = new Error('No OTP found for this email. Please request again.');
    error.statusCode = 400;
    throw error;
  }

  if (Date.now() > record.expiresAt) {
    delete otpStore[email];
    const error = new Error('OTP has expired. Please request a new one.');
    error.statusCode = 400;
    throw error;
  }

  if (record.otp !== otp.toString()) {
    const error = new Error('Invalid OTP.');
    error.statusCode = 400;
    throw error;
  }

  delete otpStore[email];

  return { email, message: 'OTP verified successfully.' };
};

const sendVerificationEmail = async (email) => {
  const otp = generateOTP();
  const expiresAt = Date.now() + 10 * 60 * 1000;
  verificationOtpStore[email] = { otp, expiresAt };

  const fromEmail = process.env.RESET_EMAIL_FROM || 'onboarding@resend.dev';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #4F46E5;">Email Verification Code</h2>
      <p>Use the following code to verify your Asaan Taqreeb account:</p>
      <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #4F46E5; margin: 16px 0;">
        ${otp}
      </div>
      <p style="color: #666;">This code is valid for <strong>10 minutes</strong>.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="font-size: 12px; color: #aaa;">Sent by Asaan Taqreeb</p>
    </div>
  `;

  try {
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_dummy_123') {
      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: 'Verification Code for Asaan Taqreeb',
        html,
      });
      console.log(`Verification email sent to ${email}`);
    } else {
      console.warn(`Resend API key missing or dummy. Skipping email send for ${email}. OTP: ${otp}`);
    }
  } catch (error) {
    console.error('Resend error while sending verification OTP:', error);
  }
  
  return otp;
};

const resendVerificationOtp = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (user.isEmailVerified) {
    const error = new Error('Email is already verified');
    error.statusCode = 400;
    throw error;
  }

  const otp = await sendVerificationEmail(email);
  return { message: 'Verification code resent successfully', otp: process.env.NODE_ENV === 'development' ? otp : undefined };
};

const verifyEmail = async (email, otp) => {
  const record = verificationOtpStore[email];

  if (!record) {
    const error = new Error('No verification code found. Please request again.');
    error.statusCode = 400;
    throw error;
  }

  if (Date.now() > record.expiresAt) {
    delete verificationOtpStore[email];
    const error = new Error('Verification code has expired.');
    error.statusCode = 400;
    throw error;
  }

  if (record.otp !== otp.toString()) {
    const error = new Error('Invalid verification code.');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  user.isEmailVerified = true;
  await user.save();

  delete verificationOtpStore[email];

  return { message: 'Email verified successfully', user: buildUserPayload(user) };
};


const resetPassword = async (email, newPassword) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    const error = new Error('User with this email does not exist');
    error.statusCode = 404;
    throw error;
  }

  user.password = newPassword;
  await user.save();

  return { email, message: 'Password has been reset successfully.' };
};

const updateProfile = async (userId, reqBody) => {
  const { name, phone, profileImage } = reqBody;
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (profileImage) user.profileImage = profileImage;
  if (reqBody.expoPushToken) user.expoPushToken = reqBody.expoPushToken;

  await user.save();

  return buildUserPayload(user);
};

const deleteAccount = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  await User.findByIdAndDelete(userId);

  // Cascade delete: Remove associated vendor services if they exist
  await VendorService.deleteMany({ user: userId });

  // Cascade delete: Remove messages associated with this user
  await Message.deleteMany({
    $or: [
      { senderId: userId },
      { receiverId: userId }
    ]
  });

  return { success: true, message: 'Account and all associated data deleted successfully' };
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  requestPasswordReset,
  verifyOtp,
  resetPassword,
  updateProfile,
  deleteAccount,
  verifyEmail,
  resendVerificationOtp,
};

