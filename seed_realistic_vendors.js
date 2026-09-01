/**
 * Asaan Taqreeb - Realistic Database Seeder
 * 
 * Populates authentic Pakistani event vendors (Banquet Halls, Catering, Photography, Salons)
 * with realistic Karachi coordinates, HD images, packages, menus, and prices.
 * 
 * Usage:
 *   cd Asaan-taqreeb-backend
 *   node seed_realistic_vendors.js
 * 
 * Or with custom Mongo URI:
 *   node seed_realistic_vendors.js "mongodb+srv://..."
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/modules/auth/model/user.model');
const VendorService = require('./src/modules/vendor/model/vendorService.model');
const ROLES = require('./src/shared/enums/roles.enum');

const DEFAULT_PASSWORD = 'vendor123';
const CLIENT_PASSWORD = 'client123';

const VENDORS_DATA = [
  // ==========================================
  // 1. BANQUET HALLS & MARQUEES
  // ==========================================
  {
    user: {
      name: 'The Royal Palm Marquee',
      email: 'royalpalm@demo.com',
      phone: '+923001234561',
      profileImage: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=80',
    },
    service: {
      category: 'BANQUET_HALL',
      basicInfo: {
        name: 'The Royal Palm Marquee & Banquet',
        location: 'Shahrah-e-Faisal, Clifton, Karachi',
        landmark: 'Near Baloch Colony Flyover',
        about: 'Karachi’s premier luxury banquet venue featuring grand chandeliers, climate-controlled halls, dedicated bridal suites, and valet parking for up to 1,200 guests.',
        latitude: 24.8138,
        longitude: 67.0336,
        isOnSite: true,
        onSiteFee: 0,
        operatingHours: { from: '11:00 AM', to: '12:00 AM' },
      },
      capacity: { minGuests: 150, maxGuests: 1200 },
      images: [
        'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1545232979-fbf68fe9ec40?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80',
      ],
      packages: [
        {
          name: 'Silver Celebration Package',
          price: 450000,
          pricePerHead: 2250,
          guestCount: 200,
          details: 'Hall rental, ambient mood lighting, red carpet walkway, standard sound system, and valet parking.',
          items: ['Climate-controlled Hall', 'Stage Setup (Silver Theme)', 'Standard Sound & Lighting', 'Round Table Setup with Centerpieces', 'Valet Parking'],
        },
        {
          name: 'Gold Grand Wedding Package',
          price: 950000,
          pricePerHead: 2700,
          guestCount: 350,
          details: 'Premium thematic floral stage, crystal chandeliers, VIP sofa seating lounge, and generator backup.',
          items: ['Full Marquee Access', 'Fresh Floral Stage Decor', 'VIP Family Lounges', 'Heavy Bass Sound System', 'Bridal Suite with Private Washroom', 'Generator Backup'],
        },
        {
          name: 'Royal Diamond Extravaganza',
          price: 1800000,
          pricePerHead: 3600,
          guestCount: 500,
          details: 'All-inclusive ultimate luxury experience with imported floral decor, cold fire fireworks entry, and VIP concierge.',
          items: ['Entire Venue Exclusivity', 'Custom Stage & Tunnel Entry', 'Cold Fire & Fog Entry Effects', 'Dedicated Event Coordinator', 'Unlimited Valet Service'],
        },
      ],
      optionalServices: [
        { name: 'Cold Fireworks Entry (4 Shooters)', price: 25000, details: 'Pyrotechnic safe indoor fireworks for bride & groom entry.' },
        { name: 'Drone Aerial Coverage inside Hall', price: 18000, details: 'High-definition 4K aerial shots of entrance and stage.' },
        { name: 'Bridal Room VIP Refreshment Platter', price: 12000, details: 'Gourmet snacks, dry fruits, fresh juices, and tea service.' },
      ],
    },
  },
  {
    user: {
      name: 'Courtyard Venues DHA',
      email: 'courtyard@demo.com',
      phone: '+923001234562',
      profileImage: 'https://images.unsplash.com/photo-1545232979-fbf68fe9ec40?auto=format&fit=crop&w=600&q=80',
    },
    service: {
      category: 'BANQUET_HALL',
      basicInfo: {
        name: 'Courtyard Venues & Open Air Lawn',
        location: 'Phase 8, DHA, Karachi',
        landmark: 'Near Creek Club & Golf Course',
        about: 'An exquisite blend of lush open-air lawns and glasshouse marquees overlooking the sea breeze of DHA Phase 8. Ideal for modern Barat, Walima, and Qawwali nights.',
        latitude: 24.8238,
        longitude: 67.0681,
        isOnSite: true,
        onSiteFee: 0,
        operatingHours: { from: '10:00 AM', to: '01:00 AM' },
      },
      capacity: { minGuests: 200, maxGuests: 1500 },
      images: [
        'https://images.unsplash.com/photo-1545232979-fbf68fe9ec40?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80',
      ],
      packages: [
        {
          name: 'Starlight Lawn Evening',
          price: 600000,
          pricePerHead: 2400,
          guestCount: 250,
          details: 'Open-air fairy-light canopy setup, rustic wooden gazebos, and thematic photo-booth areas.',
          items: ['Fairy Lights Garden Canopy', 'Thematic Photo Booths', 'Lounge Seating', 'State-of-the-Art Sound'],
        },
        {
          name: 'Signature Glasshouse Royal',
          price: 1200000,
          pricePerHead: 3000,
          guestCount: 400,
          details: 'Air-conditioned glasshouse pavilion with imported drapery, floral arches, and ambient spotlights.',
          items: ['AC Glasshouse Pavilion', 'Exotic Floral Wall Decor', 'Carpeted Pathways', 'VIP Table Service'],
        },
      ],
      optionalServices: [
        { name: 'Live Qawwali / Ghazal Stage Setup', price: 40000, details: 'Traditional low-seating takht, bolster pillows, and specialized acoustic audio.' },
        { name: 'Fairy Light Tunnel Entrance (50 ft)', price: 30000, details: 'Breathtaking 50-foot illuminated walkway for guests.' },
      ],
    },
  },
  {
    user: {
      name: 'Grand Dynasty Banquet',
      email: 'dynasty@demo.com',
      phone: '+923001234563',
      profileImage: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=80',
    },
    service: {
      category: 'BANQUET_HALL',
      basicInfo: {
        name: 'Grand Dynasty Banquet Hall',
        location: 'Main Rashid Minhas Road, Gulshan-e-Iqbal, Karachi',
        landmark: 'Opposite Millennium Mall',
        about: 'Centrally located luxury banquet with gold-accented interior, high ceilings, separate partitions for segregated events, and capacity up to 800 guests.',
        latitude: 24.9180,
        longitude: 67.0971,
        isOnSite: true,
        onSiteFee: 0,
        operatingHours: { from: '09:00 AM', to: '11:30 PM' },
      },
      capacity: { minGuests: 100, maxGuests: 800 },
      images: [
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
      ],
      packages: [
        {
          name: 'Classic Banquet Package',
          price: 320000,
          pricePerHead: 1600,
          guestCount: 200,
          details: 'Complete hall decor with stage, chairs, sound, and lighting included.',
          items: ['Grand Hall Access', 'Stage & Backdrop', 'PA Audio System', 'Air Conditioning & Generator'],
        },
        {
          name: 'Premium Royale Package',
          price: 580000,
          pricePerHead: 1933,
          guestCount: 300,
          details: 'Includes luxury velvet sofa lounges, thematic flower arrangements, and red carpet entrance.',
          items: ['Velvet Family Lounges', 'Floral Centerpieces', 'Red Carpet Pathway', 'VIP Dining Area'],
        },
      ],
      optionalServices: [
        { name: 'Segregated Hall Partition Setup', price: 15000, details: 'Sound-dampening elegant curtain partition with separate entrances.' },
      ],
    },
  },
  {
    user: {
      name: 'Al-Noor Palace Banquet',
      email: 'alnoor.palace@demo.com',
      phone: '+923001234564',
      profileImage: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=600&q=80',
    },
    service: {
      category: 'BANQUET_HALL',
      basicInfo: {
        name: 'Al-Noor Palace Grand Marquee',
        location: 'Block L, North Nazimabad, Karachi',
        landmark: 'Near Five Star Chowrangi',
        about: 'Elegant, budget-friendly, and spacious venue in North Nazimabad. Fully air-conditioned with modern LED chandeliers and ample parking.',
        latitude: 24.9372,
        longitude: 67.0416,
        isOnSite: true,
        onSiteFee: 0,
        operatingHours: { from: '10:00 AM', to: '11:00 PM' },
      },
      capacity: { minGuests: 100, maxGuests: 600 },
      images: [
        'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
      ],
      packages: [
        {
          name: 'Standard Palace Plan',
          price: 250000,
          pricePerHead: 1660,
          guestCount: 150,
          details: 'Complete banquet hall with stage, lights, and generator backup.',
          items: ['Hall Lighting & Sound', 'Stage Backdrop', 'Table & Chair Covers', 'Air Conditioning'],
        },
      ],
      optionalServices: [
        { name: 'Smoke / Fog Machine Entry', price: 8000, details: 'Heavy low-lying fog machine for couple entrance.' },
      ],
    },
  },

  // ==========================================
  // 2. CATERING & ROYAL CUISINE
  // ==========================================
  {
    user: {
      name: 'Shahi Dawat Catering',
      email: 'shahi.dawat@demo.com',
      phone: '+923001234565',
      profileImage: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=600&q=80',
    },
    service: {
      category: 'CATERING',
      basicInfo: {
        name: 'Shahi Dawat Royal Catering & Degs',
        location: 'Shahrah-e-Quaideen, PECHS Block 2, Karachi',
        landmark: 'Near Tariq Road Crossing',
        about: 'Over 25 years of authentic Pakistani wedding feasts. Renowned for our special Dum Biryani, Mutton Kunna, Live BBQ counters, and warm traditional desserts.',
        latitude: 24.8615,
        longitude: 67.0423,
        isOnSite: true,
        onSiteFee: 5000,
        operatingHours: { from: '08:00 AM', to: '11:00 PM' },
      },
      capacity: { minGuests: 50, maxGuests: 2000 },
      images: [
        'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
      ],
      packages: [
        {
          name: 'Traditional Dawat Menu',
          price: 240000,
          pricePerHead: 1600,
          guestCount: 150,
          details: 'Special Chicken Dum Biryani, Chicken Qorma, Roghani Naan, Raita, Fresh Green Salad, and Hot Gulab Jamun.',
          items: ['Special Chicken Dum Biryani', 'Badami Chicken Qorma', 'Fresh Roghani Naan & Taftan', 'Zeera Raita & Kachumber Salad', 'Hot Gulab Jamun (2 pcs)', 'Mineral Water & Soft Drinks'],
        },
        {
          name: 'Royal Mutton & Live BBQ Feast',
          price: 625000,
          pricePerHead: 2500,
          guestCount: 250,
          details: 'Live BBQ Grill Station (Seekh Kabab & Malai Boti), Mutton Qorma, Special Beef Pulao, Live Puri Paratha, Gajar Ka Halwa, and Kashmiri Chai.',
          items: ['Live Chicken Malai Boti', 'Live Beef Seekh Kabab', 'Special Mutton Badami Qorma', 'Degi Beef Yakhni Pulao', 'Live Hot Puri Paratha', 'Special Gajar Ka Halwa', 'Pink Kashmiri Chai with Pistachio'],
        },
        {
          name: 'Shahi Sultanat Grand Buffet',
          price: 1300000,
          pricePerHead: 3250,
          guestCount: 400,
          details: 'Grand multi-course spread with Mutton Dum Biryani, White Karahi, Live Sajji counter, Continental Pasta, and 4 premium desserts.',
          items: ['Special Mutton Dum Biryani', 'Chicken White Karahi (Live Handi)', 'Live Balochi Sajji Counter', 'Fettuccine Alfredo Pasta', 'Fresh Taftan & Roghani Naan', 'Shahi Kheer in Earthen Bowls', 'Live Jalebi Counter', 'Assorted Soft Drinks & Fresh Juices'],
        },
      ],
      optionalServices: [
        { name: 'Live Hot Jalebi Counter', price: 18000, details: 'On-site live frying of crispy saffron jalebis with rabri.' },
        { name: 'Live BBQ Charcoal Counter', price: 25000, details: 'Dedicated chef team grilling piping hot Malai Boti and Kababs on spot.' },
        { name: 'Royal Copper Chafing Dishes & Cutlery', price: 15000, details: 'Traditional brass/copper food warmers and ceramic dinnerware.' },
      ],
    },
  },
  {
    user: {
      name: 'Spice & Savor Catering',
      email: 'spice.savor@demo.com',
      phone: '+923001234566',
      profileImage: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    },
    service: {
      category: 'CATERING',
      basicInfo: {
        name: 'Spice & Savor Gourmet Catering',
        location: 'Khayaban-e-Shahbaz, Phase 6, DHA, Karachi',
        landmark: 'Near Espresso DHA',
        about: 'Specialized in high-end fusion menus, live live cooking counters, seafood grills, and curated high-tea catering for elite gatherings and weddings.',
        latitude: 24.8238,
        longitude: 67.0681,
        isOnSite: true,
        onSiteFee: 10000,
        operatingHours: { from: '09:00 AM', to: '11:00 PM' },
      },
      capacity: { minGuests: 80, maxGuests: 1500 },
      images: [
        'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80',
      ],
      packages: [
        {
          name: 'Executive Fusion Wedding Menu',
          price: 560000,
          pricePerHead: 2800,
          guestCount: 200,
          details: 'Hyderabadi Dum Biryani, Mutton Handi, Dynamite Prawns starter, Tiramisu dessert, and gourmet mocktails.',
          items: ['Starter: Dynamite Prawns & Mini Tacos', 'Hyderabadi Dum Mutton Biryani', 'Creamy Chicken Peshawari Handi', 'Live Garlic Naan Basket', 'Italian Tiramisu & Kulfa Matka', 'Fresh Mint Lemonade & Colas'],
        },
      ],
      optionalServices: [
        { name: 'Mocktail & Fresh Juice Bar', price: 22000, details: 'Bartender serving Piña Colada, Mint Margaritas, and Mojitos.' },
      ],
    },
  },
  {
    user: {
      name: 'Al-Madina Royal Kitchen',
      email: 'almadina.kitchen@demo.com',
      phone: '+923001234567',
      profileImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
    },
    service: {
      category: 'CATERING',
      basicInfo: {
        name: 'Al-Madina Royal Degs & Catering',
        location: 'Block 13-C, Gulshan-e-Iqbal, Karachi',
        landmark: 'Near Hassan Square',
        about: 'Authentic Karachi Degi cuisine! Fresh ingredients, authentic dum cooking method, and punctual delivery anywhere in Karachi.',
        latitude: 24.9180,
        longitude: 67.0971,
        isOnSite: true,
        onSiteFee: 3000,
        operatingHours: { from: '07:00 AM', to: '11:00 PM' },
      },
      capacity: { minGuests: 50, maxGuests: 1000 },
      images: [
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80',
      ],
      packages: [
        {
          name: 'Classic Karachi Deg Package',
          price: 175000,
          pricePerHead: 1400,
          guestCount: 125,
          details: 'Authentic Chicken Biryani (Sella Rice), Chicken Qorma, Taftan, Salad, Raita, and Kheer.',
          items: ['Degi Chicken Biryani', 'Shahi Chicken Qorma', 'Fresh Taftan', 'Zeera Raita', 'Shahi Kheer'],
        },
      ],
      optionalServices: [
        { name: 'Waiter & Crockery Service Staff (10 Waiters)', price: 15000, details: 'Uniformed professional serving staff.' },
      ],
    },
  },

  // ==========================================
  // ==========================================
  // 3. PHOTOGRAPHY & CINEMATOGRAPHY
  // ==========================================
  {
    user: {
      name: 'Lumina Wedding Films',
      email: 'luminaphoto@demo.com',
      phone: '+923001234568',
      profileImage: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=600&q=80',
    },
    service: {
      category: 'PHOTOGRAPHY',
      basicInfo: {
        name: 'Lumina Wedding Films & Studio',
        location: 'Khayaban-e-Bukhari, Phase 6, DHA, Karachi',
        landmark: 'Next to Butlers Chocolate Cafe',
        about: 'Award-winning wedding cinematographers. We tell emotional stories through cinematic lighting, 4K Sony FX3 cameras, precision drone shots, and hand-crafted leather photo albums.',
        latitude: 24.8238,
        longitude: 67.0681,
        isOnSite: true,
        onSiteFee: 0,
        operatingHours: { from: '10:00 AM', to: '11:00 PM' },
      },
      capacity: { minGuests: 1, maxGuests: 3 },
      images: [
        'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1200&q=80',
      ],
      packages: [
        {
          name: '1-Day Signature Cinematic Story',
          price: 55000,
          details: 'Full coverage for 1 event (Barat or Walima). 1 Senior Photographer + 1 Cinematographer, 4K video teaser, and 300+ edited pictures.',
          items: ['1 Senior Candid Photographer', '1 Cinematic 4K Videographer', '3-5 Minute Cinematic Video Teaser', 'Full Event Video Edit (30-45 mins)', '300+ Master Colour-Graded Photos', 'Online Cloud Gallery Link'],
        },
        {
          name: '2-Day Complete Wedding Coverage',
          price: 110000,
          details: 'Complete coverage for 2 events (Barat + Walima). 2 Photographers + 2 Cinematographers + 4K Drone + Luxury Imported Photo Album.',
          items: ['2 Candid Photographers', '2 Cinematic Videographers', '4K Aerial Drone Coverage', '1 Large Premium Velvet Photo Album (40 Pages)', '2 Parents Mini Albums', 'Full Video Film + Teaser Reel for Instagram', 'USB Box with all RAW & Edited Files'],
        },
        {
          name: 'Royal 3-Day Grand Story (Mayun/Mehndi, Barat, Walima)',
          price: 175000,
          details: 'Ultimate VIP wedding coverage for 3 full days. Complete team of 6 creatives, dedicated lighting, instant same-day teaser edit, and drone footage.',
          items: ['3 Days Full Event Coverage', 'Director-level Cinematographers & Photographers', '4K Drone Aerial Pilot', 'Same-Day Edit Video Reel for Social Media', '2 Premium Crystal Glass Albums', 'Unlimited High-Resolution Edited Images', 'Free Pre-Wedding Couple Shoot Session'],
        },
      ],
      optionalServices: [
        { name: '4K Drone Aerial Shoot (Per Event)', price: 15000, details: 'Licensed drone operator for dramatic venue and arrival shots.' },
        { name: 'Same-Day Reel Edit (Within 12 Hours)', price: 12000, details: 'Speedy reel edit ready to post on Instagram/TikTok the next morning.' },
        { name: 'Additional Luxury Leather Album', price: 18000, details: 'Handcrafted Italian leather album with gold-foil embossing.' },
      ],
    },
  },
  {
    user: {
      name: 'Faizan Mughal Cinematic',
      email: 'faizan.photo@demo.com',
      phone: '+923001234569',
      profileImage: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=600&q=80',
    },
    service: {
      category: 'PHOTOGRAPHY',
      basicInfo: {
        name: 'Faizan Mughal Studio & Visuals',
        location: 'Block 2, Clifton, Karachi',
        landmark: 'Near Bilawal House',
        about: 'Capturing real, candid, timeless wedding moments for over 8 years in Karachi, Lahore, and Islamabad.',
        latitude: 24.8138,
        longitude: 67.0336,
        isOnSite: true,
        onSiteFee: 0,
        operatingHours: { from: '11:00 AM', to: '10:00 PM' },
      },
      capacity: { minGuests: 1, maxGuests: 2 },
      images: [
        'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1200&q=80',
      ],
      packages: [
        {
          name: 'Essential Wedding Coverage (1 Day)',
          price: 40000,
          details: '1 Photographer + 1 Videographer, 200 edited photos, highlight reel, and full event video.',
          items: ['1 Photographer', '1 Videographer', 'Highlight Video', '200 Edited Photos'],
        },
      ],
      optionalServices: [
        { name: 'Pre-Wedding Outdoor Portrait Session', price: 20000, details: '3-hour sunset portrait shoot at beach or heritage venue.' },
      ],
    },
  },

  // ==========================================
  // 4. BRIDAL PARLORS & SALONS
  // ==========================================
  {
    user: {
      name: 'Aura Luxury Bridal Lounge',
      email: 'aurasalon@demo.com',
      phone: '+923001234570',
      profileImage: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80',
    },
    service: {
      category: 'PARLOR_SALON',
      basicInfo: {
        name: 'Aura Luxury Bridal Lounge & Spa',
        location: 'Block 4, Clifton, Karachi',
        landmark: 'Near Dolmen Mall Clifton',
        about: 'Karachi’s leading high-end bridal destination. Certified international makeup artists using top-tier products (Charlotte Tilbury, NARS, Dior, Huda Beauty) for your once-in-a-lifetime glow.',
        latitude: 24.8138,
        longitude: 67.0336,
        isOnSite: true,
        onSiteFee: 15000,
        operatingHours: { from: '10:00 AM', to: '09:00 PM' },
      },
      capacity: { minGuests: 1, maxGuests: 4 },
      images: [
        'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
      ],
      packages: [
        {
          name: 'Signature Barat Bridal Makeover',
          price: 45000,
          details: 'HD Airbrush Bridal Makeup by Senior Artist, Custom Hair Styling, Dupatta & Jewelry Setting, Premium 3D Mink Lashes, and Pre-Bridal Glow Facial.',
          items: ['HD Waterproof Bridal Makeup', 'Dior & NARS Premium Cosmetics', 'Bridal Hairdo with Real Floral Styling', 'Dupatta Setting & Jewelry Pinning', 'Pre-Bridal HydraGlow Facial', 'Gel Nail Polish & Manicure'],
        },
        {
          name: 'Walima Royal Reception Glam',
          price: 40000,
          details: 'Soft Dewy Reception Makeup, Hollywood Waves or Modern Bun, Pearl Jewelry Setting, and Collagen Lip Treatment.',
          items: ['Dewy Glass-Skin Makeup', 'Hollywood Waves / Textured Hair Styling', 'Dupatta Setting', '3D Eyelash Application', 'Collagen Eye & Lip Mask'],
        },
        {
          name: 'Mehndi / Mayun Vibrant Glow',
          price: 25000,
          details: 'Fresh luminous makeup, braided floral hair styling, colorful lash accent, and bindi setting.',
          items: ['Luminous Fresh Makeup', 'Traditional Braid with Gota & Fresh Flowers', 'Jewelry Pinning', 'Organic Hand Polish'],
        },
      ],
      optionalServices: [
        { name: 'Bridal Party Party Makeup (Per Person)', price: 12000, details: 'Full party makeup and hairstyle for sisters/mother of the bride.' },
        { name: 'On-Location Venue Makeup Service', price: 20000, details: 'Senior makeup artist and hair stylist travel to your hotel or venue.' },
        { name: 'Luxury 24K Gold HydraFacial', price: 15000, details: 'Deep cleansing, gentle peel, and 24K gold serum infusion.' },
      ],
    },
  },
  {
    user: {
      name: 'Glamour by Nadia',
      email: 'glamour.nadia@demo.com',
      phone: '+923001234571',
      profileImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
    },
    service: {
      category: 'PARLOR_SALON',
      basicInfo: {
        name: 'Glamour by Nadia Makeup Studio',
        location: 'Khayaban-e-Seher, Phase 6, DHA, Karachi',
        landmark: 'Near Seher Commercial',
        about: 'Renowned for flawless bridal looks, modern bridal haircuts, and relaxing spa therapies in the heart of DHA.',
        latitude: 24.8238,
        longitude: 67.0681,
        isOnSite: true,
        onSiteFee: 10000,
        operatingHours: { from: '11:00 AM', to: '08:30 PM' },
      },
      capacity: { minGuests: 1, maxGuests: 3 },
      images: [
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
      ],
      packages: [
        {
          name: 'Complete Bridal Day Package',
          price: 35000,
          details: 'HD Barat Bridal Makeup, Hair Styling, Dupatta setting, Lashes, and Hand Polish.',
          items: ['HD Bridal Makeup', 'Intricate Hairdo', 'Dupatta & Jewelry Setting', 'Hand Polish & French Nails'],
        },
      ],
      optionalServices: [
        { name: 'Bridesmaid Soft Glam Makeup', price: 9000, details: 'Subtle party makeup with blow dry styling.' },
      ],
    },
  },
  {
    user: {
      name: 'Enchanted Beauty Studio',
      email: 'enchanted@demo.com',
      phone: '+923001234572',
      profileImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
    },
    service: {
      category: 'PARLOR_SALON',
      basicInfo: {
        name: 'Enchanted Beauty & Bridal Studio',
        location: 'Block 6, Gulshan-e-Iqbal, Karachi',
        landmark: 'Near Disco Bakery',
        about: 'Experienced stylists providing premium bridal packages at unbeatable value. Special packages for Barat, Walima, and Engagement.',
        latitude: 24.9180,
        longitude: 67.0971,
        isOnSite: false,
        onSiteFee: 0,
        operatingHours: { from: '11:00 AM', to: '08:00 PM' },
      },
      capacity: { minGuests: 1, maxGuests: 2 },
      images: [
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80',
      ],
      packages: [
        {
          name: 'Barat Gold Bridal Package',
          price: 28000,
          details: 'Barat Makeup by Master Artist, Hair Styling, Dupatta Setting, Lashes, and Free Facial.',
          items: ['Barat Makeup', 'Signature Hairdo', 'Dupatta & Jewelry Fixation', 'Hydrating Herbal Facial'],
        },
      ],
      optionalServices: [
        { name: 'Bridal Herbal Mani-Pedi Treatment', price: 6000, details: 'Relaxing rose water manicure and pedicure.' },
      ],
    },
  },
];

const Booking = require('./src/modules/booking/model/booking.model');
const VendorAvailability = require('./src/modules/vendor/model/vendorAvailability.model');

async function seed() {
  const mongoUri = process.argv[2] || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/asaan-taqreeb';

  console.log('====================================================');
  console.log('🌟 Asaan Taqreeb - Realistic Data Seeder');
  console.log('====================================================');
  console.log(`Connecting to MongoDB at: ${mongoUri.includes('@') ? mongoUri.split('@')[1] : mongoUri}`);

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });
    console.log(' Connected to MongoDB successfully!\n');

    // 1. Create a Standard Client Account for testing
    console.log('👤 Creating/Updating Demo Client account...');
    const clientEmail = 'client@demo.com';
    let clientUser = await User.findOne({ email: clientEmail });
    if (!clientUser) {
      clientUser = new User({
        name: 'Zain Client (Demo)',
        email: clientEmail,
        password: CLIENT_PASSWORD,
        role: ROLES.CLIENT,
        roles: [ROLES.CLIENT],
        phone: '+923000000001',
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        verificationStatus: 'verified',
      });
      await clientUser.save();
      console.log(` Created Demo Client: ${clientEmail} (password: ${CLIENT_PASSWORD})`);
    } else {
      clientUser.password = CLIENT_PASSWORD;
      clientUser.isActive = true;
      clientUser.isEmailVerified = true;
      await clientUser.save();
      console.log(` Demo Client already exists: ${clientEmail} (password updated to: ${CLIENT_PASSWORD})`);
    }

    console.log('\n🏪 Seeding Vendors & Services...');

    let createdVendorsCount = 0;
    let createdServicesCount = 0;
    const vendorMap = {};

    for (const item of VENDORS_DATA) {
      const email = item.user.email.toLowerCase().trim();

      // Upsert User
      let user = await User.findOne({ email });
      if (!user) {
        user = new User({
          name: item.user.name,
          email: email,
          password: DEFAULT_PASSWORD,
          role: ROLES.VENDOR,
          roles: [ROLES.VENDOR],
          phone: item.user.phone,
          profileImage: item.user.profileImage,
          isActive: true,
          isEmailVerified: true,
          isPhoneVerified: true,
          verificationStatus: 'verified',
        });
        await user.save();
        createdVendorsCount++;
      } else {
        user.name = item.user.name;
        user.role = ROLES.VENDOR;
        if (!user.roles || !user.roles.includes(ROLES.VENDOR)) {
          user.roles = [ROLES.VENDOR];
        }
        user.password = DEFAULT_PASSWORD;
        user.profileImage = item.user.profileImage;
        user.isActive = true;
        user.isEmailVerified = true;
        user.verificationStatus = 'verified';
        await user.save();
      }

      // Upsert VendorService
      const serviceData = {
        user: user._id,
        category: item.service.category,
        approvalStatus: 'approved',
        basicInfo: item.service.basicInfo,
        capacity: item.service.capacity || { minGuests: 1, maxGuests: 500 },
        packages: item.service.packages || [],
        optionalServices: item.service.optionalServices || [],
        images: item.service.images || [],
        branches: item.service.branches || [],
      };

      let vendorService = await VendorService.findOne({
        user: user._id,
        category: item.service.category,
      });

      if (!vendorService) {
        vendorService = await VendorService.create(serviceData);
        createdServicesCount++;
      } else {
        Object.assign(vendorService, serviceData);
        await vendorService.save();
        createdServicesCount++;
      }

      vendorMap[email] = { user, service: vendorService, raw: item };
      console.log(` [${item.service.category}] ${item.service.basicInfo.name} -> Login: ${email}`);
    }

    // 2. Clean previous demo bookings & availabilities
    console.log('\n📅 Seeding Realistic Demo Bookings & Live Slot Capacities...');
    const demoUserIds = Object.values(vendorMap).map(v => v.user._id).concat(clientUser._id);
    await Booking.deleteMany({ client: clientUser._id });
    await VendorAvailability.deleteMany({ vendor: { $in: demoUserIds } });

    // Dates for demo bookings (Tomorrow and 3 days later)
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const dayAfter = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3);
    const dateTomorrow = tomorrow.toISOString().split('T')[0];
    const dateDayAfter = dayAfter.toISOString().split('T')[0];

    // A. Seed Aura Salon booking (1 booking in morning slot 10:00-12:00 -> shows 3 spots remaining out of 4)
    const aura = vendorMap['aurasalon@demo.com'];
    if (aura) {
      const b1 = await Booking.create({
        client: clientUser._id,
        vendor: aura.user._id,
        service: aura.service._id,
        category: 'PARLOR_SALON',
        selectedPackage: aura.service.packages[0],
        date: dateTomorrow,
        timeSlot: { from: '10:00', to: '12:00' },
        location: aura.service.basicInfo.location,
        pricing: { totalAmount: 45000, advanceAmount: 22500 },
        status: 'CONFIRMED',
        specialRequests: 'Bridal makeover consultation and hair trial.'
      });

      await VendorAvailability.create({
        vendor: aura.user._id,
        date: dateTomorrow,
        timeSlot: { from: '10:00', to: '12:00' },
        reason: 'Booked by Zain Client',
        type: 'BOOKED',
      });

      // Also block 1 afternoon maintenance window
      await VendorAvailability.create({
        vendor: aura.user._id,
        date: dateDayAfter,
        timeSlot: { from: '14:00', to: '16:00' },
        reason: 'Salon Sanitization & Staff Training',
        type: 'BLOCKED',
      });
      console.log(` Created active Parlor bookings & blocks for ${aura.user.name}`);
    }

    // B. Seed Lumina Photo booking (1 booking on Evening Main Event 18:00-23:00 -> shows 2 spots left out of 3 teams)
    const lumina = vendorMap['luminaphoto@demo.com'];
    if (lumina) {
      await Booking.create({
        client: clientUser._id,
        vendor: lumina.user._id,
        service: lumina.service._id,
        category: 'PHOTOGRAPHY',
        selectedPackage: lumina.service.packages[0],
        date: dateTomorrow,
        timeSlot: { from: '18:00', to: '23:00' },
        location: 'DHA Golf Club, Karachi',
        pricing: { totalAmount: 55000, advanceAmount: 27500 },
        status: 'CONFIRMED',
        specialRequests: 'Drone coverage and sunset bridal portraits.'
      });

      await VendorAvailability.create({
        vendor: lumina.user._id,
        date: dateTomorrow,
        timeSlot: { from: '18:00', to: '23:00' },
        reason: 'Barat Coverage for Client',
        type: 'BOOKED',
      });
      console.log(` Created active Photography booking for ${lumina.user.name}`);
    }

    // C. Seed Royal Palm Banquet booking (Evening Session 21:00-00:00 booked -> Morning & Afternoon remain free)
    const royal = vendorMap['royalpalm@demo.com'];
    if (royal) {
      await Booking.create({
        client: clientUser._id,
        vendor: royal.user._id,
        service: royal.service._id,
        category: 'BANQUET_HALL',
        selectedPackage: royal.service.packages[0],
        guestCount: 200,
        date: dateTomorrow,
        timeSlot: { from: '21:00', to: '00:00' },
        location: royal.service.basicInfo.location,
        pricing: { totalAmount: 450000, advanceAmount: 225000 },
        status: 'APPROVED',
        specialRequests: 'Silver theme stage setup.'
      });

      await VendorAvailability.create({
        vendor: royal.user._id,
        date: dateTomorrow,
        timeSlot: { from: '21:00', to: '00:00' },
        reason: 'Evening Walima Reception',
        type: 'BOOKED',
      });
      console.log(` Created active Banquet booking for ${royal.user.name}`);
    }

    console.log('\n====================================================');
    console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
    console.log('====================================================');
    console.log(` Total Vendors Seeded : ${VENDORS_DATA.length}`);
    console.log(` Universal Vendor Password : "${DEFAULT_PASSWORD}"`);
    console.log(` Demo Client Email        : "${clientEmail}"`);
    console.log(` Demo Client Password     : "${CLIENT_PASSWORD}"`);
    console.log('====================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed with error:', error);
    process.exit(1);
  }
}

seed();
