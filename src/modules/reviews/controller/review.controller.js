const reviewService = require('../service/review.service');

const createReview = async (req, res, next) => {
  try {
    const review = await reviewService.createReview(req.user.id, req.body);
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

const getVendorReviews = async (req, res, next) => {
  try {
    const reviews = await reviewService.getVendorReviews(req.params.vendorId);
    res.status(200).json({ success: true, reviews });
  } catch (error) {
    next(error);
  }
};

const getServiceReviews = async (req, res, next) => {
  try {
    const reviews = await reviewService.getServiceReviews(req.params.serviceId);
    res.status(200).json({ success: true, reviews });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getVendorReviews,
  getServiceReviews,
};
