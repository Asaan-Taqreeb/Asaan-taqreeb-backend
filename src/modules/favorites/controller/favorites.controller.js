const Favorite = require('../model/favorite.model');
const VendorService = require('../../vendor/model/vendorService.model');

const toggleFavorite = async (req, res, next) => {
  try {
    const { serviceId } = req.body;
    const userId = req.user.id;

    if (!serviceId) {
      const error = new Error('serviceId is required');
      error.statusCode = 422;
      throw error;
    }

    // Verify service exists
    const service = await VendorService.findById(serviceId);
    if (!service) {
      const error = new Error('Service not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if already favorited
    const existing = await Favorite.findOne({ user: userId, service: serviceId });

    if (existing) {
      await Favorite.deleteOne({ _id: existing._id });
      return res.status(200).json({
        success: true,
        message: 'Removed from favorites',
        isFavorite: false,
      });
    }

    await Favorite.create({ user: userId, service: serviceId });
    res.status(200).json({
      success: true,
      message: 'Added to favorites',
      isFavorite: true,
    });
  } catch (error) {
    next(error);
  }
};

const getMyFavorites = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const favorites = await Favorite.find({ user: userId })
      .populate({
        path: 'service',
        populate: { path: 'user', select: 'name email role' }
      });

    // Filter out null services (e.g. if a service was deleted but favorite wasn't purged)
    const validServices = favorites
      .filter((f) => f.service != null)
      .map((f) => f.service);

    res.status(200).json({
      success: true,
      services: validServices,
    });
  } catch (error) {
    next(error);
  }
};

const getMyFavoriteIds = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const favorites = await Favorite.find({ user: userId }).select('service');
    const serviceIds = favorites.map((f) => f.service.toString());

    res.status(200).json({
      success: true,
      serviceIds,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  toggleFavorite,
  getMyFavorites,
  getMyFavoriteIds,
};
