const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sgMail = require('@sendgrid/mail');
const User = require('../model/user.model');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const otpStore = {};

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
});

const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const register = async ({ name, email, password, role }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error('Email already in use');
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({ name, email, password, role });

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save();

  return { accessToken, refreshToken, user: buildUserPayload(user) };
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

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save();

  return { accessToken, refreshToken, user: buildUserPayload(user) };
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

  // For now, always run in "dev mode": don't call SendGrid, just log OTP.
  console.log('DEV OTP for password reset:', { email, otp, expiresAt });
  return { email, message: 'OTP generated (development mode, check server logs for code).' };
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

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  requestPasswordReset,
  verifyOtp,
  resetPassword,
};
