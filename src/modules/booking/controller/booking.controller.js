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

module.exports = {
  createBooking,
  getMyBookings,
  getVendorBookings,
};

