const mongoose = require('mongoose');
const User = require('./src/modules/auth/model/user.model');

const uri = process.argv[2];
const email = process.argv[3];
const password = process.argv[4] || 'admin123456';

if (!uri || !email) {
  console.log("\n❌ Missing arguments!");
  console.log("Usage: node seed_admin.js <MONGO_URI> <EMAIL> [PASSWORD]");
  console.log('Example: node seed_admin.js "mongodb+srv://..." "admin@asaantaqreeb.com" "mypass123"\n');
  process.exit(1);
}

async function run() {
  try {
    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(uri);
    console.log("Connected successfully!");

    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      console.log(`\nFound existing account: "${user.name}" (${user.email})`);
      console.log(`Current Role: "${user.role}"`);
      
      // Elevate roles
      user.role = 'admin';
      if (!user.roles) user.roles = [];
      if (!user.roles.includes('admin')) user.roles.push('admin');
      
      user.isActive = true;
      user.isEmailVerified = true;
      
      // If a password was specified, update it
      if (process.argv[4]) {
        user.password = password;
        console.log(`Updating password to: "${password}"`);
      }

      await user.save();
      console.log(`\n🎉 Success! Account elevated to ADMIN.`);
    } else {
      console.log(`\nNo account found for email: "${normalizedEmail}".`);
      console.log(`Creating a brand new ADMIN account...`);

      user = await User.create({
        name: "System Admin",
        email: normalizedEmail,
        password: password,
        role: "admin",
        roles: ["admin"],
        isActive: true,
        isEmailVerified: true
      });

      console.log(`\n🎉 Success! New admin created.`);
      console.log(`- Email: ${normalizedEmail}`);
      console.log(`- Password: ${password}`);
    }

  } catch (error) {
    console.error("\n❌ Error seeding admin:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.\n");
    process.exit(0);
  }
}

run();
