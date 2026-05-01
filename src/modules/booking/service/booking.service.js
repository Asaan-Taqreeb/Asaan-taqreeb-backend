const Booking = require('../model/booking.model');
const VendorService = require('../../vendor/model/vendorService.model');
const VendorAvailability = require('../../vendor/model/vendorAvailability.model');
const { createNotification } = require('../../notifications/service/notification.service');

const calculatePricing = (category, pkg, guestCount, providedTotal, providedAdvance) => {
  if (providedTotal !== undefined && providedTotal !== null) {
    const totalAmount = providedTotal;
    const advanceAmount = providedAdvance !== undefined && providedAdvance !== null 
      ? providedAdvance 
      : Math.floor(totalAmount * 0.5);
    return { totalAmount, advanceAmount };
  }

  if (category === 'CATERING' && pkg.pricePerHead && guestCount) {
    const totalAmount = pkg.pricePerHead * guestCount;
    const advanceAmount = Math.floor(totalAmount * 0.5);
    return { totalAmount, advanceAmount };
  }

  const totalAmount = pkg.price || 0;
  const advanceAmount = Math.floor(totalAmount * 0.5);
  return { totalAmount, advanceAmount };
};

// Check for time slot conflicts
const checkTimeSlotConflict = async (vendorId, date, timeSlot) => {
  // Check for blocked availability or existing bookings
  const conflict = await VendorAvailability.findOne({
    vendor: vendorId,
    date,
    $or: [
      { 'timeSlot.from': { $lt: timeSlot.to }, 'timeSlot.to': { $gt: timeSlot.from } },
    ],
  });

  if (conflict) {
    const error = new Error(
      `Time slot conflict on ${date} from ${timeSlot.from} to ${timeSlot.to}`
    );
    error.statusCode = 409;
    throw error;
  }

  // Also check for existing confirmed bookings
  const bookingConflict = await Booking.findOne({
    vendor: vendorId,
    date,
    status: { $in: ['CONFIRMED', 'APPROVED'] },
    $or: [
      { 'timeSlot.from': { $lt: timeSlot.to }, 'timeSlot.to': { $gt: timeSlot.from } },
    ],
  });

  if (bookingConflict) {
    const error = new Error(
      `This time slot is already booked on ${date}`
    );
    error.statusCode = 409;
    throw error;
  }
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
    totalAmount,
    advancePayment,
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
      const error = new Error(
        `Guest count must be between ${service.capacity.minGuests} and ${service.capacity.maxGuests}`
      );
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

  // Check for time slot conflicts BEFORE creating booking
  await checkTimeSlotConflict(service.user._id, date, timeSlot);

  const addons = selectedAddons
    .map((name) => service.optionalServices.find((a) => a.name === name))
    .filter(Boolean)
    .map((a) => ({ name: a.name, price: a.price }));

  const pricing = calculatePricing(category, pkg, guestCount, totalAmount, advancePayment);

  const booking = await Booking.create({
    client: clientId,
    vendor: service.user._id,
    service: service._id,
    category,
    selectedPackage: {
      name: pkg.name,
      price: pkg.price,
      guestCount: guestCount || pkg.guestCount,
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
    status: 'PENDING',
  });

  // Block the time slot immediately when booking is created (PENDING status)
  // This prevents double-booking while vendor is reviewing the request
  await VendorAvailability.create({
    vendor: service.user._id,
    date,
    timeSlot,
    reason: 'Booking Pending',
    type: 'PENDING_BOOKING',
  });

  // Populate fields after creating booking
  await booking.populate('vendor', 'name email');
  await booking.populate('service', 'category basicInfo');
  
  // Create notification for vendor
  await createNotification(
    service.user._id,
    'New Booking Request',
    `You have a new booking request for ${service.basicInfo.name}.`,
    'BOOKING_UPDATE',
    { bookingId: booking._id }
  );
  
  return booking;
};

const getMyBookings = async (clientId) => {
  return Booking.find({ client: clientId })
    .populate('service', 'category basicInfo')
    .populate('vendor', 'name email')
    .sort({ createdAt: -1 });
};

const getVendorBookings = async (vendorId) => {
  return Booking.find({ vendor: vendorId })
    .populate('service', 'category basicInfo')
    .populate('client', 'name email')
    .sort({ createdAt: -1 });
};

const getBookingById = async (bookingId) => {
  const booking = await Booking.findById(bookingId)
    .populate('service')
    .populate('vendor', 'name email')
    .populate('client', 'name email');

  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  return booking;
};

const updateBookingStatus = async (bookingId, vendorId, status, rejectionReason = null) => {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  if (booking.vendor.toString() !== vendorId.toString()) {
    const error = new Error('Not authorized to update this booking');
    error.statusCode = 403;
    throw error;
  }

  const validStatuses = ['PENDING', 'CONFIRMED', 'APPROVED', 'REJECTED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    const error = new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    error.statusCode = 422;
    throw error;
  }

  booking.status = status;

  // If approved/confirmed, convert PENDING_BOOKING to BOOKED
  if (status === 'APPROVED' || status === 'CONFIRMED') {
    // Update the pending booking entry to BOOKED
    await VendorAvailability.updateOne(
      {
        vendor: booking.vendor,
        date: booking.date,
        timeSlot: booking.timeSlot,
        type: 'PENDING_BOOKING',
      },
      {
        type: 'BOOKED',
        reason: 'Booking Confirmed',
      }
    );
  }

  // If rejected or cancelled, remove the availability block entirely
  if (status === 'REJECTED' || status === 'CANCELLED') {
    await VendorAvailability.deleteOne({
      vendor: booking.vendor,
      date: booking.date,
      timeSlot: booking.timeSlot,
      $or: [
        { type: 'PENDING_BOOKING' },
        { type: 'BOOKED' }
      ],
    });

    if (status === 'REJECTED' && rejectionReason) {
      booking.rejectionReason = rejectionReason;
    }
  }

  await booking.save();
  await booking.populate('vendor', 'name email');
  await booking.populate('service', 'category basicInfo');
  await booking.populate('client', 'name email');

  // Create notification based on status
  let title = '';
  let body = '';
  let notifyUserId = booking.client._id; // Default notify client

  if (status === 'APPROVED' || status === 'CONFIRMED') {
    title = 'Booking Approved!';
    body = `Your booking for ${booking.service.basicInfo.name} has been approved.`;
  } else if (status === 'REJECTED') {
    title = 'Booking Rejected';
    body = `Your booking for ${booking.service.basicInfo.name} was rejected.`;
  } else if (status === 'CANCELLED') {
    title = 'Booking Cancelled';
    // If client cancelled, notify vendor (Assuming vendorId here might mean the person calling it, wait: vendorId here is checked against booking.vendor)
    body = `Your booking for ${booking.service.basicInfo.name} was cancelled.`;
  }

  if (title) {
    await createNotification(
      notifyUserId,
      title,
      body,
      'BOOKING_UPDATE',
      { bookingId: booking._id, status }
    );
  }

  return booking;
};

module.exports = {
  createBooking,
  getMyBookings,
  getVendorBookings,
  getBookingById,
  updateBookingStatus,
};

