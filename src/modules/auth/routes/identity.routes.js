const express = require('express');
const identityController = require('../controller/identity.controller');
const { protect } = require('../../../shared/middleware/auth.middleware');

const router = express.Router();

router.use(protect); // All identity routes require authentication

router.post('/submit', identityController.submitKyc);
router.get('/status', identityController.getKycStatus);

// Admin route to approve/reject (could be moved to a separate admin module later)
router.patch('/review', identityController.updateKycStatus);

module.exports = router;
