const { validationResult } = require('express-validator');
const vendorServiceService = require('../service/vendorService.service');
const { uploadMultipleImages, deleteFromSupabase } = require('../../../shared/utils/upload.util');

const createService = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const result = await vendorServiceService.createVendorService(req.user.id, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getAllServices = async (req, res, next) => {
  try {
    const services = await vendorServiceService.getAllServices();
    res.status(200).json({ success: true, data: services });
  } catch (error) {
    next(error);
  }
};

const getMyServices = async (req, res, next) => {
  try {
    const services = await vendorServiceService.getServicesByUser(req.user.id);
    res.status(200).json({ success: true, data: services });
  } catch (error) {
    next(error);
  }
};

const getServiceById = async (req, res, next) => {
  try {
    const service = await vendorServiceService.getServiceById(req.params.id);
    res.status(200).json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

const updateService = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const result = await vendorServiceService.updateService(
      req.params.id,
      req.user.id,
      req.body
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const deleteService = async (req, res, next) => {
  try {
    const result = await vendorServiceService.deleteService(req.params.id, req.user.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// Package CRUD
const addPackage = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const result = await vendorServiceService.addPackage(
      req.params.serviceId,
      req.user.id,
      req.body
    );
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const updatePackage = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const result = await vendorServiceService.updatePackage(
      req.params.serviceId,
      req.user.id,
      req.params.packageId,
      req.body
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const deletePackage = async (req, res, next) => {
  try {
    const result = await vendorServiceService.deletePackage(
      req.params.serviceId,
      req.user.id,
      req.params.packageId
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// Optional Services (Add-ons) CRUD
const addOptionalService = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const result = await vendorServiceService.addOptionalService(
      req.params.serviceId,
      req.user.id,
      req.body
    );
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const updateOptionalService = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const result = await vendorServiceService.updateOptionalService(
      req.params.serviceId,
      req.user.id,
      req.params.addonId,
      req.body
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const deleteOptionalService = async (req, res, next) => {
  try {
    const result = await vendorServiceService.deleteOptionalService(
      req.params.serviceId,
      req.user.id,
      req.params.addonId
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const uploadImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No images provided' });
    }

    const imageUrls = await uploadMultipleImages(req.files, 'services');
    const result = await vendorServiceService.addServiceImages(
      req.params.serviceId,
      req.user.id,
      imageUrls
    );

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const deleteImage = async (req, res, next) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'Image URL is required' });
    }

    // Delete from Supabase
    await deleteFromSupabase(imageUrl);
    
    // Remove from service
    const result = await vendorServiceService.removeServiceImage(
      req.params.serviceId,
      req.user.id,
      imageUrl
    );

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createService,
  getAllServices,
  getMyServices,
  getServiceById,
  updateService,
  deleteService,
  addPackage,
  updatePackage,
  deletePackage,
  addOptionalService,
  updateOptionalService,
  deleteOptionalService,
  uploadImages,
  deleteImage,
};

