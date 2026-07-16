const User = require('../../auth/model/user.model');
const identityService = require('../../auth/service/identity.service');
const authService = require('../../auth/service/auth.service');
const VendorService = require('../../vendor/model/vendorService.model');

const getUsers = async (req, res, next) => {
  try {
    const { role, verificationStatus, isActive, search, limit = 10, page = 1 } = req.query;

    const query = { deletedAt: { $exists: false } };
    const andConditions = [];

    if (role) {
      andConditions.push({
        $or: [
          { role: role },
          { roles: role }
        ]
      });
    }
    if (verificationStatus) {
      query.verificationStatus = verificationStatus;
    }
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    if (search) {
      andConditions.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      });
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    const parsedLimit = parseInt(limit, 10);
    const parsedPage = parseInt(page, 10);
    const skip = (parsedPage - 1) * parsedLimit;

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        totalUsers,
        page: parsedPage,
        limit: parsedLimit
      }
    });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    if (isActive === undefined) {
      return res.status(400).json({ success: false, message: 'isActive field is required' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, message: 'User status updated successfully', data: user });
  } catch (error) {
    next(error);
  }
};

const verifyUserKYC = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }
    const result = await identityService.updateKycStatus(req.params.id, status, rejectionReason);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const result = await authService.deleteAccount(req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// Admin Services Endpoints
const getServices = async (req, res, next) => {
  try {
    const { category, search, limit = 50, page = 1 } = req.query;

    const query = {};
    const andConditions = [];

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      andConditions.push({
        $or: [
          { 'basicInfo.name': { $regex: search, $options: 'i' } },
          { 'basicInfo.location': { $regex: search, $options: 'i' } }
        ]
      });
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    const parsedLimit = parseInt(limit, 10);
    const parsedPage = parseInt(page, 10);
    const skip = (parsedPage - 1) * parsedLimit;

    const totalServices = await VendorService.countDocuments(query);
    const services = await VendorService.find(query)
      .populate({ path: 'user', select: 'name email role isActive' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit);

    // Clean any services that might not have a valid associated user
    const filteredServices = services.filter(service => service.user);

    res.status(200).json({
      success: true,
      data: filteredServices,
      pagination: {
        totalServices,
        page: parsedPage,
        limit: parsedLimit
      }
    });
  } catch (error) {
    next(error);
  }
};

const deleteService = async (req, res, next) => {
  try {
    const service = await VendorService.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    await VendorService.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Service deleted successfully by admin' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUserStatus,
  verifyUserKYC,
  deleteUser,
  getServices,
  deleteService
};
