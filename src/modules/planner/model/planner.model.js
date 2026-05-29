const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['banquet', 'catering', 'photo', 'parlor', 'other'],
    default: 'other',
  },
  name: {
    type: String,
    required: [true, 'Task name is required'],
    trim: true,
  },
  estimatedCost: {
    type: Number,
    default: 0,
    min: 0,
  },
  actualCost: {
    type: Number,
    default: 0,
    min: 0,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
  },
});

const plannerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    totalBudget: {
      type: Number,
      default: 0,
      min: 0,
    },
    eventDate: {
      type: String,
    },
    eventType: {
      type: String,
      trim: true,
    },
    tasks: {
      type: [taskSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const Planner = mongoose.model('Planner', plannerSchema);

module.exports = Planner;
