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

  if ((category === 'CATERING' || category === 'BANQUET_HALL') && pkg.pricePerHead && guestCount) {
    const totalAmount = pkg.pricePerHead * guestCount;
    const advanceAmount = Math.floor(totalAmount * 0.5);
    return { totalAmount, advanceAmount };
  }

  const totalAmount = pkg.price || 0;
  const advanceAmount = Math.floor(totalAmount * 0.5);
  return { totalAmount, advanceAmount };
};

const getBookingTotalAmount = (booking) => {
  if (booking && booking.pricing && booking.pricing.totalAmount !== undefined && booking.pricing.totalAmount !== null) {
    return booking.pricing.totalAmount;
  }
  return booking.totalAmount || booking.price || booking.amount || (booking.selectedPackage && booking.selectedPackage.price) || 0;
};

const getBookingAdvanceAmount = (booking) => {
  if (booking && booking.pricing && booking.pricing.advanceAmount !== undefined && booking.pricing.advanceAmount !== null) {
    return booking.pricing.advanceAmount;
  }
  return booking.advancePayment || booking.advanceAmount || Math.floor(getBookingTotalAmount(booking) * 0.5);
};


// Check for time slot conflicts
const checkTimeSlotConflict = async (vendorId, date, timeSlot, branchId) => {
  // Check for blocked availability or existing bookings
  const query = {
    vendor: vendorId,
    date,
    $or: [
      { 'timeSlot.from': { $lt: timeSlot.to }, 'timeSlot.to': { $gt: timeSlot.from } },
    ],
  };
  
  if (branchId) {
    query.branchId = branchId;
  } else {
    query.$or.push({ branchId: null }, { branchId: { $exists: false } }, { branchId: '' });
  }

  const conflict = await VendorAvailability.findOne(query);

  if (conflict) {
    const error = new Error(
      `Time slot conflict on ${date} from ${timeSlot.from} to ${timeSlot.to}`
    );
    error.statusCode = 409;
    throw error;
  }

  // Also check for existing confirmed bookings
  const bookingQuery = {
    vendor: vendorId,
    date,
    status: { $in: ['CONFIRMED', 'APPROVED'] },
    $or: [
      { 'timeSlot.from': { $lt: timeSlot.to }, 'timeSlot.to': { $gt: timeSlot.from } },
    ],
  };

  if (branchId) {
    bookingQuery.branchId = branchId;
  } else {
    bookingQuery.$or.push({ branchId: null }, { branchId: { $exists: false } }, { branchId: '' });
  }

  const bookingConflict = await Booking.findOne(bookingQuery);

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
    branchId,
    branchName,
  } = payload;

  const service = await VendorService.findById(serviceId).populate('user', 'name email role isActive');
  if (!service || !service.user || !service.user.isActive) {
    const error = new Error('Service not found');
    error.statusCode = 404;
    throw error;
  }

  if (service.category !== category) {
    const error = new Error('Category mismatch for this service');
    error.statusCode = 400;
    throw error;
  }

  const requiresGuestCount = category === 'BANQUET_HALL' || category === 'CATERING';
  const normalizedGuestCount = guestCount !== undefined && guestCount !== null && guestCount !== ''
    ? Number(guestCount)
    : undefined;

  if (requiresGuestCount && (!Number.isFinite(normalizedGuestCount) || normalizedGuestCount < 1)) {
    const error = new Error('guestCount is required for this category');
    error.statusCode = 422;
    throw error;
  }

  if (category === 'BANQUET_HALL' && service.capacity && service.capacity.maxGuests && normalizedGuestCount) {
    if (normalizedGuestCount > service.capacity.maxGuests || normalizedGuestCount < service.capacity.minGuests) {
      const error = new Error(
        `Guest count must be between ${service.capacity.minGuests} and ${service.capacity.maxGuests}`
      );
      error.statusCode = 400;
      throw error;
    }
  }

  let pkg = service.packages.find((p) => p.name === packageName);
  if (!pkg) {
    if (totalAmount !== undefined && totalAmount !== null) {
      pkg = {
        name: packageName || 'Custom Package',
        price: totalAmount,
        guestCount: normalizedGuestCount,
        pricePerHead: (category === 'CATERING' || category === 'BANQUET_HALL') && normalizedGuestCount ? Math.round(totalAmount / normalizedGuestCount) : undefined,
        details: 'Custom Package',
        items: [],
      };
    } else {
      const error = new Error('Selected package not found for this service');
      error.statusCode = 400;
      throw error;
    }
  }

  // Check for time slot conflicts BEFORE creating booking
  await checkTimeSlotConflict(service.user._id, date, timeSlot, branchId);

  const addons = selectedAddons
    .map((name) => service.optionalServices.find((a) => a.name === name))
    .filter(Boolean)
    .map((a) => ({ name: a.name, price: a.price }));

  const pricing = calculatePricing(category, pkg, normalizedGuestCount, totalAmount, advancePayment);

  const booking = await Booking.create({
    client: clientId,
    vendor: service.user._id,
    service: service._id,
    category,
    selectedPackage: {
      name: pkg.name,
      price: pkg.price,
      guestCount: requiresGuestCount ? (normalizedGuestCount || pkg.guestCount) : undefined,
      pricePerHead: pkg.pricePerHead,
      details: pkg.details,
      items: pkg.items,
    },
    guestCount: requiresGuestCount ? normalizedGuestCount : normalizedGuestCount,
    date,
    timeSlot,
    location,
    specialRequests,
    optionalAddons: addons,
    pricing,
    status: 'PENDING',
    branchId: branchId || undefined,
    branchName: branchName || undefined,
  });

  // Block the time slot immediately when booking is created (PENDING status)
  // This prevents double-booking while vendor is reviewing the request
  await VendorAvailability.create({
    vendor: service.user._id,
    date,
    timeSlot,
    reason: 'Booking Pending',
    type: 'PENDING_BOOKING',
    branchId: branchId || undefined,
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

const updateBookingStatus = async (bookingId, vendorId, status, rejectionReason = null, paidAmount = null) => {
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

  if (status === 'APPROVED') {
    const finalPaidAmount = paidAmount !== null && paidAmount !== undefined ? Number(paidAmount) : getBookingAdvanceAmount(booking);
    if (isNaN(finalPaidAmount) || finalPaidAmount <= 0) {
      const error = new Error('Token/Advance payment amount must be greater than 0 to approve booking.');
      error.statusCode = 400;
      throw error;
    }
    booking.paidAmount = finalPaidAmount;
  } else if (status === 'CONFIRMED') {
    booking.paidAmount = getBookingTotalAmount(booking);
  }

  // If approved/confirmed, convert PENDING_BOOKING to BOOKED
  if (status === 'APPROVED' || status === 'CONFIRMED') {
    // Update the pending booking entry to BOOKED
    const query = {
      vendor: booking.vendor,
      date: booking.date,
      timeSlot: booking.timeSlot,
      type: 'PENDING_BOOKING',
    };
    if (booking.branchId) {
      query.branchId = booking.branchId;
    }
    await VendorAvailability.updateOne(
      query,
      {
        type: 'BOOKED',
        reason: 'Booking Confirmed',
      }
    );
  }

  // If rejected or cancelled, remove the availability block entirely
  if (status === 'REJECTED' || status === 'CANCELLED') {
    const query = {
      vendor: booking.vendor,
      date: booking.date,
      timeSlot: booking.timeSlot,
      $or: [
        { type: 'PENDING_BOOKING' },
        { type: 'BOOKED' }
      ],
    };
    if (booking.branchId) {
      query.branchId = booking.branchId;
    }
    await VendorAvailability.deleteOne(query);

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

const cancelBooking = async (bookingId, clientId) => {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  if (booking.client.toString() !== clientId.toString()) {
    const error = new Error('Not authorized to cancel this booking');
    error.statusCode = 403;
    throw error;
  }

  if (booking.status !== 'PENDING') {
    const error = new Error('Cannot cancel a booking that is already processed by the vendor');
    error.statusCode = 400;
    throw error;
  }

  booking.status = 'CANCELLED';

  // Remove the availability block
  const query = {
    vendor: booking.vendor,
    date: booking.date,
    timeSlot: booking.timeSlot,
    $or: [
      { type: 'PENDING_BOOKING' },
      { type: 'BOOKED' }
    ],
  };
  if (booking.branchId) {
    query.branchId = booking.branchId;
  }
  await VendorAvailability.deleteOne(query);

  await booking.save();
  await booking.populate('vendor', 'name email');
  await booking.populate('service', 'category basicInfo');
  await booking.populate('client', 'name email');

  // Notify vendor
  await createNotification(
    booking.vendor._id,
    'Booking Cancelled by Client',
    `The booking request for ${booking.service.basicInfo.name} was cancelled by the client.`,
    'BOOKING_UPDATE',
    { bookingId: booking._id, status: 'CANCELLED' }
  );

  return booking;
};

const recordRemainingPayment = async (bookingId, vendorId) => {
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

  booking.paidAmount = getBookingTotalAmount(booking);
  booking.status = 'CONFIRMED';

  // Update availability blocks to BOOKED
  const query = {
    vendor: booking.vendor,
    date: booking.date,
    timeSlot: booking.timeSlot,
    type: 'PENDING_BOOKING',
  };
  if (booking.branchId) {
    query.branchId = booking.branchId;
  }
  await VendorAvailability.updateOne(
    query,
    {
      type: 'BOOKED',
      reason: 'Booking Confirmed',
    }
  );

  await booking.save();
  await booking.populate('vendor', 'name email');
  await booking.populate('service', 'category basicInfo');
  await booking.populate('client', 'name email');

  // Notify client of full payment received
  await createNotification(
    booking.client._id,
    'Payment Received',
    `Full payment of PKR ${getBookingTotalAmount(booking).toLocaleString()} has been received for ${booking.service.basicInfo.name}.`,
    'BOOKING_UPDATE',
    { bookingId: booking._id, status: 'CONFIRMED' }
  );

  return booking;
};

const sendPaymentReminders = async () => {
  try {
    const todayStr = new Date().toISOString().slice(0, 10);
    
    // Find APPROVED bookings where date is in the past and reminder not sent yet
    const bookings = await Booking.find({
      status: 'APPROVED',
      date: { $lt: todayStr },
      paymentReminderSent: { $ne: true }
    })
    .populate('client', 'name email')
    .populate('vendor', 'name email')
    .populate('service', 'basicInfo');

    console.log(`[Reminders] Found ${bookings.length} past-due bookings requiring payment reminders.`);

    for (const booking of bookings) {
      const remainingAmount = getBookingTotalAmount(booking) - booking.paidAmount;
      if (remainingAmount <= 0) continue;

      const packageName = booking.selectedPackage?.name || 'Package';
      const serviceName = booking.service?.basicInfo?.name || 'Service';
      const clientName = booking.client?.name || 'Client';

      // Send to Client
      if (booking.client && booking.client._id) {
        await createNotification(
          booking.client._id,
          'Payment Due Reminder',
          `Reminder: Please clear the remaining balance of PKR ${remainingAmount.toLocaleString()} for your booking of ${packageName} on ${booking.date}.`,
          'BOOKING_UPDATE',
          { bookingId: booking._id }
        );
      }

      // Send to Vendor
      if (booking.vendor && booking.vendor._id) {
        await createNotification(
          booking.vendor._id,
          'Collect Remaining Payment',
          `Reminder: Please collect the remaining balance of PKR ${remainingAmount.toLocaleString()} from ${clientName} for their booking of ${packageName} on ${booking.date}.`,
          'BOOKING_UPDATE',
          { bookingId: booking._id }
        );
      }

      booking.paymentReminderSent = true;
      await booking.save();
      console.log(`[Reminders] Payment reminder sent for booking ID: ${booking._id}`);
    }
  } catch (error) {
    console.error('[Reminders] Error running payment reminders:', error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getVendorBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  recordRemainingPayment,
  sendPaymentReminders,
};

