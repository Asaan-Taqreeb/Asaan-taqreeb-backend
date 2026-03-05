const { validationResult } = require('express-validator');
const vendorService = require('../service/vendorService.service');

const createService = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const result = await vendorService.createVendorService(req.user.id, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getAllServices = async (req, res, next) => {
  try {
    const services = await vendorService.getAllServices();
    res.status(200).json({ success: true, data: services });
  } catch (error) {
    next(error);
  }
};

const getMyServices = async (req, res, next) => {
  try {
    const services = await vendorService.getServicesByUser(req.user.id);
    res.status(200).json({ success: true, data: services });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createService,
  getAllServices,
  getMyServices,
};

