const mongoose = require('mongoose');

const commissionHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    rate: {
      type: Number,
      default: 5,
    },
    baseAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ['charged', 'paid'],
      default: 'charged',
      index: true,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    paidDate: {
      type: Date,
      default: null,
    },
    paymentProof: {
      screenshotUrl: {
        type: String,
        default: null,
      },
      transactionId: {
        type: String,
        default: null,
      },
      uploadedAt: {
        type: Date,
        default: null,
      },
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      verificationStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending',
      },
      verificationNotes: {
        type: String,
        default: null,
      },
    },
    status: {
      type: String,
      enum: ['pending', 'partially_paid', 'paid', 'overdue'],
      default: 'pending',
      index: true,
    },
    notes: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
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

// Indexes for efficient queries
commissionHistorySchema.index({ user: 1, createdAt: -1 });
commissionHistorySchema.index({ user: 1, status: 1 });
commissionHistorySchema.index({ user: 1, type: 1 });
commissionHistorySchema.index({ dueDate: 1, status: 1 });
commissionHistorySchema.index({ user: 1, paidDate: 1 });

module.exports = mongoose.model('CommissionHistory', commissionHistorySchema);
