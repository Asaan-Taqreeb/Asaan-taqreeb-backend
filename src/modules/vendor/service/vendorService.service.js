const VendorService = require('../model/vendorService.model');
const VendorAvailability = require('../model/vendorAvailability.model');

const CATEGORIES = ['BANQUET_HALL', 'CATERING', 'PHOTOGRAPHY', 'PARLOR_SALON'];

const validateCategoryRules = (category, data) => {
  if (category === 'BANQUET_HALL') {
    if (!data.capacity || !data.capacity.minGuests || !data.capacity.maxGuests) {
      const error = new Error('BANQUET_HALL requires capacity.minGuests and capacity.maxGuests');
      error.statusCode = 422;
      throw error;
    }
    if (data.capacity.minGuests < 1 || data.capacity.maxGuests < 1) {
      const error = new Error('Capacity values must be at least 1');
      error.statusCode = 422;
      throw error;
    }
  }

  if (category === 'CATERING') {
    if (!data.packages || data.packages.length === 0) {
      const error = new Error('CATERING requires at least one package');
      error.statusCode = 422;
      throw error;
    }
    for (const pkg of data.packages) {
      if (!pkg.pricePerHead || pkg.pricePerHead < 1) {
        const error = new Error('CATERING packages require pricePerHead >= 1');
        error.statusCode = 422;
        throw error;
      }
      if (!pkg.guestCount || pkg.guestCount < 1) {
        const error = new Error('CATERING packages require guestCount >= 1');
        error.statusCode = 422;
        throw error;
      }
    }
  }
};

const createVendorService = async (userId, payload) => {
  const { category, basicInfo, capacity, packages, optionalServices, images } = payload;

  if (!CATEGORIES.includes(category)) {
    const error = new Error(`Category must be one of: ${CATEGORIES.join(', ')}`);
    error.statusCode = 422;
    throw error;
  }

  if (!basicInfo || !basicInfo.name || !basicInfo.location) {
    const error = new Error('basicInfo.name and basicInfo.location are required');
    error.statusCode = 422;
    throw error;
  }

  validateCategoryRules(category, payload);

  const existingService = await VendorService.findOne({ user: userId, category });
  if (existingService) {
    // Update existing service instead of rejecting - allows vendors to update their service without deleting
    return updateService(existingService._id, userId, payload);
  }

  const vendorService = await VendorService.create({
    user: userId,
    category,
    basicInfo,
    capacity: capacity || {},
    packages: packages || [],
    optionalServices: optionalServices || [],
    images: images || [],
  });

  return vendorService.populate('user', 'name email role');
};

const getAllServices = async () => {
  return VendorService.find().populate('user', 'name email role').lean();
};

const getServicesByUser = async (userId) => {
  return VendorService.find({ user: userId }).populate('user', 'name email role').lean();
};

const getServiceById = async (serviceId) => {
  const service = await VendorService.findById(serviceId).populate('user', 'name email role').lean();

  if (!service) {
    const error = new Error('Service not found');
    error.statusCode = 404;
    throw error;
  }

  return service;
};

const updateService = async (serviceId, vendorId, data) => {
  const service = await VendorService.findById(serviceId);

  if (!service) {
    const error = new Error('Service not found');
    error.statusCode = 404;
    throw error;
  }

  if (service.user.toString() !== vendorId.toString()) {
    const error = new Error('Not authorized to update this service');
    error.statusCode = 403;
    throw error;
  }

  const { basicInfo, capacity, images, optionalServices } = data;

  if (basicInfo) {
    if (basicInfo.name) service.basicInfo.name = basicInfo.name;
    if (basicInfo.location) service.basicInfo.location = basicInfo.location;
    if (basicInfo.landmark !== undefined) service.basicInfo.landmark = basicInfo.landmark;
    if (basicInfo.about !== undefined) service.basicInfo.about = basicInfo.about;
  }

  if (capacity) {
    if (capacity.minGuests !== undefined) service.capacity.minGuests = capacity.minGuests;
    if (capacity.maxGuests !== undefined) service.capacity.maxGuests = capacity.maxGuests;
  }

  if (images) {
    service.images = images;
  }

  if (optionalServices !== undefined && Array.isArray(optionalServices)) {
    service.optionalServices = optionalServices.filter((s) => s?.name?.trim() && s?.price !== undefined);
  }

  await service.save();
  return service.populate('user', 'name email role');
};

