const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../../../shared/middleware/auth.middleware');
const vendorServiceController = require('../controller/vendorService.controller');

const router = express.Router();

const baseValidation = [
  body('category')
    .isIn(['BANQUET_HALL', 'CATERING', 'PHOTOGRAPHY', 'PARLOR_SALON'])
    .withMessage('Invalid category'),
  body('basicInfo.name').trim().notEmpty().withMessage('Name is required'),
  body('basicInfo.location').trim().notEmpty().withMessage('Location is required'),
];

const banquetHallExtraValidation = [
  body('capacity.minGuests')
    .if(body('category').equals('BANQUET_HALL'))
    .isInt({ min: 1 })
    .withMessage('minGuests is required and must be at least 1'),
  body('capacity.maxGuests')
    .if(body('category').equals('BANQUET_HALL'))
    .isInt({ min: 1 })
    .withMessage('maxGuests is required and must be at least 1'),
];

const cateringExtraValidation = [
  body('packages')
    .if(body('category').equals('CATERING'))
    .isArray({ min: 1 })
    .withMessage('At least one package is required for CATERING'),
  body('packages.*.pricePerHead')
    .if(body('category').equals('CATERING'))
    .isInt({ min: 1 })
    .withMessage('pricePerHead is required and must be at least 1'),
  body('packages.*.guestCount')
    .if(body('category').equals('CATERING'))
    .isInt({ min: 1 })
    .withMessage('guestCount is required and must be at least 1'),
];

// Public: get all services (for vendors & clients)
router.get('/', vendorServiceController.getAllServices);

// Auth: vendor creates a service
router.post(
  '/',
  protect,
  [...baseValidation, ...banquetHallExtraValidation, ...cateringExtraValidation],
  vendorServiceController.createService
);

// Auth: get services for logged-in vendor
router.get('/me', protect, vendorServiceController.getMyServices);

module.exports = router;

