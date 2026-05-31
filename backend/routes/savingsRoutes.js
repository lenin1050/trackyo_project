const express = require('express');
const router = express.Router();
const {
  getSavingsGoals,
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  depositToGoal,
} = require('../controllers/savingsController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getSavingsGoals)
  .post(protect, createSavingsGoal);

router.route('/:id')
  .put(protect, updateSavingsGoal)
  .delete(protect, deleteSavingsGoal);

router.post('/:id/deposit', protect, depositToGoal);

module.exports = router;
