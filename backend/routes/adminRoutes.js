const express = require('express');
const router = express.Router();
const { getAdminStats, getAllUsers } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/stats', protect, admin, getAdminStats);
router.get('/users', protect, admin, getAllUsers);

module.exports = router;