const deleteService = async (serviceId, vendorId) => {
  const service = await VendorService.findById(serviceId);

  if (!service) {
    const error = new Error('Service not found');
    error.statusCode = 404;
    throw error;
  }

  if (service.user.toString() !== vendorId.toString()) {
    const error = new Error('Not authorized to delete this service');
    error.statusCode = 403;
    throw error;
  }

  await VendorService.findByIdAndDelete(serviceId);
  return { message: 'Service deleted successfully' };
};

const addPackage = async (serviceId, vendorId, packageData) => {
  const service = await VendorService.findById(serviceId);

  if (!service) {
    const error = new Error('Service not found');
    error.statusCode = 404;
    throw error;
  }

  if (service.user.toString() !== vendorId.toString()) {
    const error = new Error('Not authorized to update this service');
    error.statusCode = 403;
    throw error;
  }

  service.packages.push(packageData);
  await service.save();
  return service.populate('user', 'name email role');
};

const updatePackage = async (serviceId, vendorId, packageId, packageData) => {
  const service = await VendorService.findById(serviceId);

  if (!service) {
    const error = new Error('Service not found');
    error.statusCode = 404;
    throw error;
  }

  if (service.user.toString() !== vendorId.toString()) {
    const error = new Error('Not authorized to update this service');
    error.statusCode = 403;
    throw error;
  }

  const pkgIndex = service.packages.findIndex((p) => p._id.toString() === packageId);
  if (pkgIndex === -1) {
    const error = new Error('Package not found');
    error.statusCode = 404;
    throw error;
  }

  Object.assign(service.packages[pkgIndex], packageData);
  await service.save();
  return service.populate('user', 'name email role');
};

const deletePackage = async (serviceId, vendorId, packageId) => {
  const service = await VendorService.findById(serviceId);

  if (!service) {
    const error = new Error('Service not found');
    error.statusCode = 404;
    throw error;
  }

  if (service.user.toString() !== vendorId.toString()) {
    const error = new Error('Not authorized to update this service');
    error.statusCode = 403;
    throw error;
  }

  const pkgIndex = service.packages.findIndex((p) => p._id.toString() === packageId);
  if (pkgIndex === -1) {
    const error = new Error('Package not found');
    error.statusCode = 404;
    throw error;
  }

  service.packages.splice(pkgIndex, 1);
  await service.save();
  return service.populate('user', 'name email role');
};

const addOptionalService = async (serviceId, vendorId, serviceData) => {
  const service = await VendorService.findById(serviceId);

  if (!service) {
    const error = new Error('Service not found');
    error.statusCode = 404;
    throw error;
  }

  if (service.user.toString() !== vendorId.toString()) {
    const error = new Error('Not authorized to update this service');
    error.statusCode = 403;
    throw error;
  }

  service.optionalServices.push(serviceData);
  await service.save();
  return service.populate('user', 'name email role');
};

const updateOptionalService = async (serviceId, vendorId, addonId, serviceData) => {
  const service = await VendorService.findById(serviceId);

  if (!service) {
    const error = new Error('Service not found');
    error.statusCode = 404;
    throw error;
  }

  if (service.user.toString() !== vendorId.toString()) {
    const error = new Error('Not authorized to update this service');
    error.statusCode = 403;
    throw error;
  }

  const addonIndex = service.optionalServices.findIndex((a) => a._id.toString() === addonId);
  if (addonIndex === -1) {
    const error = new Error('Optional service not found');
    error.statusCode = 404;
    throw error;
  }

  Object.assign(service.optionalServices[addonIndex], serviceData);
  await service.save();
  return service.populate('user', 'name email role');
};

