const mongoose = require('mongoose');

const vendorAgreementSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    commissionRate: {
      type: Number,
      default: 5,
      required: true,
    },
    agreementText: {
      type: String,
      required: true,
    },
    accepted: {
      type: Boolean,
      default: false,
      index: true,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    acceptedVersion: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
      index: true,
    },
    outstandingCommission: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastPaymentDate: {
      type: Date,
      default: null,
    },
    paymentNotificationSent: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding pending agreements
vendorAgreementSchema.index({ status: 1, createdAt: -1 });
// Index for finding vendors with outstanding commission
vendorAgreementSchema.index({ accepted: 1, outstandingCommission: 1 });

module.exports = mongoose.model('VendorAgreement', vendorAgreementSchema);
