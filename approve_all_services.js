const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://hiraishaqqqqq_db_user:zkrU1d6sXX7VpopK@asaantaqreeb.gpirgqi.mongodb.net/asaan-taqreeb';

async function approveAll() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const VendorService = mongoose.model(
      'VendorService',
      new mongoose.Schema({}, { strict: false }),
      'vendorservices'
    );

    const result = await VendorService.updateMany(
      { approvalStatus: { $ne: 'rejected' } },
      { $set: { approvalStatus: 'approved' } }
    );

    console.log(`Updated ${result.modifiedCount} services to approved.`);

    const count = await VendorService.countDocuments();
    console.log(`Total services in DB: ${count}`);

    const services = await VendorService.find({}, 'basicInfo.name category approvalStatus').lean();
    console.log('Current services:', JSON.stringify(services, null, 2));

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error approving services:', err);
    process.exit(1);
  }
}

approveAll();