const deleteOptionalService = async (serviceId, vendorId, addonId) => {
  const service = await VendorService.findById(serviceId);

  if (!service) {
    const error = new Error('Service not found');
    error.statusCode = 404;
    throw error;
  }

  if (service.user.toString() !== vendorId.toString()) {
    const error = new Error('Not authorized to update this service');
    error.statusCode = 403;
    throw error;
  }

  const addonIndex = service.optionalServices.findIndex((a) => a._id.toString() === addonId);
  if (addonIndex === -1) {
    const error = new Error('Optional service not found');
    error.statusCode = 404;
    throw error;
  }

  service.optionalServices.splice(addonIndex, 1);
  await service.save();
  return service.populate('user', 'name email role');
};

const getVendorAvailability = async (vendorId, fromDate, toDate) => {
  const query = { vendor: vendorId };

  if (fromDate || toDate) {
    query.date = {};
    if (fromDate) query.date.$gte = fromDate;
    if (toDate) query.date.$lte = toDate;
  }

  return VendorAvailability.find(query).sort({ date: 1 }).lean();
};

const blockAvailability = async (vendorId, date, timeSlot, reason) => {
  const availability = await VendorAvailability.create({
    vendor: vendorId,
    date,
    timeSlot,
    reason: reason || 'Blocked',
    type: 'BLOCKED',
  });

  return availability;
};

const unblockAvailability = async (vendorId, date, timeSlot) => {
  const result = await VendorAvailability.deleteOne({
    vendor: vendorId,
    date,
    'timeSlot.from': timeSlot.from,
    'timeSlot.to': timeSlot.to,
  });

  if (result.deletedCount === 0) {
    const error = new Error('Availability record not found');
    error.statusCode = 404;
    throw error;
  }

  return { message: 'Availability unblocked successfully' };
};

const isTimeSlotAvailable = async (vendorId, date, timeSlot) => {
  const conflict = await VendorAvailability.findOne({
    vendor: vendorId,
    date,
    $or: [
      { 'timeSlot.from': { $lte: timeSlot.from }, 'timeSlot.to': { $gt: timeSlot.from } },
      { 'timeSlot.from': { $lt: timeSlot.to }, 'timeSlot.to': { $gte: timeSlot.to } },
      { 'timeSlot.from': { $gte: timeSlot.from }, 'timeSlot.to': { $lte: timeSlot.to } },
    ],
  });

  return !conflict;
};

const addServiceImages = async (serviceId, vendorId, imageUrls) => {
  const service = await VendorService.findById(serviceId);

  if (!service) {
    const error = new Error('Service not found');
    error.statusCode = 404;
    throw error;
  }

  if (service.user.toString() !== vendorId.toString()) {
    const error = new Error('Not authorized to update this service');
    error.statusCode = 403;
    throw error;
  }

  // Add new images to existing images array
  service.images.push(...imageUrls);
  await service.save();
  return service.populate('user', 'name email role');
};

const removeServiceImage = async (serviceId, vendorId, imageUrl) => {
  const service = await VendorService.findById(serviceId);

  if (!service) {
    const error = new Error('Service not found');
    error.statusCode = 404;
    throw error;
  }

  if (service.user.toString() !== vendorId.toString()) {
    const error = new Error('Not authorized to update this service');
    error.statusCode = 403;
    throw error;
  }

  // Remove image from images array
  service.images = service.images.filter(img => img !== imageUrl);
  await service.save();
  return service.populate('user', 'name email role');
};

module.exports = {
  createVendorService,
  getAllServices,
  getServicesByUser,
  getServiceById,
  updateService,
  deleteService,
  addPackage,
  updatePackage,
  deletePackage,
  addOptionalService,
  updateOptionalService,
  deleteOptionalService,
  getVendorAvailability,
  blockAvailability,
  unblockAvailability,
  isTimeSlotAvailable,
  addServiceImages,
  removeServiceImage,
};

