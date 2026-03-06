const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../../../shared/middleware/auth.middleware');
const bookingController = require('../controller/booking.controller');

const router = express.Router();

const createBookingValidation = [
  body('serviceId').notEmpty().withMessage('serviceId is required'),
  body('category')
    .isIn(['BANQUET_HALL', 'CATERING', 'PHOTOGRAPHY', 'PARLOR_SALON'])
    .withMessage('Invalid category'),
  body('packageName').trim().notEmpty().withMessage('packageName is required'),
  body('guestCount').isInt({ min: 1 }).withMessage('guestCount must be at least 1'),
  body('date').notEmpty().withMessage('date is required'),
  body('timeSlot.from').notEmpty().withMessage('timeSlot.from is required'),
  body('timeSlot.to').notEmpty().withMessage('timeSlot.to is required'),
];

// Client: create booking
router.post('/', protect, createBookingValidation, bookingController.createBooking);

// Client: get own bookings
router.get('/me', protect, bookingController.getMyBookings);

// Vendor: get bookings for vendor's services
router.get('/vendor/me', protect, bookingController.getVendorBookings);

module.exports = router;

