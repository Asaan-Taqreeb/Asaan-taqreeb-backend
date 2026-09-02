const express = require('express');
const vendorController = require('../controller/vendor.controller');
const vendorAgreementController = require('../controller/vendorAgreement.controller');
const commissionHistoryController = require('../controller/commissionHistory.controller');
const { protect: authenticate, authorize } = require('../../../shared/middleware/auth.middleware');
const ROLES = require('../../../shared/enums/roles.enum');

const router = express.Router();

// Public: get all vendors (basic info)
router.get('/', vendorController.getAllVendors);

// Agreement routes
router.get('/agreement/text', vendorAgreementController.getAgreementText);
router.get('/agreement', authenticate, authorize(ROLES.VENDOR), vendorAgreementController.getAgreement);
router.post('/agreement/accept', authenticate, authorize(ROLES.VENDOR), vendorAgreementController.acceptAgreement);
router.post('/agreement/reject', authenticate, authorize(ROLES.VENDOR), vendorAgreementController.rejectAgreement);
router.get('/agreement/commission/outstanding', authenticate, authorize(ROLES.VENDOR), vendorAgreementController.getOutstandingCommission);

// Commission history routes
router.get('/commission/history', authenticate, authorize(ROLES.VENDOR), commissionHistoryController.getCommissionHistory);
router.get('/commission/summary', authenticate, authorize(ROLES.VENDOR), commissionHistoryController.getCommissionSummary);
router.get('/commission/summary/monthly', authenticate, authorize(ROLES.VENDOR), commissionHistoryController.getMonthlyCommissionSummary);
router.get('/commission/overdue', authenticate, authorize(ROLES.VENDOR), commissionHistoryController.getOverdueCommissions);
router.post('/commission/pay', authenticate, authorize(ROLES.VENDOR), commissionHistoryController.recordPayment);

module.exports = router;
