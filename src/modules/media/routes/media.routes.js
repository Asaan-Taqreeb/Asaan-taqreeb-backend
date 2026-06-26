const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/media.controller');
const { protect } = require('../../../shared/middleware/auth.middleware');

router.post('/delete', protect, mediaController.deleteImage);

module.exports = router;
