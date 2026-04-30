const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../../../shared/middleware/auth.middleware');
const vendorServiceController = require('../controller/vendorService.controller');
const ROLES = require('../../../shared/enums/roles.enum');
const { upload } = require('../../../shared/utils/upload.util');

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

const packageValidation = [
  body('name').trim().notEmpty().withMessage('Package name is required'),
  body('price').isInt({ min: 0 }).withMessage('Price is required and must be >= 0'),
  body('pricePerHead').optional().isInt({ min: 1 }).withMessage('pricePerHead must be >= 1'),
  body('guestCount').optional().isInt({ min: 1 }).withMessage('guestCount must be >= 1'),
  body('details').optional().trim(),
  body('items').optional().isArray().withMessage('Items must be an array'),
];

const optionalServiceValidation = [
  body('name').trim().notEmpty().withMessage('Service name is required'),
  body('price').isInt({ min: 0 }).withMessage('Price is required and must be >= 0'),
  body('details').optional().trim(),
];

const updateServiceValidation = [
  body('basicInfo.name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('basicInfo.location').optional().trim().notEmpty().withMessage('Location cannot be empty'),
  body('basicInfo.landmark').optional().trim(),
  body('basicInfo.about').optional().trim(),
  body('capacity.minGuests').optional().isInt({ min: 1 }).withMessage('minGuests must be >= 1'),
  body('capacity.maxGuests').optional().isInt({ min: 1 }).withMessage('maxGuests must be >= 1'),
  body('images').optional().isArray().withMessage('Images must be an array'),
];

// Services
// Public: get all services
router.get('/', vendorServiceController.getAllServices);

// Protected (Vendor): get vendor's own services - MUST come before /:id
router.get('/me', protect, authorize(ROLES.VENDOR), vendorServiceController.getMyServices);

// Public: get single service
router.get('/:id', vendorServiceController.getServiceById);

// Protected (Vendor): create service
router.post(
  '/',
  protect,
  authorize(ROLES.VENDOR),
  [...baseValidation, ...banquetHallExtraValidation, ...cateringExtraValidation],
  vendorServiceController.createService
);

// Protected (Vendor): update service
router.put(
  '/:id',
  protect,
  authorize(ROLES.VENDOR),
  updateServiceValidation,
  vendorServiceController.updateService
);

// Protected (Vendor): delete service
router.delete(
  '/:id',
  protect,
  authorize(ROLES.VENDOR),
  vendorServiceController.deleteService
);

// Packages
// Protected (Vendor): add package
router.post(
  '/:serviceId/packages',
  protect,
  authorize(ROLES.VENDOR),
  packageValidation,
  vendorServiceController.addPackage
);

// Protected (Vendor): update package
router.put(
  '/:serviceId/packages/:packageId',
  protect,
  authorize(ROLES.VENDOR),
  packageValidation,
  vendorServiceController.updatePackage
);

// Protected (Vendor): delete package
router.delete(
  '/:serviceId/packages/:packageId',
  protect,
  authorize(ROLES.VENDOR),
  vendorServiceController.deletePackage
);

// Optional Services (Add-ons)
// Protected (Vendor): add optional service
router.post(
  '/:serviceId/optional-services',
  protect,
  authorize(ROLES.VENDOR),
  optionalServiceValidation,
  vendorServiceController.addOptionalService
);

// Protected (Vendor): update optional service
router.put(
  '/:serviceId/optional-services/:addonId',
  protect,
  authorize(ROLES.VENDOR),
  optionalServiceValidation,
  vendorServiceController.updateOptionalService
);

// Protected (Vendor): delete optional service
router.delete(
  '/:serviceId/optional-services/:addonId',
  protect,
  authorize(ROLES.VENDOR),
  vendorServiceController.deleteOptionalService
);

// Image Upload Routes
// Protected (Vendor): upload images for service
router.post(
  '/:serviceId/images',
  protect,
  authorize(ROLES.VENDOR),
  upload.array('images', 5), // Max 5 images
  vendorServiceController.uploadImages
);

// Protected (Vendor): delete service image
router.delete(
  '/:serviceId/images',
  protect,
  authorize(ROLES.VENDOR),
  vendorServiceController.deleteImage
);

module.exports = router;

