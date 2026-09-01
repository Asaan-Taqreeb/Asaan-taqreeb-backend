const VendorService = require('../model/vendorService.model');
const VendorAvailability = require('../model/vendorAvailability.model');

const CATEGORIES = ['BANQUET_HALL', 'CATERING', 'PHOTOGRAPHY', 'PARLOR_SALON'];

const populateActiveUserQuery = (query) => query.populate({ path: 'user', select: 'name email role isActive', match: { isActive: true } });

const populateActiveUserDoc = (doc) => doc.populate({ path: 'user', select: 'name email role isActive', match: { isActive: true } });

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
  const { category, basicInfo, capacity, packages, optionalServices, images, branches } = payload;

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
    branches: branches || [],
  });

  return populateActiveUserDoc(vendorService);
};

const getAllServices = async () => {
  // Legacy listings predate moderation and remain visible; every new/edited listing is explicit pending.
  const services = await VendorService.find({ $or: [{ approvalStatus: 'approved' }, { approvalStatus: { $exists: false } }] }).populate({ path: 'user', select: 'name email role isActive', match: { isActive: true } }).lean();
  return services.filter((service) => service.user);
};

const getServicesByUser = async (userId) => {
  const services = await VendorService.find({ user: userId }).populate({ path: 'user', select: 'name email role isActive', match: { isActive: true } }).lean();
  return services.filter((service) => service.user);
};

const getServiceById = async (serviceId) => {
  const service = await VendorService.findById(serviceId).populate({ path: 'user', select: 'name email role isActive', match: { isActive: true } }).lean();

  if (!service || !service.user) {
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

  const { basicInfo, capacity, images, optionalServices, branches, packages } = data;

  if (basicInfo) {
    if (basicInfo.name) service.basicInfo.name = basicInfo.name;
    if (basicInfo.location) service.basicInfo.location = basicInfo.location;
    if (basicInfo.landmark !== undefined) service.basicInfo.landmark = basicInfo.landmark;
    if (basicInfo.about !== undefined) service.basicInfo.about = basicInfo.about;
    if (basicInfo.latitude !== undefined) service.basicInfo.latitude = basicInfo.latitude;
    if (basicInfo.longitude !== undefined) service.basicInfo.longitude = basicInfo.longitude;
    if (basicInfo.isOnSite !== undefined) service.basicInfo.isOnSite = basicInfo.isOnSite;
    if (basicInfo.onSiteFee !== undefined) service.basicInfo.onSiteFee = basicInfo.onSiteFee;
    if (basicInfo.operatingHours) {
      service.basicInfo.operatingHours = {
        from: basicInfo.operatingHours.from || '09:00 AM',
        to: basicInfo.operatingHours.to || '09:00 PM',
      };
    }
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

  if (branches !== undefined && Array.isArray(branches)) {
    service.branches = branches;
  }

  if (packages !== undefined && Array.isArray(packages)) {
    service.packages = packages;
  }

  // Any vendor edit must be reviewed again before it is shown to clients.
  service.approvalStatus = 'pending';
  service.approvalNote = null;
  service.approvedAt = null;
  service.approvedBy = null;

  await service.save();
  return populateActiveUserDoc(service);
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
  return populateActiveUserDoc(service);
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
  return populateActiveUserDoc(service);
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
  return populateActiveUserDoc(service);
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
  return populateActiveUserDoc(service);
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
  return populateActiveUserDoc(service);
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
  return populateActiveUserDoc(service);
};

const getVendorAvailability = async (vendorId, fromDate, toDate, branchId) => {
  const query = { vendor: vendorId };

  if (branchId) {
    query.branchId = branchId;
  } else {
    query.$or = [{ branchId: null }, { branchId: { $exists: false } }, { branchId: '' }];
  }

  if (fromDate || toDate) {
    query.date = {};
    if (fromDate) query.date.$gte = fromDate;
    if (toDate) query.date.$lte = toDate;
  }

  return VendorAvailability.find(query).sort({ date: 1 }).lean();
};

const blockAvailability = async (vendorId, date, timeSlot, reason, branchId) => {
  const availability = await VendorAvailability.create({
    vendor: vendorId,
    date,
    timeSlot,
    reason: reason || 'Blocked',
    type: 'BLOCKED',
    branchId: branchId || undefined,
  });

  return availability;
};

const unblockAvailability = async (vendorId, date, timeSlot, branchId) => {
  const query = {
    vendor: vendorId,
    date,
  };

  if (timeSlot && timeSlot.from && timeSlot.to) {
    query['timeSlot.from'] = timeSlot.from;
    query['timeSlot.to'] = timeSlot.to;
  } else {
    query.type = 'BLOCKED';
  }

  if (branchId) {
    query.branchId = branchId;
  } else {
    query.$or = [{ branchId: null }, { branchId: { $exists: false } }, { branchId: '' }];
  }

  const result = await VendorAvailability.deleteMany(query);

  if (result.deletedCount === 0) {
    const error = new Error('Availability record not found');
    error.statusCode = 404;
    throw error;
  }

  return { message: 'Availability unblocked successfully' };
};

const normalizeTimeToHHMM = (timeStr) => {
  if (!timeStr) return '00:00';
  const str = String(timeStr).trim().toUpperCase();
  const ampmMatch = str.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);
  if (ampmMatch) {
    let hour = Number(ampmMatch[1]);
    const minute = ampmMatch[2] || '00';
    const period = ampmMatch[3];
    if (hour === 12) hour = 0;
    if (period === 'PM') hour += 12;
    return `${String(hour).padStart(2, '0')}:${minute.padStart(2, '0')}`;
  }
  const h24Match = str.match(/^(\d{1,2}):(\d{2})$/);
  if (h24Match) {
    const hour = Number(h24Match[1]);
    const minute = Number(h24Match[2]);
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }
  return str;
};

const toMinutes = (timeStr) => {
  const normalized = normalizeTimeToHHMM(timeStr);
  const parts = normalized.split(':');
  if (parts.length >= 2) {
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    if (!isNaN(h) && !isNaN(m)) {
      return h * 60 + m;
    }
  }
  return null;
};

const timeRangesOverlap = (rangeA, rangeB) => {
  const fromA = toMinutes(rangeA.from);
  let toA = toMinutes(rangeA.to);
  const fromB = toMinutes(rangeB.from);
  let toB = toMinutes(rangeB.to);

  if (fromA === null || toA === null || fromB === null || toB === null) return false;
  if (toA <= fromA) toA += 24 * 60;
  if (toB <= fromB) toB += 24 * 60;

  return Math.max(fromA, fromB) < Math.min(toA, toB);
};

const isTimeSlotAvailable = async (vendorId, date, timeSlot, branchId) => {
  const normalizedSlot = {
    from: normalizeTimeToHHMM(timeSlot?.from),
    to: normalizeTimeToHHMM(timeSlot?.to),
  };

  const query = {
    vendor: vendorId,
    date,
    type: 'BLOCKED',
  };

  if (branchId) {
    query.branchId = branchId;
  } else {
    query.$or = [{ branchId: null }, { branchId: { $exists: false } }, { branchId: '' }];
  }

  const blocks = await VendorAvailability.find(query);
  for (const block of blocks) {
    if (block.timeSlot && timeRangesOverlap(normalizedSlot, block.timeSlot)) {
      return false;
    }
  }

  return true;
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
  return populateActiveUserDoc(service);
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
  return populateActiveUserDoc(service);
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
