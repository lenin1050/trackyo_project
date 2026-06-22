const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getNotifications);
router.delete('/', protect, clearAllNotifications);
router.put('/read-all', protect, markAllAsRead);
router.put('/:id', protect, markAsRead);

module.exports = router;
