const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/media.controller');
// const { protect } = require('../../auth/middleware/auth.middleware'); // Optional: protect this route

router.post('/delete', mediaController.deleteImage);

module.exports = router;
