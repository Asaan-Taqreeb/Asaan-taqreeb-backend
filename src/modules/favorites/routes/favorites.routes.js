const express = require('express');
const { protect } = require('../../../shared/middleware/auth.middleware');
const favoritesController = require('../controller/favorites.controller');

const router = express.Router();

// All favorites routes require authentication
router.use(protect);

router.post('/toggle', favoritesController.toggleFavorite);
router.get('/me', favoritesController.getMyFavorites);
router.get('/ids', favoritesController.getMyFavoriteIds);

module.exports = router;
