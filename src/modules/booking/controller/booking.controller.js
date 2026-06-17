const { validationResult } = require('express-validator');
const bookingService = require('../service/booking.service');

const createBooking = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const booking = await bookingService.createBooking(req.user.id, req.body);
    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await bookingService.getMyBookings(req.user.id);
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};

const getVendorBookings = async (req, res, next) => {
  try {
    const bookings = await bookingService.getVendorBookings(req.user.id);
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
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.cancelBooking(req.params.id, req.user.id);
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

