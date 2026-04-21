const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../../../shared/middleware/auth.middleware');
const availabilityController = require('../controller/availability.controller');
const ROLES = require('../../../shared/enums/roles.enum');

const router = express.Router();

const timeSlotValidation = [
  body('timeSlot.from').trim().notEmpty().withMessage('timeSlot.from is required'),
  body('timeSlot.to').trim().notEmpty().withMessage('timeSlot.to is required'),
];

const blockDateValidation = [
  ...timeSlotValidation,
  body('reason').optional().trim(),
];

// Public: get vendor's availability
router.get('/:vendorId', availabilityController.getAvailability);

// Protected (Vendor): block a date/time slot
router.put(
  '/:date',
  protect,
  authorize(ROLES.VENDOR),
  blockDateValidation,
  availabilityController.blockDate
);

// Protected (Vendor): unblock a date/time slot
router.delete(
  '/:date',
  protect,
  authorize(ROLES.VENDOR),
  timeSlotValidation,
  availabilityController.unblockDate
);

module.exports = router;
