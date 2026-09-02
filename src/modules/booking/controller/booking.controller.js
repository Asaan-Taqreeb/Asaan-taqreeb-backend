const { validationResult } = require('express-validator');
const bookingService = require('../service/booking.service');
const cacheManager = require('../../../shared/cache/cache.manager');

const notifyBookingUpdate = (booking, type = 'BOOKING_UPDATE') => {
  cacheManager.del('BOOKINGS_');
  cacheManager.del('REVENUE_ANALYTICS');
  try {
    const { getIo } = require('../../../config/socket');
    const io = getIo();
    if (io) {
      if (booking?.vendor) {
        const vendorId = String(booking.vendor._id || booking.vendor);
        io.to(vendorId).emit('newNotification', { type, data: booking });
      }
      if (booking?.client) {
        const clientId = String(booking.client._id || booking.client);
        io.to(clientId).emit('newNotification', { type, data: booking });
      }
      io.emit('REVENUE_UPDATE', { bookingId: booking?._id });
    }
  } catch (_) {}
};

const createBooking = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const booking = await bookingService.createBooking(req.user.id, req.body);
    notifyBookingUpdate(booking, 'NEW_BOOKING');
    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const cacheKey = `BOOKINGS_CLIENT_${req.user.id}`;
    const cached = cacheManager.get(cacheKey);
    if (cached) {
      return res.status(200).json({ success: true, data: cached, fromCache: true });
    }

    const bookings = await bookingService.getMyBookings(req.user.id);
    cacheManager.set(cacheKey, bookings, 180); // 3 min cache
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};

const getVendorBookings = async (req, res, next) => {
  try {
    const cacheKey = `BOOKINGS_VENDOR_${req.user.id}`;
    const cached = cacheManager.get(cacheKey);
    if (cached) {
      return res.status(200).json({ success: true, data: cached, fromCache: true });
    }

    const bookings = await bookingService.getVendorBookings(req.user.id);
    cacheManager.set(cacheKey, bookings, 180); // 3 min cache
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};

const updateBookingStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const { status, rejectionReason, paidAmount } = req.body;
    const booking = await bookingService.updateBookingStatus(
      req.params.id,
      req.user.id,
      status,
      rejectionReason,
      paidAmount
    );
    notifyBookingUpdate(booking, 'BOOKING_UPDATE');
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

const recordRemainingPayment = async (req, res, next) => {
  try {
    const booking = await bookingService.recordRemainingPayment(
      req.params.id,
      req.user.id
    );
    notifyBookingUpdate(booking, 'BOOKING_UPDATE');
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.cancelBooking(req.params.id, req.user.id);
    notifyBookingUpdate(booking, 'BOOKING_UPDATE');
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getVendorBookings,
  updateBookingStatus,
  cancelBooking,
  recordRemainingPayment,
};

