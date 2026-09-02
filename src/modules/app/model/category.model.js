const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    icon: {
      type: String,
      required: true,
      enum: ['Sparkles', 'House', 'Utensils', 'Video', 'Scissors', 'Car', 'Palette', 'Users'],
      default: 'Sparkles',
    },
    color: {
      type: String,
      required: true,
      default: '#000000',
    },
    backgroundColor: {
      type: String,
      required: true,
      default: '#F5F5F5',
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
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

// Index for active categories sorted by order
categorySchema.index({ active: 1, sortOrder: 1 });

module.exports = mongoose.model('Category', categorySchema);
