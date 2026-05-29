const express = require('express');
const { protect, authorize } = require('../../../shared/middleware/auth.middleware');
const reviewController = require('../controller/review.controller');
const ROLES = require('../../../shared/enums/roles.enum');

const router = express.Router();

// Protected (Client): create review
router.post('/', protect, authorize(ROLES.CLIENT), reviewController.createReview);

// Public: get reviews for vendor
router.get('/vendor/:vendorId', reviewController.getVendorReviews);

// Public: get reviews for service
router.get('/service/:serviceId', reviewController.getServiceReviews);

module.exports = router;
