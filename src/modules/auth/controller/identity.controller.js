const identityService = require('../service/identity.service');

const submitKyc = async (req, res, next) => {
  try {
    const result = await identityService.submitKyc(req.user.id, req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getKycStatus = async (req, res, next) => {
  try {
    const result = await identityService.getKycStatus(req.user.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const updateKycStatus = async (req, res, next) => {
  try {
    // In a real app, check if req.user.role === 'admin'
    const { userId, status, rejectionReason } = req.body;
    const result = await identityService.updateKycStatus(userId, status, rejectionReason);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitKyc,
  getKycStatus,
  updateKycStatus,
};
