const express = require('express');
const appController = require('../controller/app.controller');
const categoryController = require('../controller/category.controller');
const { protect: authenticate, authorize } = require('../../../shared/middleware/auth.middleware');

const router = express.Router();

router.get('/update-info', appController.getUpdateInfo);

// Category routes
router.get('/categories', categoryController.getAllCategories);
router.get('/categories/:key', categoryController.getCategoryByKey);
router.post('/categories', authenticate, authorize(['admin']), categoryController.createCategory);
router.put('/categories/:id', authenticate, authorize(['admin']), categoryController.updateCategory);
router.delete('/categories/:id', authenticate, authorize(['admin']), categoryController.deleteCategory);

module.exports = router;
