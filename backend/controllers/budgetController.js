const Budget = require('../models/Budget');
const Expense = require('../models/Expense');

// @desc    Get user budgets
// @route   GET /api/budgets
// @access  Private
exports.getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user._id }).sort({ month: -1 });
    res.json({ success: true, count: budgets.length, data: budgets });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get budget and actual spending metrics for a specific month
// @route   GET /api/budgets/:month
// @access  Private
exports.getBudgetForMonth = async (req, res) => {
  try {
    const { month } = req.params; // Format: YYYY-MM
    let budget = await Budget.findOne({ user: req.user._id, month });

    // Fallback: If no budget exists, generate a dynamic mock placeholder
    if (!budget) {
      budget = new Budget({
        user: req.user._id,
        month,
        monthlyLimit: 15000,
        categoryLimits: {
          Food: 5000,
          Travel: 2000,
          Shopping: 3000,
          Bills: 3000,
          Entertainment: 2000,
        },
      });
    }

    // Fetch actual monthly expenses
    const year = parseInt(month.split('-')[0], 10);
    const monthIndex = parseInt(month.split('-')[1], 10) - 1;
    const startOfMonth = new Date(year, monthIndex, 1);
    const endOfMonth = new Date(year, monthIndex + 1, 0, 23, 59, 59);

    const expenses = await Expense.find({
      user: req.user._id,
      dateTime: { $gte: startOfMonth, $lte: endOfMonth },
    });

    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Sum by category
    const categorySpent = {};
    expenses.forEach((exp) => {
      categorySpent[exp.category] = (categorySpent[exp.category] || 0) + exp.amount;
    });

    // Structure metrics output
    const categoriesMetrics = [];
    const budgetCategories = budget.categoryLimits ? Object.fromEntries(budget.categoryLimits) : {};
    
    // Union of all default MERN categories
    const allCategories = [
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
    ];

    allCategories.forEach((cat) => {
      const limit = budgetCategories[cat] || 0;
      const spent = categorySpent[cat] || 0;
      categoriesMetrics.push({
        category: cat,
        limit,
        spent,
        percentage: limit > 0 ? parseFloat(((spent / limit) * 100).toFixed(1)) : 0,
      });
    });

    res.json({
      success: true,
      budget: {
        _id: budget._id,
        month: budget.month,
        monthlyLimit: budget.monthlyLimit,
        categoryLimits: budgetCategories,
      },
      summary: {
        monthlyLimit: budget.monthlyLimit,
        totalSpent,
        totalRemaining: Math.max(0, budget.monthlyLimit - totalSpent),
        utilizationPercentage: parseFloat(((totalSpent / budget.monthlyLimit) * 100).toFixed(1)),
      },
      categories: categoriesMetrics,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create or Update Budget
// @route   POST /api/budgets
// @access  Private
exports.createOrUpdateBudget = async (req, res) => {
  try {
    const { month, monthlyLimit, categoryLimits } = req.body;

    let budget = await Budget.findOne({ user: req.user._id, month });

    if (budget) {
      // Update
      budget.monthlyLimit = monthlyLimit !== undefined ? Number(monthlyLimit) : budget.monthlyLimit;
      if (categoryLimits) {
        budget.categoryLimits = categoryLimits;
      }
      const updatedBudget = await budget.save();
      return res.json({ success: true, message: 'Budget updated successfully', data: updatedBudget });
    }

    // Create
    const newBudget = await Budget.create({
      user: req.user._id,
      month,
      monthlyLimit: Number(monthlyLimit),
      categoryLimits: categoryLimits || {},
    });

    res.status(201).json({ success: true, message: 'Budget created successfully', data: newBudget });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, message: error.message });
  }
};
