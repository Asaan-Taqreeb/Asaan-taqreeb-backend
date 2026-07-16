const express = require('express');
const router = express.Router();
const adminController = require('../controller/admin.controller');
const { protect, authorize } = require('../../../shared/middleware/auth.middleware');
const ROLES = require('../../../shared/enums/roles.enum');

// Protect all admin routes with authentication and restrict to ADMIN role
router.use(protect);
router.use(authorize(ROLES.ADMIN));

router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.patch('/users/:id/verify', adminController.verifyUserKYC);
router.delete('/users/:id', adminController.deleteUser);

// Services management
router.get('/services', adminController.getServices);
router.delete('/services/:id', adminController.deleteService);

module.exports = router;
