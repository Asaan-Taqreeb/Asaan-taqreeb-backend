const { validationResult } = require('express-validator');
const vendorServiceService = require('../service/vendorService.service');

const getAvailability = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const availability = await vendorServiceService.getVendorAvailability(
      req.params.vendorId,
      from,
      to
    );
    res.status(200).json({ success: true, data: availability });
  } catch (error) {
    next(error);
  }
};

const blockDate = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const { timeSlot, reason } = req.body;
    const availability = await vendorServiceService.blockAvailability(
      req.user.id,
      req.params.date,
      timeSlot,
      reason
    );
    res.status(201).json({ success: true, data: availability });
  } catch (error) {
    next(error);
  }
};

const unblockDate = async (req, res, next) => {
  try {
    const { timeSlot } = req.body;
    const result = await vendorServiceService.unblockAvailability(
      req.user.id,
      req.params.date,
      timeSlot
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAvailability,
  blockDate,
  unblockDate,
};
