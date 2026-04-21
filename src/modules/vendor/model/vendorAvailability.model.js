const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema(
  {
    from: { type: String, required: true }, // "09:00"
    to: { type: String, required: true }, // "17:00"
  },
  { _id: false }
);

const vendorAvailabilitySchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
    reason: {
      type: String,
      trim: true,
      default: 'Booked',
    },
    type: {
      type: String,
      enum: ['BLOCKED', 'BOOKED'],
      default: 'BLOCKED',
    },
  },
  { timestamps: true }
);

// Compound index for fast availability lookup
vendorAvailabilitySchema.index({ vendor: 1, date: 1 });

const VendorAvailability = mongoose.model('VendorAvailability', vendorAvailabilitySchema);

module.exports = VendorAvailability;
