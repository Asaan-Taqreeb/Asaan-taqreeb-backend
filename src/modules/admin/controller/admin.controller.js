const User = require('../../auth/model/user.model');
const identityService = require('../../auth/service/identity.service');
const authService = require('../../auth/service/auth.service');
const VendorService = require('../../vendor/model/vendorService.model');
const CategoryRequest = require('../../app/model/categoryRequest.model');

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

    if (req.query.vendorId || req.query.user) {
      query.user = req.query.vendorId || req.query.user;
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

const reviewService = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'status must be approved or rejected' });
    }

    const service = await VendorService.findByIdAndUpdate(
      req.params.id,
      {
        approvalStatus: status,
        approvalNote: note?.trim() || null,
        approvedAt: status === 'approved' ? new Date() : null,
        approvedBy: req.user.id,
      },
      { new: true }
    );
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.status(200).json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

const getCategoryRequests = async (req, res, next) => {
  try {
    const query = req.query.status ? { status: req.query.status } : {};
    const requests = await CategoryRequest.find(query).populate('vendor', 'name email').sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: requests });
  } catch (error) { next(error); }
};

const reviewCategoryRequest = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ success: false, message: 'status must be approved or rejected' });
    const request = await CategoryRequest.findByIdAndUpdate(req.params.id, { status, adminNote: note?.trim() || null, reviewedBy: req.user.id, reviewedAt: new Date() }, { new: true });
    
    const request = await CategoryRequest.findByIdAndUpdate(
      req.params.id, 
      { 
        status, 
        adminNote: note?.trim() || null, 
        reviewedBy: req.user.id, 
        reviewedAt: new Date() 
      }, 
      { new: true }
    );
    if (!request) return res.status(404).json({ success: false, message: 'Category request not found' });

    // When approved, automatically create and activate the category in MongoDB
    if (status === 'approved' && request.categoryName) {
      const Category = require('../../app/model/category.model');
      const slug = request.categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
      await Category.findOneAndUpdate(
        { key: slug },
        {
          key: slug,
          name: request.categoryName,
          description: request.description || `Services for ${request.categoryName}`,
          icon: 'Sparkles',
          color: '#6366F1',
          backgroundColor: '#EEF2FF',
          active: true,
        },
        { upsert: true, new: true }
      );
    }

    res.status(200).json({ success: true, data: request });
  } catch (error) { next(error); }
};

const getRevenueAnalytics = async (req, res, next) => {
  try {
    const Booking = require('../../booking/model/booking.model');
    const bookings = await Booking.find({})
      .populate('vendor', 'name email phone')
      .populate('client', 'name email')
      .populate('service', 'basicInfo.name category')
      .sort({ createdAt: -1 })
      .lean();

    const confirmedOrPaidBookings = bookings.filter(b => 
      b.status === 'CONFIRMED' || b.status === 'APPROVED' || (b.paidAmount && b.paidAmount > 0)
    );

    const totalVolume = confirmedOrPaidBookings.reduce((sum, b) => sum + (b.pricing?.totalAmount || b.paidAmount || 0), 0);
    const totalCollected = confirmedOrPaidBookings.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
    const platformCommissionRate = 0.05; // 5% flat fee
    const platformCommissionEarnings = Math.round(totalVolume * platformCommissionRate);

    // Group revenue per vendor
    const vendorMap = {};
    confirmedOrPaidBookings.forEach(b => {
      const vId = b.vendor?._id?.toString() || 'unknown';
      if (!vendorMap[vId]) {
        vendorMap[vId] = {
          vendorId: vId,
          vendorName: b.vendor?.name || 'Unknown Vendor',
          vendorEmail: b.vendor?.email || '',
          bookingsCount: 0,
          totalRevenue: 0,
          platformCommission: 0,
          vendorNetPayout: 0,
        };
      }
      const amount = b.pricing?.totalAmount || b.paidAmount || 0;
      vendorMap[vId].bookingsCount += 1;
      vendorMap[vId].totalRevenue += amount;
      vendorMap[vId].platformCommission += Math.round(amount * platformCommissionRate);
      vendorMap[vId].vendorNetPayout += Math.round(amount * (1 - platformCommissionRate));
    });

    const vendorBreakdown = Object.values(vendorMap).sort((a, b) => b.totalRevenue - a.totalRevenue);

    res.status(200).json({
      success: true,
      data: {
        totalBookings: bookings.length,
        confirmedBookings: confirmedOrPaidBookings.length,
        totalBookingVolume: totalVolume,
        totalCollected,
        platformCommissionRate: 0.05,
        platformCommissionEarnings,
        vendorBreakdown,
        recentBookings: bookings.slice(0, 10),
      }
    });
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
  deleteService,
  reviewService
  ,getCategoryRequests
  ,reviewCategoryRequest
  reviewService,
  getCategoryRequests,
  reviewCategoryRequest,
  getRevenueAnalytics,
};
