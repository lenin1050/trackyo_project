const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please add an expense title'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Please add an amount'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: [
        'Food',
        'Travel',
        'Shopping',
        'Bills',
        'Health',
        'Entertainment',
        'Education',
        'Recharge',
        'Groceries',
        'Other',
      ],
      default: 'Other',
    },
    paymentMethod: {
      type: String,
      required: [true, 'Please select a payment method'],
      enum: ['UPI', 'Card', 'Cash', 'NetBanking'],
      default: 'UPI',
    },
    merchantName: {
      type: String,
      trim: true,
      default: 'Self',
    },
    dateTime: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
    },
    receiptImage: {
      type: String, // Base64 or local server path or external URL
    },
    isAutomated: {
      type: Boolean,
      default: false, // true if parsed from SMS or OCR Scanner
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Expense', ExpenseSchema);
