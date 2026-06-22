const express = require('express');
const router = express.Router();
const {
  categorizeText,
  parseSMSTransaction,
  parseOCRText,
  getFinancialInsights,
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/categorize', protect, categorizeText);
router.post('/parse-sms', protect, parseSMSTransaction);
router.post('/parse-ocr', protect, parseOCRText);
router.get('/insights', protect, getFinancialInsights);

module.exports = router;
