const mongoose = require('mongoose');
const VendorService = require('./src/modules/vendor/model/vendorService.model');
require('dotenv').config();

const clearVendors = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/asaan-taqreeb');
    console.log('Connected to MongoDB');

    // Count existing vendors before deletion
    const countBefore = await VendorService.countDocuments({});
    console.log(`\nFound ${countBefore} existing vendor services`);

    if (countBefore === 0) {
      console.log('No vendors to delete');
      await mongoose.connection.close();
      return;
    }

    // Delete all vendors
    const result = await VendorService.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} vendor services`);

    // Verify deletion
    const countAfter = await VendorService.countDocuments({});
    console.log(`✅ Remaining vendor services: ${countAfter}`);

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error clearing vendors:', error);
    process.exit(1);
  }
};

clearVendors();
