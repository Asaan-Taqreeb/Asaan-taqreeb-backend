const User = require('../../auth/model/user.model');
const ROLES = require('../../../shared/enums/roles.enum');

const getAllVendors = async (req, res, next) => {
  try {
    const vendors = await User.find({ role: ROLES.VENDOR }).select('name email role');
    res.status(200).json({ success: true, data: vendors });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllVendors,
};

