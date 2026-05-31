const mongoose = require('mongoose');

const SavingsGoalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    goalName: {
      type: String,
      required: [true, 'Please add a goal name'],
      trim: true,
    },
    targetAmount: {
      type: Number,
      required: [true, 'Please set a target saving amount'],
      min: [1, 'Target must be greater than 0'],
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: [0, 'Saved amount cannot be negative'],
    },
    targetDate: {
      type: Date,
      required: [true, 'Please set a target completion date'],
    },
    imageUrl: {
      type: String, // Custom image URL or default asset
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Auto mark as completed if current amount is >= target amount
SavingsGoalSchema.pre('save', function (next) {
  if (this.currentAmount >= this.targetAmount) {
    this.isCompleted = true;
  } else {
    this.isCompleted = false;
  }
  next();
});

module.exports = mongoose.model('SavingsGoal', SavingsGoalSchema);
