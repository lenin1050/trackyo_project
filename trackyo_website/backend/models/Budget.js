const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    month: {
      type: String, // Format: YYYY-MM
      required: [true, 'Please specify the budget month in YYYY-MM format'],
      match: [/^\d{4}-\d{2}$/, 'Please use YYYY-MM format'],
    },
    monthlyLimit: {
      type: Number,
      required: [true, 'Please set a total monthly budget limit'],
      min: [0, 'Limit cannot be negative'],
    },
    categoryLimits: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Unique index to prevent duplicate month budgets per user
BudgetSchema.index({ user: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Budget', BudgetSchema);
