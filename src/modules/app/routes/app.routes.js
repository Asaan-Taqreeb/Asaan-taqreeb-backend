const express = require('express');
const appController = require('../controller/app.controller');
const categoryController = require('../controller/category.controller');
const { protect: authenticate, authorize } = require('../../../shared/middleware/auth.middleware');
const ROLES = require('../../../shared/enums/roles.enum');

const router = express.Router();

router.get('/update-info', appController.getUpdateInfo);

// Category routes
router.get('/categories', categoryController.getAllCategories);
router.get('/categories/:key', categoryController.getCategoryByKey);
router.post('/category-requests', authenticate, authorize(ROLES.VENDOR), categoryController.requestCategory);
router.post('/categories', authenticate, authorize(ROLES.ADMIN), categoryController.createCategory);
router.put('/categories/:id', authenticate, authorize(ROLES.ADMIN), categoryController.updateCategory);
router.delete('/categories/:id', authenticate, authorize(ROLES.ADMIN), categoryController.deleteCategory);

module.exports = router;
