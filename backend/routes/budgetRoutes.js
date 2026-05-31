const express = require('express');
const router = express.Router();
const {
  getBudgets,
  getBudgetForMonth,
  createOrUpdateBudget,
} = require('../controllers/budgetController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getBudgets)
  .post(protect, createOrUpdateBudget);

router.get('/:month', protect, getBudgetForMonth);

module.exports = router;
