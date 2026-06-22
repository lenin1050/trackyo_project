const User = require('../models/User');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');

// @desc    Get system global statistics (Admin only)
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getAdminStats = async (req, res) => {
  try {
    // 1. Total User Count
    const totalUsers = await User.countDocuments();
    
    // 2. Total Transactions Count
    const totalExpenses = await Expense.countDocuments();
    
    // 3. System aggregate expense amount
    const expenseAgg = await Expense.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' },
        },
      },
    ]);

    const globalVolume = expenseAgg[0] ? expenseAgg[0].totalAmount : 0;
    const averageTransaction = expenseAgg[0] ? expenseAgg[0].avgAmount : 0;

    // 4. Global spending by category
    const categoryAgg = await Expense.aggregate([
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const globalCategories = categoryAgg.map((cat) => ({
      category: cat._id,
      total: cat.total,
      count: cat.count,
    }));

    // 5. Recent registered users (limit 8)
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .select('-password')
      .limit(8);

    // 6. Recent expenses recorded across users (limit 8)
    const recentGlobalExpenses = await Expense.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(8);

    res.json({
      success: true,
      metrics: {
        totalUsers,
        totalExpenses,
        globalVolume,
        averageTransaction: parseFloat(averageTransaction.toFixed(2)),
      },
      globalCategories,
      recentUsers,
      recentGlobalExpenses,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users list (Admin only)
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).select('-password');
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
