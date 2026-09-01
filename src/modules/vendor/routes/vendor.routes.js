const express = require('express');
const vendorController = require('../controller/vendor.controller');
const vendorAgreementController = require('../controller/vendorAgreement.controller');
const commissionHistoryController = require('../controller/commissionHistory.controller');
const { authenticate, authorize } = require('../../shared/middleware/auth');

const router = express.Router();

// Public: get all vendors (basic info)
router.get('/', vendorController.getAllVendors);

// Agreement routes
router.get('/agreement/text', vendorAgreementController.getAgreementText);
router.get('/agreement', authenticate, authorize(['vendor']), vendorAgreementController.getAgreement);
router.post('/agreement/accept', authenticate, authorize(['vendor']), vendorAgreementController.acceptAgreement);
router.post('/agreement/reject', authenticate, authorize(['vendor']), vendorAgreementController.rejectAgreement);
router.get('/agreement/commission/outstanding', authenticate, authorize(['vendor']), vendorAgreementController.getOutstandingCommission);

// Commission history routes
router.get('/commission/history', authenticate, authorize(['vendor']), commissionHistoryController.getCommissionHistory);
router.get('/commission/summary', authenticate, authorize(['vendor']), commissionHistoryController.getCommissionSummary);
router.get('/commission/summary/monthly', authenticate, authorize(['vendor']), commissionHistoryController.getMonthlyCommissionSummary);
router.get('/commission/overdue', authenticate, authorize(['vendor']), commissionHistoryController.getOverdueCommissions);

module.exports = router;

