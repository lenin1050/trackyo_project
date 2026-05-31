const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

// Helper to check budget threshold
const checkBudgetExceeded = async (userId, category, amount, dateTime) => {
  try {
    const expenseDate = new Date(dateTime || Date.now());
    const monthStr = expenseDate.toISOString().slice(0, 7); // YYYY-MM

    // 1. Fetch budget for the user and month
    const budget = await Budget.findOne({ user: userId, month: monthStr });
    if (!budget) return; // No budget set for this month

    // 2. Fetch all expenses for this month
    const startOfMonth = new Date(expenseDate.getFullYear(), expenseDate.getMonth(), 1);
    const endOfMonth = new Date(expenseDate.getFullYear(), expenseDate.getMonth() + 1, 0, 23, 59, 59);

    const monthlyExpenses = await Expense.find({
      user: userId,
      dateTime: { $gte: startOfMonth, $lte: endOfMonth },
    });

    const totalSpent = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Alert if overall budget exceeded
    if (totalSpent > budget.monthlyLimit) {
      // Check if alert already sent in the last 24 hours to prevent spamming
      const recentAlert = await Notification.findOne({
        user: userId,
        type: 'BudgetExceeded',
        message: new RegExp(`Overall monthly budget limit of Rs.${budget.monthlyLimit} exceeded`),
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      if (!recentAlert) {
        await Notification.create({
          user: userId,
          message: `⚠️ Alert! Your overall monthly budget limit of Rs.${budget.monthlyLimit} has been exceeded. Current spending: Rs.${totalSpent.toFixed(2)}.`,
          type: 'BudgetExceeded',
        });
      }
    } else if (totalSpent > budget.monthlyLimit * 0.85) {
      // Warn at 85% limit
      const recentWarn = await Notification.findOne({
        user: userId,
        type: 'BudgetExceeded',
        message: /85% of your overall monthly budget/,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      if (!recentWarn) {
        await Notification.create({
          user: userId,
          message: `⚠️ Warning! You have spent over 85% of your overall monthly budget (Rs.${budget.monthlyLimit}). Total spent: Rs.${totalSpent.toFixed(2)}.`,
          type: 'BudgetExceeded',
        });
      }
    }

    // 3. Category budget limits check
    const catLimit = budget.categoryLimits ? budget.categoryLimits.get(category) : null;
    if (catLimit) {
      const categorySpent = monthlyExpenses
        .filter((exp) => exp.category === category)
        .reduce((sum, exp) => sum + exp.amount, 0);

      if (categorySpent > catLimit) {
        const recentCatAlert = await Notification.findOne({
          user: userId,
          type: 'BudgetExceeded',
          message: new RegExp(`budget limit for ${category}`),
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        if (!recentCatAlert) {
          await Notification.create({
            user: userId,
            message: `⚠️ Alert! Your monthly category budget limit for ${category} (Rs.${catLimit}) has been exceeded. Current ${category} spending: Rs.${categorySpent.toFixed(2)}.`,
            type: 'BudgetExceeded',
          });
        }
      }
    }
  } catch (err) {
    console.error('Error checking budget: ', err);
  }
};

// @desc    Create a new expense
// @route   POST /api/expenses
// @access  Private
exports.createExpense = async (req, res) => {
  try {
    const { title, amount, category, paymentMethod, merchantName, dateTime, notes, receiptImage, isAutomated } = req.body;

    const expense = await Expense.create({
      user: req.user._id,
      title,
      amount: Number(amount),
      category,
      paymentMethod,
      merchantName: merchantName || 'Self',
      dateTime: dateTime || Date.now(),
      notes,
      receiptImage,
      isAutomated: isAutomated || false,
    });

    // Fire asynchronous budget overrun check
    checkBudgetExceeded(req.user._id, category, Number(amount), dateTime);

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get all expenses with search, pagination, and filters
// @route   GET /api/expenses
// @access  Private
exports.getExpenses = async (req, res) => {
  try {
    const { search, category, startDate, endDate, sortBy, limit, page, exportAll } = req.query;

    const query = { user: req.user._id };

    // Search query: title or merchant name
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { merchantName: { $regex: search, $options: 'i' } },
      ];
    }

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Date range filter
    if (startDate || endDate) {
      query.dateTime = {};
      if (startDate) {
        query.dateTime.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.dateTime.$lte = end;
      }
    }

    // Sort settings
    let sortOption = { dateTime: -1 }; // Default: Newest first
    if (sortBy === 'amount_asc') {
      sortOption = { amount: 1 };
    } else if (sortBy === 'amount_desc') {
      sortOption = { amount: -1 };
    } else if (sortBy === 'date_asc') {
      sortOption = { dateTime: 1 };
    }

    // If exporting all data, bypass pagination
    if (exportAll === 'true') {
      const expenses = await Expense.find(query).sort(sortOption);
      return res.json({ success: true, count: expenses.length, data: expenses });
    }

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await Expense.countDocuments(query);
    const expenses = await Expense.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      count: expenses.length,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
      data: expenses,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single expense by ID
// @route   GET /api/expenses/:id
// @access  Private
exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense log not found' });
    }
    res.json({ success: true, data: expense });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Private
exports.updateExpense = async (req, res) => {
  try {
    let expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense log not found' });
    }

    const { title, amount, category, paymentMethod, merchantName, dateTime, notes, receiptImage } = req.body;

    expense.title = title || expense.title;
    expense.amount = amount !== undefined ? Number(amount) : expense.amount;
    expense.category = category || expense.category;
    expense.paymentMethod = paymentMethod || expense.paymentMethod;
    expense.merchantName = merchantName || expense.merchantName;
    expense.dateTime = dateTime || expense.dateTime;
    expense.notes = notes !== undefined ? notes : expense.notes;
    expense.receiptImage = receiptImage !== undefined ? receiptImage : expense.receiptImage;

    const updatedExpense = await expense.save();

    // Check budget alert again
    checkBudgetExceeded(req.user._id, updatedExpense.category, updatedExpense.amount, updatedExpense.dateTime);

    res.json({ success: true, data: updatedExpense });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense log not found' });
    }
    res.json({ success: true, message: 'Expense log deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard analytics metrics
// @route   GET /api/expenses/analytics/dashboard
// @access  Private
exports.getAnalytics = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Current week dates (Sunday - Saturday)
    const currentDay = now.getDay();
    const startOfCurrentWeek = new Date(now);
    startOfCurrentWeek.setDate(now.getDate() - currentDay);
    startOfCurrentWeek.setHours(0, 0, 0, 0);

    // 1. Calculate Monthly, Weekly, and Prev Month totals
    const currentMonthExpenses = await Expense.find({
      user: userId,
      dateTime: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth },
    });

    const previousMonthExpenses = await Expense.find({
      user: userId,
      dateTime: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth },
    });

    const currentWeekExpenses = await Expense.find({
      user: userId,
      dateTime: { $gte: startOfCurrentWeek },
    });

    const monthlyTotal = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const prevMonthlyTotal = previousMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const weeklyTotal = currentWeekExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // 2. Category Aggregation for Current Month
    const categoryAgg = await Expense.aggregate([
      {
        $match: {
          user: userId,
          dateTime: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Format category totals
    const categoryTotals = categoryAgg.map((cat) => ({
      category: cat._id,
      amount: cat.total,
      count: cat.count,
    }));

    // 3. Weekly Trends Aggregation (Last 4 weeks)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const weeklyTrendAgg = await Expense.aggregate([
      {
        $match: {
          user: userId,
          dateTime: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$dateTime' },
            week: { $week: '$dateTime' },
          },
          total: { $sum: '$amount' },
          date: { $min: '$dateTime' },
        },
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } },
    ]);

    const weeklyTrends = weeklyTrendAgg.map((item, idx) => ({
      weekLabel: `Week ${idx + 1}`,
      amount: item.total,
      date: item.date,
    }));

    // 4. Payment Method Share Aggregation
    const paymentAgg = await Expense.aggregate([
      {
        $match: {
          user: userId,
          dateTime: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth },
        },
      },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$amount' },
        },
      },
    ]);

    const paymentMethods = paymentAgg.map((pm) => ({
      method: pm._id,
      amount: pm.total,
    }));

    // 5. Recent Transactions
    const recentTransactions = await Expense.find({ user: userId })
      .sort({ dateTime: -1 })
      .limit(6);

    // 6. Fetch Active Budget configuration for current month
    const budgetMonthStr = now.toISOString().slice(0, 7);
    const budget = await Budget.findOne({ user: userId, month: budgetMonthStr });

    res.json({
      success: true,
      totals: {
        monthlyTotal,
        prevMonthlyTotal,
        weeklyTotal,
        budgetLimit: budget ? budget.monthlyLimit : 0,
      },
      categoryTotals,
      weeklyTrends,
      paymentMethods,
      recentTransactions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
