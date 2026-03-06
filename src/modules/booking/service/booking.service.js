const Booking = require('../model/booking.model');
const VendorService = require('../../vendor/model/vendorService.model');

const calculatePricing = (category, pkg, guestCount) => {
  if (category === 'CATERING' && pkg.pricePerHead && guestCount) {
    const totalAmount = pkg.pricePerHead * guestCount;
    const advanceAmount = Math.floor(totalAmount * 0.5);
    return { totalAmount, advanceAmount };
  }

  const totalAmount = pkg.price || 0;
  const advanceAmount = Math.floor(totalAmount * 0.5);
  return { totalAmount, advanceAmount };
};

const createBooking = async (clientId, payload) => {
  const {
    serviceId,
    category,
    packageName,
    guestCount,
    date,
    timeSlot,
    location,
    specialRequests,
    selectedAddons = [],
  } = payload;

  const service = await VendorService.findById(serviceId).populate('user', 'name email role');
  if (!service) {
    const error = new Error('Service not found');
    error.statusCode = 404;
    throw error;
  }

  if (service.category !== category) {
    const error = new Error('Category mismatch for this service');
    error.statusCode = 400;
    throw error;
  }

  if (category === 'BANQUET_HALL' && service.capacity && service.capacity.maxGuests) {
    if (guestCount > service.capacity.maxGuests || guestCount < service.capacity.minGuests) {
      const error = new Error('Guest count is outside hall capacity range');
      error.statusCode = 400;
      throw error;
    }
  }

  const pkg = service.packages.find((p) => p.name === packageName);
  if (!pkg) {
    const error = new Error('Selected package not found for this service');
    error.statusCode = 400;
    throw error;
  }

  const addons = selectedAddons
    .map((name) => service.optionalServices.find((a) => a.name === name))
    .filter(Boolean)
    .map((a) => ({ name: a.name, price: a.price }));

  const pricing = calculatePricing(category, pkg, guestCount);

  const booking = await Booking.create({
    client: clientId,
    vendor: service.user._id,
    service: service._id,
    category,
    selectedPackage: {
      name: pkg.name,
      price: pkg.price,
      guestCount,
      pricePerHead: pkg.pricePerHead,
      details: pkg.details,
      items: pkg.items,
    },
    guestCount,
    date,
    timeSlot,
    location,
    specialRequests,
    optionalAddons: addons,
    pricing,
  });

  return booking;
};

const getMyBookings = async (clientId) => {
  return Booking.find({ client: clientId })
    .populate('service', 'category basicInfo')
    .populate('vendor', 'name email');
};

const getVendorBookings = async (vendorId) => {
  return Booking.find({ vendor: vendorId })
    .populate('service', 'category basicInfo')
    .populate('client', 'name email');
};

module.exports = {
  createBooking,
  getMyBookings,
  getVendorBookings,
};

