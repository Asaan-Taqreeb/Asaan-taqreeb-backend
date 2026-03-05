const express = require('express');
const vendorController = require('../controller/vendor.controller');

const router = express.Router();

// Public: get all vendors (basic info)
router.get('/', vendorController.getAllVendors);

module.exports = router;

