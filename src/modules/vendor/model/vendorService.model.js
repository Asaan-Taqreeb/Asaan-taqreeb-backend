const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    pricePerHead: {
      type: Number,
      min: 0,
    },
    guestCount: {
      type: Number,
      min: 1,
    },
    details: {
      type: String,
      trim: true,
    },
    items: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { _id: false }
);

const optionalServiceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    details: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const vendorServiceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['BANQUET_HALL', 'CATERING', 'PHOTOGRAPHY', 'PARLOR_SALON'],
    },
    basicInfo: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      location: {
        type: String,
        required: true,
        trim: true,
      },
      landmark: {
        type: String,
        trim: true,
      },
      about: {
        type: String,
        trim: true,
      },
    },
    capacity: {
      minGuests: {
        type: Number,
        min: 1,
      },
      maxGuests: {
        type: Number,
        min: 1,
      },
    },
    packages: {
      type: [packageSchema],
      default: [],
    },
    optionalServices: {
      type: [optionalServiceSchema],
      default: [],
    },
    images: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Unique compound index: one active service per vendor per category
vendorServiceSchema.index({ user: 1, category: 1 }, { unique: true });

const VendorService = mongoose.model('VendorService', vendorServiceSchema);

module.exports = VendorService;

