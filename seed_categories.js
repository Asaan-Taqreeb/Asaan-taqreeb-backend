const mongoose = require('mongoose');
const Category = require('./src/modules/app/model/category.model');
require('dotenv').config();

const seedCategories = async () => {
  try {
    const mongoUri = process.argv[2] || process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/asaan-taqreeb';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log('Connected to MongoDB');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');

    // Define new categories
    const categories = [
      {
        key: 'all',
        name: 'All',
        description: 'All services',
        icon: 'Sparkles',
        color: 'white',
        backgroundColor: 'black',
        sortOrder: 0,
        active: true,
      },
      {
        key: 'banquets',
        name: 'Banquets',
        description: 'Banquet halls and event spaces',
        icon: 'House',
        color: '#8A2BE2',
        backgroundColor: '#F3E5F5',
        sortOrder: 1,
        active: true,
      },
      {
        key: 'caterings',
        name: 'Caterings',
        description: 'Catering services',
        icon: 'Utensils',
        color: '#FF8C00',
        backgroundColor: '#FFF3E0',
        sortOrder: 2,
        active: true,
      },
      {
        key: 'photographers',
        name: 'Photographers',
        description: 'Photography services',
        icon: 'Video',
        color: '#008B8B',
        backgroundColor: '#E0F7FA',
        sortOrder: 3,
        active: true,
      },
      {
        key: 'parlor',
        name: 'Parlor',
        description: 'Hair and beauty parlor services',
        icon: 'Scissors',
        color: '#E91E63',
        backgroundColor: '#FCE4EC',
        sortOrder: 4,
        active: true,
      },
      {
        key: 'salon_men',
        name: 'Salon for Men',
        description: 'Men\'s grooming and styling services',
        icon: 'Scissors',
        color: '#1976D2',
        backgroundColor: '#E3F2FD',
        sortOrder: 5,
        active: true,
      },
      {
        key: 'rent_car',
        name: 'Rent a Car',
        description: 'Car rental services',
        icon: 'Car',
        color: '#F57C00',
        backgroundColor: '#FFE0B2',
        sortOrder: 6,
        active: true,
      },
      {
        key: 'decors',
        name: 'Decors',
        description: 'Event decoration services',
        icon: 'Palette',
        color: '#C2185B',
        backgroundColor: '#F8BBD0',
        sortOrder: 7,
        active: true,
      },
      {
        key: 'request_category',
        name: 'Request Category',
        description: 'Request a new category',
        icon: 'Sparkles',
        color: '#7B1FA2',
        backgroundColor: '#F3E5F5',
        sortOrder: 8,
        active: true,
      },
    ];

    // Insert categories
    const result = await Category.insertMany(categories);
    console.log(`✅ Seeded ${result.length} categories successfully`);

    // List all categories
    const allCategories = await Category.find().sort({ sortOrder: 1 });
    console.log('\nCategories:');
    allCategories.forEach((cat) => {
      console.log(`  - ${cat.name} (${cat.key})`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    process.exit(1);
  }
};

seedCategories();
