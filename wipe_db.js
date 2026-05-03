const mongoose = require('mongoose');

const uri = process.argv[2];

if (!uri) {
  console.error("Please provide your MongoDB URI as an argument.");
  console.error("Example: node wipe_db.js \"mongodb+srv://user:pass@cluster.mongodb.net/asaan-taqreeb\"");
  process.exit(1);
}

async function wipeDatabase() {
  try {
    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(uri);
    console.log("Connected successfully!");

    const collections = await mongoose.connection.db.collections();
    
    if (collections.length === 0) {
      console.log("Database is already empty.");
    } else {
      console.log(`Found ${collections.length} collections. Dropping them all to start fresh...`);
      for (let collection of collections) {
        await collection.drop();
        console.log(`Dropped collection: ${collection.collectionName}`);
      }
      console.log("Database successfully wiped clean! You can now start completely fresh.");
    }

  } catch (error) {
    console.error("Error wiping database:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
    process.exit(0);
  }
}

wipeDatabase();
