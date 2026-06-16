const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../model/user.model');
const VendorService = require('../../vendor/model/vendorService.model');
const VendorAvailability = require('../../vendor/model/vendorAvailability.model');
const Message = require('../../messages/model/message.model');
const Booking = require('../../booking/model/booking.model');
const Notification = require('../../notifications/model/notification.model');
const { sendOTPEmail, sendPasswordResetEmail } = require('../../../config/email');


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
  roles: user.roles && user.roles.length > 0 ? user.roles : [user.role],
  isEmailVerified: user.isEmailVerified,
  is2faEnabled: user.is2faEnabled,
  verificationStatus: user.verificationStatus,
});

const ACCOUNT_DELETE_GRACE_DAYS = Number(process.env.ACCOUNT_DELETE_GRACE_DAYS || 15);

const buildDeleteSchedule = () => {
  const deletedAt = new Date();
  const deleteAfter = new Date(deletedAt.getTime() + ACCOUNT_DELETE_GRACE_DAYS * 24 * 60 * 60 * 1000);

  return { deletedAt, deleteAfter };
};

const purgeUserData = async (userId) => {
  await Promise.all([
    VendorService.deleteMany({ user: userId }),
    VendorAvailability.deleteMany({ vendor: userId }),
    VendorAvailability.deleteMany({ vendor: userId }),
    Booking.deleteMany({ $or: [{ vendor: userId }, { client: userId }] }),
    Message.deleteMany({
      $or: [
        { senderId: userId },
        { receiverId: userId },
      ],
    }),
    Notification.deleteMany({ user: userId }),
  ]);

  await User.findByIdAndDelete(userId);
};


const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const register = async ({ name, email, password, role, phone, activateVendor, activateClient }) => {
  const existingUser = await User.findOne({ email }).select('+password');
  if (existingUser) {
    const userRoles = existingUser.roles && existingUser.roles.length > 0 ? existingUser.roles : [existingUser.role];
    if (role === 'vendor' && userRoles.includes('client') && !userRoles.includes('vendor')) {
      if (activateVendor) {
        // Verify the password
        const isMatch = await existingUser.comparePassword(password);
        if (!isMatch) {
          const error = new Error('Invalid password for your existing client account.');
          error.statusCode = 401;
          throw error;
        }

        // Activate vendor role
        if (!existingUser.roles || existingUser.roles.length === 0) {
          existingUser.roles = [existingUser.role];
        }
        existingUser.roles.push('vendor');
        existingUser.role = 'vendor';
        existingUser.verificationStatus = 'unverified';
        await existingUser.save();

        const accessToken = generateAccessToken(existingUser._id, 'vendor');
        const refreshToken = generateRefreshToken(existingUser._id);
        existingUser.refreshToken = refreshToken;
        await existingUser.save();

        return {
          accessToken,
          refreshToken,
          user: buildUserPayload(existingUser),
        };
      } else {
        const error = new Error('It looks like you already have a client account! Would you like to activate your vendor dashboard using these credentials?');
        error.statusCode = 409;
        error.code = 'CLIENT_ACCOUNT_EXISTS';
        throw error;
      }
    }

    if (role === 'client' && userRoles.includes('vendor') && !userRoles.includes('client')) {
      if (activateClient || activateVendor) {
        // Verify the password
        const isMatch = await existingUser.comparePassword(password);
        if (!isMatch) {
          const error = new Error('Invalid password for your existing vendor account.');
          error.statusCode = 401;
          throw error;
        }

        // Activate client role
        if (!existingUser.roles || existingUser.roles.length === 0) {
          existingUser.roles = [existingUser.role];
        }
        existingUser.roles.push('client');
        existingUser.role = 'client';
        await existingUser.save();

        const accessToken = generateAccessToken(existingUser._id, 'client');
        const refreshToken = generateRefreshToken(existingUser._id);
        existingUser.refreshToken = refreshToken;
        await existingUser.save();

        return {
          accessToken,
          refreshToken,
          user: buildUserPayload(existingUser),
        };
      } else {
        const error = new Error('It looks like you already have a vendor account! Would you like to activate your client dashboard using these credentials?');
        error.statusCode = 409;
        error.code = 'VENDOR_ACCOUNT_EXISTS';
        throw error;
      }
    }

    const error = new Error('Email already in use');
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    roles: [role],
    phone,
  });

  // Generate and send verification OTP
  const otp = generateOTP();
  user.otp = otp;
  user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save();

  try {
    await sendOTPEmail(email, otp);
  } catch (error) {
    console.error('Error sending verification OTP:', error.message);
  }

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save();

  return { accessToken, refreshToken, user: buildUserPayload(user), otp: process.env.NODE_ENV === 'development' ? otp : undefined };
};


