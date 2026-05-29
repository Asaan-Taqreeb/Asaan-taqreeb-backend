const Review = require('../model/review.model');
const Booking = require('../../booking/model/booking.model');

const createReview = async (clientId, payload) => {
  const { bookingId, rating, comment } = payload;

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  if (booking.client.toString() !== clientId.toString()) {
    const error = new Error('Not authorized to review this booking');
    error.statusCode = 403;
    throw error;
  }

  const allowedStatuses = ['CONFIRMED', 'APPROVED', 'COMPLETED'];
  if (!allowedStatuses.includes(booking.status)) {
    const error = new Error('Can only review confirmed or completed bookings');
    error.statusCode = 400;
    throw error;
  }

  // Check if review already exists
  const existingReview = await Review.findOne({ booking: bookingId });
  if (existingReview) {
    const error = new Error('You have already submitted a review for this booking');
    error.statusCode = 400;
    throw error;
  }

  const review = await Review.create({
    client: clientId,
    vendor: booking.vendor,
    service: booking.service,
    booking: bookingId,
    rating,
    comment,
  });

  return review;
};

const getVendorReviews = async (vendorId) => {
  return Review.find({ vendor: vendorId })
    .populate('client', 'name profileImage')
    .sort({ createdAt: -1 });
};

const getServiceReviews = async (serviceId) => {
  return Review.find({ service: serviceId })
    .populate('client', 'name profileImage')
    .sort({ createdAt: -1 });
};

module.exports = {
  createReview,
  getVendorReviews,
  getServiceReviews,
};
