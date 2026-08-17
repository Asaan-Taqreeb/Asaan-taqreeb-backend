/**
 * Asaan Taqreeb - Rollback / Cleanup Script for Seeded Vendors
 * 
 * Safely removes only the demo vendors and demo client created by seed_realistic_vendors.js
 * (emails ending with @demo.com) without touching your personal accounts or existing real data.
 * 
 * Usage:
 *   cd Asaan-taqreeb-backend
 *   node rollback_seeded_vendors.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/modules/auth/model/user.model');
const VendorService = require('./src/modules/vendor/model/vendorService.model');
const Booking = require('./src/modules/booking/model/booking.model');
const VendorAvailability = require('./src/modules/vendor/model/vendorAvailability.model');

async function rollback() {
  const mongoUri = process.argv[2] || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/asaan-taqreeb';

  console.log('====================================================');
  console.log('🧹 Asaan Taqreeb - Safe Rollback for Demo Data');
  console.log('====================================================');
  console.log(`Connecting to MongoDB...`);

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });
    console.log(' Connected successfully!\n');

    // Find all demo accounts ending with @demo.com
    const demoUsers = await User.find({ email: /@demo\.com$/i });
    const demoUserIds = demoUsers.map((u) => u._id);

    console.log(`Found ${demoUsers.length} demo accounts to remove.`);

    if (demoUserIds.length > 0) {
      // 1. Delete associated Bookings
      const deletedBookings = await Booking.deleteMany({
        $or: [{ client: { $in: demoUserIds } }, { vendor: { $in: demoUserIds } }]
      });
      console.log(` Removed ${deletedBookings.deletedCount} demo bookings.`);

      // 2. Delete associated VendorAvailability
      const deletedAvailabilities = await VendorAvailability.deleteMany({
        vendor: { $in: demoUserIds }
      });
      console.log(` Removed ${deletedAvailabilities.deletedCount} demo availability records.`);

      // 3. Delete associated VendorServices
      const deletedServices = await VendorService.deleteMany({ user: { $in: demoUserIds } });
      console.log(` Removed ${deletedServices.deletedCount} vendor services.`);

      // 4. Delete demo users
      const deletedUsers = await User.deleteMany({ _id: { $in: demoUserIds } });
      console.log(` Removed ${deletedUsers.deletedCount} demo user accounts.`);
    }

    console.log('\n====================================================');
    console.log('✅ Rollback complete! Your database is restored.');
    console.log('All your personal accounts and real data are untouched.');
    console.log('====================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Rollback failed:', error);
    process.exit(1);
  }
}

rollback();
