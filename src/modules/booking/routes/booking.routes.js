const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../../../shared/middleware/auth.middleware');
const bookingController = require('../controller/booking.controller');
const ROLES = require('../../../shared/enums/roles.enum');

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

const updateStatusValidation = [
  body('status')
    .isIn(['PENDING', 'CONFIRMED', 'APPROVED', 'REJECTED', 'CANCELLED'])
    .withMessage('Invalid status'),
  body('rejectionReason').optional().trim(),
];

// Protected (Client): create booking
router.post('/', protect, authorize(ROLES.CLIENT), createBookingValidation, bookingController.createBooking);

// Protected (Client): get own bookings
router.get('/me', protect, authorize(ROLES.CLIENT), bookingController.getMyBookings);

// Protected (Vendor): get bookings for vendor's services
router.get('/vendor/me', protect, authorize(ROLES.VENDOR), bookingController.getVendorBookings);

// Protected (Vendor): update booking status
router.patch(
  '/:id/status',
  protect,
  authorize(ROLES.VENDOR),
  updateStatusValidation,
  bookingController.updateBookingStatus
);

module.exports = router;

