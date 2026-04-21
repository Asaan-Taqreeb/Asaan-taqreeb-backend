const mongoose = require('mongoose');

const selectedPackageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    guestCount: { type: Number, min: 1 },
    pricePerHead: { type: Number, min: 0 },
    details: { type: String, trim: true },
    items: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { _id: false }
);

const addonSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const timeSlotSchema = new mongoose.Schema(
  {
    from: { type: String, required: true }, // "09:00"
    to: { type: String, required: true }, // "17:00"
  },
  { _id: false }
);

const pricingSchema = new mongoose.Schema(
  {
    totalAmount: { type: Number, required: true, min: 0 },
    advanceAmount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VendorService',
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['BANQUET_HALL', 'CATERING', 'PHOTOGRAPHY', 'PARLOR_SALON'],
    },
    selectedPackage: {
      type: selectedPackageSchema,
      required: true,
    },
    guestCount: {
      type: Number,
      min: 1,
      required: true,
    },
    date: {
      type: String, // ISO date string, e.g. '2026-03-05'
      required: true,
    },
    timeSlot: {
      type: timeSlotSchema,
      required: true,
    },
    location: {
      type: String,
      trim: true,
    },
    specialRequests: {
      type: String,
      trim: true,
    },
    optionalAddons: {
      type: [addonSchema],
      default: [],
    },
    pricing: {
      type: pricingSchema,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'APPROVED'],
      default: 'PENDING',
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;

