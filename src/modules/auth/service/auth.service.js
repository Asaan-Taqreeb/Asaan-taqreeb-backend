const jwt = require('jsonwebtoken');
const User = require('../model/user.model');

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

module.exports = { register, login, refresh, logout, getMe };
