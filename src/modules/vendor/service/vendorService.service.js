const VendorService = require('../model/vendorService.model');

const createVendorService = async (userId, payload) => {
  const { category, basicInfo, capacity, packages, optionalServices } = payload;

  // Category-specific checks
  if (category === 'BANQUET_HALL') {
    if (!capacity || !capacity.minGuests || !capacity.maxGuests) {
      const error = new Error('Hall capacity (minGuests, maxGuests) is required for BANQUET_HALL');
      error.statusCode = 400;
      throw error;
    }
  }

  if (category === 'CATERING') {
    if (!packages || packages.length === 0) {
      const error = new Error('At least one package is required for CATERING');
      error.statusCode = 400;
      throw error;
    }
    const invalid = packages.find(
      (pkg) => pkg.pricePerHead == null || pkg.guestCount == null
    );
    if (invalid) {
      const error = new Error('pricePerHead and guestCount are required for every catering package');
      error.statusCode = 400;
      throw error;
    }
  }

  const vendorService = await VendorService.create({
    user: userId,
    category,
    basicInfo,
    capacity: category === 'BANQUET_HALL' ? capacity : undefined,
    packages: packages || [],
    optionalServices: optionalServices || [],
  });

  return vendorService;
};

const getAllServices = async () => {
  return VendorService.find().populate('user', 'name email role');
};

const getServicesByUser = async (userId) => {
  return VendorService.find({ user: userId }).populate('user', 'name email role');
};

module.exports = {
  createVendorService,
  getAllServices,
  getServicesByUser,
};