const login = async ({ email, password, role }) => {
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
    error.code = 'ACCOUNT_DEACTIVATED';
    if (user.deleteAfter) {
      error.deleteAfter = user.deleteAfter;
      error.code = 'ACCOUNT_PENDING_PURGE';
    }
    throw error;
  }

  // Determine active role for token generation
  let activeRole = role || user.role;
  if (role) {
    const userRoles = user.roles && user.roles.length > 0 ? user.roles : [user.role];
    if (!userRoles.includes(role)) {
      const error = new Error(`User does not have the '${role}' role`);
      error.statusCode = 403;
      throw error;
    }
  }

  // Handle unverified email: trigger OTP send if trying to login
  let otp;
  if (!user.isEmailVerified) {
    try {
      otp = await sendVerificationEmail(user);
      console.log(`Login attempt for unverified user ${user.email}. Sent new OTP.`);
    } catch (error) {
      console.error('Failed to send verification OTP during login:', error);
    }
  }

  const accessToken = generateAccessToken(user._id, activeRole);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save();

  const userPayload = buildUserPayload(user);
  userPayload.role = activeRole; // Override with session-specific active role

  return { 
    accessToken, 
    refreshToken, 
    user: userPayload,
    otp: (process.env.NODE_ENV === 'development' && !user.isEmailVerified) ? otp : undefined 
  };
};

const refresh = async (token, role) => {
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

  let activeRole = role || user.role;
  if (role) {
    const userRoles = user.roles && user.roles.length > 0 ? user.roles : [user.role];
    if (!userRoles.includes(role)) {
      const error = new Error(`User does not have the '${role}' role`);
      error.statusCode = 403;
      throw error;
    }
  }

  const newAccessToken = generateAccessToken(user._id, activeRole);
  const newRefreshToken = generateRefreshToken(user._id);

  user.refreshToken = newRefreshToken;
  await user.save();

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

const logout = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};

const getMe = async (userId, activeRole) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  const payload = buildUserPayload(user);
  if (activeRole) {
    payload.role = activeRole;
  }
  return payload;
};

const requestPasswordReset = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error('User with this email does not exist');
    error.statusCode = 404;
    throw error;
  }

  const otp = generateOTP();
  user.otp = otp;
  user.otpExpires = Date.now() + 5 * 60 * 1000;
  await user.save();

  try {
    await sendPasswordResetEmail(email, otp);
  } catch (error) {
    console.error('Error sending password reset OTP:', error.message);
    const err = new Error('Failed to send OTP email');
    err.statusCode = 500;
    throw err;
  }

  return { email, message: 'OTP sent successfully.' };
};

const verifyOtp = async (email, otp) => {
  const user = await User.findOne({ email });

  if (!user || !user.otp) {
    const error = new Error('No OTP found for this email. Please request again.');
    error.statusCode = 400;
    throw error;
  }

  if (Date.now() > user.otpExpires) {
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    const error = new Error('OTP has expired. Please request a new one.');
    error.statusCode = 400;
    throw error;
  }

  if (user.otp !== otp.toString()) {
    const error = new Error('Invalid OTP.');
    error.statusCode = 400;
    throw error;
  }

  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  return { email, message: 'OTP verified successfully.' };
};

const sendVerificationEmail = async (user) => {
  const otp = generateOTP();
  user.otp = otp;
  user.otpExpires = Date.now() + 10 * 60 * 1000;
  await user.save();

  try {
    await sendOTPEmail(user.email, otp);
  } catch (error) {
    console.error('Error sending verification OTP:', error.message);
  }
  
  return otp;
};

const resendOtp = async (email) => {
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

  const otp = await sendVerificationEmail(user);
  return { message: 'Verification code resent successfully', otp: process.env.NODE_ENV === 'development' ? otp : undefined };
};

const verifyEmail = async (email, otp) => {
  const user = await User.findOne({ email });

  if (!user || !user.otp) {
    const error = new Error('No verification code found. Please request again.');
    error.statusCode = 400;
    throw error;
  }

  if (Date.now() > user.otpExpires) {
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    const error = new Error('Verification code has expired.');
    error.statusCode = 400;
    throw error;
  }

  if (user.otp !== otp.toString()) {
    const error = new Error('Invalid verification code.');
    error.statusCode = 400;
    throw error;
  }

  user.isEmailVerified = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

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

  const { deletedAt, deleteAfter } = buildDeleteSchedule();

  user.isActive = false;
  user.deletedAt = deletedAt;
  user.deletionRequestedAt = deletedAt;
  user.deleteAfter = deleteAfter;
  user.refreshToken = null;
  user.expoPushToken = undefined;
  user.fcmToken = undefined;
  await user.save();

  return {
    success: true,
    message: `Account deactivated. It will be permanently deleted after ${ACCOUNT_DELETE_GRACE_DAYS} days unless restored.`,
    deleteAfter,
  };
};

const restoreAccount = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (user.isActive) {
    return { success: true, message: 'Account is already active', user: buildUserPayload(user) };
  }

  if (!user.deleteAfter || user.deleteAfter <= new Date()) {
    const error = new Error('Account can no longer be restored');
    error.statusCode = 410;
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  user.isActive = true;
  user.deletedAt = undefined;
  user.deleteAfter = undefined;
  user.deletionRequestedAt = undefined;
  user.refreshToken = null;
  await user.save();

  return { success: true, message: 'Account restored successfully', user: buildUserPayload(user) };
};

const purgeExpiredAccounts = async () => {
  const now = new Date();
  const expiredAccounts = await User.find({
    isActive: false,
    deleteAfter: { $lte: now },
  }).select('_id');

  const purgedIds = [];

  for (const account of expiredAccounts) {
    await purgeUserData(account._id);
    purgedIds.push(account._id.toString());
  }

  return { success: true, purgedCount: purgedIds.length, purgedIds };
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
  resendOtp,
  restoreAccount,
  purgeExpiredAccounts,
};

