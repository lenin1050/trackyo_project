const SavingsGoal = require('../models/SavingsGoal');
const Notification = require('../models/Notification');

// @desc    Get user savings goals
// @route   GET /api/savings
// @access  Private
exports.getSavingsGoals = async (req, res) => {
  try {
    const goals = await SavingsGoal.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: goals.length, data: goals });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create savings goal
// @route   POST /api/savings
// @access  Private
exports.createSavingsGoal = async (req, res) => {
  try {
    const { goalName, targetAmount, targetDate, imageUrl } = req.body;

    const goal = await SavingsGoal.create({
      user: req.user._id,
      goalName,
      targetAmount: Number(targetAmount),
      targetDate,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', // Default money jar image
    });

    res.status(201).json({ success: true, data: goal });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update savings goal
// @route   PUT /api/savings/:id
// @access  Private
exports.updateSavingsGoal = async (req, res) => {
  try {
    let goal = await SavingsGoal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Savings goal not found' });
    }

    const { goalName, targetAmount, targetDate, imageUrl } = req.body;

    goal.goalName = goalName || goal.goalName;
    goal.targetAmount = targetAmount !== undefined ? Number(targetAmount) : goal.targetAmount;
    goal.targetDate = targetDate || goal.targetDate;
    goal.imageUrl = imageUrl || goal.imageUrl;

    const updatedGoal = await goal.save();
    res.json({ success: true, data: updatedGoal });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete savings goal
// @route   DELETE /api/savings/:id
// @access  Private
exports.deleteSavingsGoal = async (req, res) => {
  try {
    const goal = await SavingsGoal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Savings goal not found' });
    }
    res.json({ success: true, message: 'Savings goal deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Deposit funds to savings goal
// @route   POST /api/savings/:id/deposit
// @access  Private
exports.depositToGoal = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Please specify a valid deposit amount greater than 0' });
    }

    let goal = await SavingsGoal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Savings goal not found' });
    }

    const prevAmt = goal.currentAmount;
    goal.currentAmount += Number(amount);
    
    const savedGoal = await goal.save();

    // Trigger notification if newly completed
    if (savedGoal.isCompleted && prevAmt < goal.targetAmount) {
      await Notification.create({
        user: req.user._id,
        message: `🎉 Congratulations! You have achieved your savings goal for "${goal.goalName}"! Total saved: Rs.${goal.targetAmount}. Excellent job!`,
        type: 'GoalAchieved',
      });
    }

    res.json({ success: true, message: 'Funds deposited successfully', data: savedGoal });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
