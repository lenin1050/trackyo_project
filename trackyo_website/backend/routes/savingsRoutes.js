const express = require('express');
const router = express.Router();
const {
  getSavingsGoals,
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  depositToGoal,
  withdrawFromGoal,
} = require('../controllers/savingsController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getSavingsGoals)
  .post(protect, createSavingsGoal);

router.route('/:id')
  .put(protect, updateSavingsGoal)
  .delete(protect, deleteSavingsGoal);

router.post('/:id/deposit', protect, depositToGoal);
router.post('/:id/withdraw', protect, withdrawFromGoal);

module.exports = router;
