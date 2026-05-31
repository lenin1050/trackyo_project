const { GoogleGenAI } = require('@google/generative-ai');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const Notification = require('../models/Notification');

// Initialize Gemini Client safely
const getGeminiClient = () => {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '') {
    try {
      const { GoogleGenAI } = require('@google/generative-ai');
      // For standard @google/generative-ai SDK we do:
      const { GoogleGenAI: GenAI } = require('@google/generative-ai');
      // However, different versions use:
      // const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      // Let's implement a resilient initialization matching typical official libraries
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    } catch (err) {
      console.warn('Failed to load @google/generative-ai module. Fallback rules will be used.', err);
      return null;
    }
  }
  return null;
};

// --- HIGH-FIDELITY LOCAL HEURISTIC PARSERS (FALLBACKS) ---

const indianMerchants = [
  { keywords: ['zomato', 'swiggy', 'kfc', 'domino', 'burger', 'restaurant', 'cafe', 'food', 'starbucks', 'dhabha', 'eats'], merchant: 'Swiggy/Zomato', category: 'Food' },
  { keywords: ['uber', 'ola', 'rapido', 'taxi', 'cab', 'metro', 'train', 'irctc', 'flight', 'petrol', 'fuel', 'hpcl', 'iocl', 'bpcl'], merchant: 'Uber/Ola', category: 'Travel' },
  { keywords: ['amazon', 'flipkart', 'myntra', 'zara', 'meesho', 'ajio', 'shopping', 'clothing', 'shoes', 'electronics'], merchant: 'Amazon/Flipkart', category: 'Shopping' },
  { keywords: ['jio', 'airtel', 'vi', 'recharge', 'vodafone', 'bsnl'], merchant: 'Airtel/Jio', category: 'Recharge' },
  { keywords: ['electricity', 'water', 'wifi', 'broadband', 'act', 'rent', 'landlord', 'gas', 'indane', 'bescom', 'tneb'], merchant: 'Utility Provider', category: 'Bills' },
  { keywords: ['apollo', 'pharmacy', 'hospital', 'medical', 'doctor', 'clinic', 'dentist', 'medicine', 'health', 'netmeds'], merchant: 'Apollo Pharmacy', category: 'Health' },
  { keywords: ['netflix', 'prime', 'hotstar', 'cinema', 'pvr', 'movie', 'concert', 'club', 'spotify', 'wynk', 'youtube premium'], merchant: 'Netflix/PVR', category: 'Entertainment' },
  { keywords: ['udemy', 'coursera', 'book', 'stationary', 'college', 'exam', 'tuition', 'school', 'physics wallah'], merchant: 'Educational Portal', category: 'Education' },
  { keywords: ['groceries', 'blinkit', 'zepto', 'instamart', 'bigbasket', 'dmart', 'reliance fresh', 'milk', 'vegetables'], merchant: 'Blinkit/Zepto', category: 'Groceries' }
];

const parseLocalSMS = (smsText) => {
  const text = smsText.toLowerCase();
  
  // 1. Detect Bank
  let bank = 'Other Bank';
  if (text.includes('sbi') || text.includes('state bank')) bank = 'SBI';
  else if (text.includes('hdfc')) bank = 'HDFC';
  else if (text.includes('icici')) bank = 'ICICI';
  else if (text.includes('axis')) bank = 'Axis Bank';

  // 2. Extract Amount
  let amount = 0;
  // Patterns like: Rs. 450, Rs.450.00, INR 450, spent Rs. 450
  const amountRegexes = [
    /rs\.?\s*(\d+(?:\.\d{1,2})?)/i,
    /inr\s*(\d+(?:\.\d{1,2})?)/i,
    /debited\s*(?:with|by)?\s*rs\.?\s*(\d+(?:\.\d{1,2})?)/i,
    /spent\s*rs\.?\s*(\d+(?:\.\d{1,2})?)/i
  ];

  for (const regex of amountRegexes) {
    const match = text.match(regex);
    if (match && match[1]) {
      amount = parseFloat(match[1]);
      break;
    }
  }

  // If amount regex failed, check raw floating number
  if (amount === 0) {
    const fallbackMatch = text.match(/\b\d+(\.\d{1,2})?\b/);
    if (fallbackMatch) amount = parseFloat(fallbackMatch[0]);
  }

  // 3. Detect Merchant and Category
  let detectedMerchant = 'Local Merchant';
  let detectedCategory = 'Other';

  for (const item of indianMerchants) {
    for (const keyword of item.keywords) {
      if (text.includes(keyword)) {
        detectedMerchant = keyword.charAt(0).toUpperCase() + keyword.slice(1);
        detectedCategory = item.category;
        break;
      }
    }
    if (detectedCategory !== 'Other') break;
  }

  // Make merchant name beautiful if matched standard
  if (detectedMerchant.toLowerCase() === 'zomato') detectedMerchant = 'Zomato';
  if (detectedMerchant.toLowerCase() === 'swiggy') detectedMerchant = 'Swiggy';
  if (detectedMerchant.toLowerCase() === 'uber') detectedMerchant = 'Uber';
  if (detectedMerchant.toLowerCase() === 'ola') detectedMerchant = 'Ola';
  if (detectedMerchant.toLowerCase() === 'jio') detectedMerchant = 'Jio';
  if (detectedMerchant.toLowerCase() === 'airtel') detectedMerchant = 'Airtel';
  if (detectedMerchant.toLowerCase() === 'amazon') detectedMerchant = 'Amazon';
  if (detectedMerchant.toLowerCase() === 'flipkart') detectedMerchant = 'Flipkart';

  return {
    amount,
    merchantName: detectedMerchant,
    category: detectedCategory,
    bank,
    title: `SMS: ${detectedMerchant}`
  };
};

const parseLocalOCR = (ocrText) => {
  const text = ocrText.toLowerCase();
  
  // Try to find total/amount in text
  let amount = 0;
  // Regex looking for: total: rs 500, gpay 450, total 320.50, subtotal, cash
  const amountRegexes = [
    /(?:total|amount|net\s*payable|gpay|upi|paid|cash)\s*(?:rs\.?|inr)?\s*[:\-=]?\s*(\d+(?:\.\d{1,2})?)/i,
    /rs\.?\s*(\d+(?:\.\d{1,2})?)/i,
    /subtotal\s*[:\-=]?\s*(\d+(?:\.\d{1,2})?)/i
  ];

  for (const regex of amountRegexes) {
    const match = text.match(regex);
    if (match && match[1]) {
      amount = parseFloat(match[1]);
      break;
    }
  }

  // Merchant detection
  let detectedMerchant = 'Store Receipt';
  let detectedCategory = 'Other';

  for (const item of indianMerchants) {
    for (const keyword of item.keywords) {
      if (text.includes(keyword)) {
        detectedMerchant = keyword.charAt(0).toUpperCase() + keyword.slice(1);
        detectedCategory = item.category;
        break;
      }
    }
    if (detectedCategory !== 'Other') break;
  }

  // Extract Date if possible
  let date = new Date();
  const dateRegex = /(\d{1,2})[\/\- ](\d{1,2})[\/\- ](\d{2,4})/;
  const dateMatch = text.match(dateRegex);
  if (dateMatch) {
    try {
      const d = parseInt(dateMatch[1], 10);
      const m = parseInt(dateMatch[2], 10) - 1;
      let y = parseInt(dateMatch[3], 10);
      if (y < 100) y += 2000;
      date = new Date(y, m, d);
    } catch (e) {
      // Keep today's date
    }
  }

  return {
    amount: amount || 120, // robust default if OCR text is extremely blurry
    merchantName: detectedMerchant,
    category: detectedCategory,
    date,
    title: `Receipt: ${detectedMerchant}`
  };
};

const getLocalInsights = (monthlyTotal, prevMonthlyTotal, categoryTotals, budgetLimit) => {
  const insights = [];

  // Monthly change insight
  if (monthlyTotal > 0 && prevMonthlyTotal > 0) {
    const percentDiff = ((monthlyTotal - prevMonthlyTotal) / prevMonthlyTotal) * 100;
    if (percentDiff > 10) {
      insights.push({
        type: 'warning',
        text: `📈 Alert: Your total spending is ${percentDiff.toFixed(0)}% higher than last month. Consider review of recent transactions!`
      });
    } else if (percentDiff < -10) {
      insights.push({
        type: 'success',
        text: `🎉 Great Job! You spent ${Math.abs(percentDiff).toFixed(0)}% less compared to last month. Keep up the high savings!`
      });
    }
  }

  // Budget status insight
  if (budgetLimit > 0) {
    const limitPct = (monthlyTotal / budgetLimit) * 100;
    if (limitPct >= 100) {
      insights.push({
        type: 'danger',
        text: `🚨 Budget Blown: You have exceeded your monthly limit of Rs.${budgetLimit}. Limit high-amount purchases!`
      });
    } else if (limitPct >= 85) {
      insights.push({
        type: 'warning',
        text: `⚠️ Warning: You have utilized ${limitPct.toFixed(0)}% of your monthly budget limit of Rs.${budgetLimit}. Spend wise!`
      });
    } else {
      insights.push({
        type: 'info',
        text: `💡 Budget Status: You have utilized ${limitPct.toFixed(0)}% of your monthly budget (Rs.${budgetLimit}). Remaining: Rs.${Math.max(0, budgetLimit - monthlyTotal)}.`
      });
    }
  }

  // Category insights
  const foodTotal = categoryTotals.find(c => c.category === 'Food')?.amount || 0;
  const shoppingTotal = categoryTotals.find(c => c.category === 'Shopping')?.amount || 0;

  if (foodTotal > monthlyTotal * 0.35 && monthlyTotal > 1000) {
    insights.push({
      type: 'warning',
      text: `🍔 Food Spends: You spent Rs.${foodTotal.toFixed(0)} on dining & Swiggy/Zomato, which is over 35% of your total expenditures. Try cooking at home to save!`
    });
  }

  if (shoppingTotal > monthlyTotal * 0.25 && monthlyTotal > 1000) {
    insights.push({
      type: 'info',
      text: `🛍️ Shopping Focus: Over 25% of your expenses went to Shopping (Rs.${shoppingTotal.toFixed(0)}). Review wishlist items to avoid impulse buying.`
    });
  }

  // Default insights if list is empty
  if (insights.length === 0) {
    insights.push({
      type: 'success',
      text: `💡 Welcome to Trackyo AI Insights. Add expenses manually, paste bank SMS, or scan receipts to receive custom suggestions!`
    });
    insights.push({
      type: 'info',
      text: `💸 Tip: Setting budgets for categories like Food and Shopping is the easiest way to prevent overspending!`
    });
  }

  return insights;
};

// --- API CONTROLLER ENDPOINTS ---

// @desc    Auto-Categorize Expense Title/Merchant via Gemini or Local fallback
// @route   POST /api/ai/categorize
// @access  Private
exports.categorizeText = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: 'Please provide text string to categorize' });
    }

    const genAI = getGeminiClient();
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `You are a finance auto-categorization system. Given this Indian merchant or transaction detail text: "${text}", return ONLY one of the following exact category strings: Food, Travel, Shopping, Bills, Health, Entertainment, Education, Recharge, Groceries, Other. Output exactly one word.`;
        
        const result = await model.generateContent(prompt);
        const category = result.response.text().trim();
        
        // Match return category against exact list
        const validCategories = ['Food', 'Travel', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Education', 'Recharge', 'Groceries', 'Other'];
        const matchedCategory = validCategories.find(c => c.toLowerCase() === category.toLowerCase()) || 'Other';
        
        return res.json({ success: true, category: matchedCategory, source: 'Gemini AI' });
      } catch (err) {
        console.error('Gemini API call failed, using heuristic fallback:', err);
      }
    }

    // Local rules fallback
    const textLower = text.toLowerCase();
    let matchedCategory = 'Other';
    for (const item of indianMerchants) {
      for (const keyword of item.keywords) {
        if (textLower.includes(keyword)) {
          matchedCategory = item.category;
          break;
        }
      }
      if (matchedCategory !== 'Other') break;
    }

    res.json({ success: true, category: matchedCategory, source: 'Local Heuristics Engine' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Simulate and Parse Bank SMS text
// @route   POST /api/ai/parse-sms
// @access  Private
exports.parseSMSTransaction = async (req, res) => {
  try {
    const { smsText } = req.body;
    if (!smsText) {
      return res.status(400).json({ success: false, message: 'Please provide bank SMS alert text' });
    }

    const genAI = getGeminiClient();
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `Given this bank transaction SMS received by an Indian user: "${smsText}". Extract:
1. Amount (numeric float)
2. Merchant Name (e.g. Swiggy, Zomato, Uber, Jio, etc. Default 'Self')
3. Category (One of: Food, Travel, Shopping, Bills, Health, Entertainment, Education, Recharge, Groceries, Other)
4. Bank Name (e.g. SBI, HDFC, ICICI, Axis Bank)
Format your response as a valid JSON object only. Example: {"amount": 450, "merchantName": "Swiggy", "category": "Food", "bank": "HDFC"}`;

        const result = await model.generateContent(prompt);
        // Clean JSON response (sometimes Gemini encloses in ```json)
        let cleanJsonText = result.response.text().trim();
        if (cleanJsonText.startsWith('```')) {
          cleanJsonText = cleanJsonText.replace(/```json|```/g, '').trim();
        }
        
        const extracted = JSON.parse(cleanJsonText);
        
        return res.json({
          success: true,
          data: {
            amount: extracted.amount || 0,
            merchantName: extracted.merchantName || 'Local Merchant',
            category: extracted.category || 'Other',
            bank: extracted.bank || 'Other Bank',
            title: `SMS: ${extracted.merchantName || 'Local Merchant'}`
          },
          source: 'Gemini AI'
        });
      } catch (err) {
        console.error('Gemini SMS parse failed, using heuristic fallback:', err);
      }
    }

    // Heuristics fallback
    const parsed = parseLocalSMS(smsText);
    res.json({
      success: true,
      data: parsed,
      source: 'Local Heuristics Engine'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Parse OCR Extracted Bill / Receipt Text
// @route   POST /api/ai/parse-ocr
// @access  Private
exports.parseOCRText = async (req, res) => {
  try {
    const { ocrText } = req.body;
    if (!ocrText) {
      return res.status(400).json({ success: false, message: 'Please provide receipt OCR text string' });
    }

    const genAI = getGeminiClient();
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `Analyze this raw OCR text scanned from an Indian shopping receipt or bill: "${ocrText}". Extract:
1. Total Amount paid (float number, default 150)
2. Merchant Name (e.g. Zomato, Zepto, Flipkart, DMart, etc. Default 'Store Receipt')
3. Category (One of: Food, Travel, Shopping, Bills, Health, Entertainment, Education, Recharge, Groceries, Other)
4. Date (Format: YYYY-MM-DD)
Format your response as a valid JSON object only. Example: {"amount": 799, "merchantName": "Zomato", "category": "Food", "date": "2026-05-28"}`;

        const result = await model.generateContent(prompt);
        let cleanJsonText = result.response.text().trim();
        if (cleanJsonText.startsWith('```')) {
          cleanJsonText = cleanJsonText.replace(/```json|```/g, '').trim();
        }

        const extracted = JSON.parse(cleanJsonText);
        
        return res.json({
          success: true,
          data: {
            amount: extracted.amount || 150,
            merchantName: extracted.merchantName || 'Store Receipt',
            category: extracted.category || 'Other',
            date: extracted.date || new Date().toISOString().slice(0, 10),
            title: `Receipt: ${extracted.merchantName || 'Store Receipt'}`
          },
          source: 'Gemini AI'
        });
      } catch (err) {
        console.error('Gemini OCR parsing failed, using heuristic fallback:', err);
      }
    }

    // Heuristics fallback
    const parsed = parseLocalOCR(ocrText);
    res.json({
      success: true,
      data: parsed,
      source: 'Local Heuristics Engine'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate personalized financial suggestions & spending patterns
// @route   GET /api/ai/insights
// @access  Private
exports.getFinancialInsights = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch monthly stats matching expenseController logic
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const currentMonthExpenses = await Expense.find({
      user: userId,
      dateTime: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth },
    });

    const previousMonthExpenses = await Expense.find({
      user: userId,
      dateTime: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth },
    });

    const monthlyTotal = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const prevMonthlyTotal = previousMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Sum expenses by category
    const categoryTotalsMap = {};
    currentMonthExpenses.forEach((exp) => {
      categoryTotalsMap[exp.category] = (categoryTotalsMap[exp.category] || 0) + exp.amount;
    });

    const categoryTotals = Object.keys(categoryTotalsMap).map((cat) => ({
      category: cat,
      amount: categoryTotalsMap[cat],
    }));

    const budgetMonthStr = now.toISOString().slice(0, 7);
    const budget = await Budget.findOne({ user: userId, month: budgetMonthStr });
    const budgetLimit = budget ? budget.monthlyLimit : 0;

    const genAI = getGeminiClient();
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `You are "Trackyo AI", an expert personal finance advisor for Indian students. Analyze these current expenditures and budgets:
- Current Month Spend: Rs.${monthlyTotal}
- Last Month Spend: Rs.${prevMonthlyTotal}
- Monthly Budget Threshold: Rs.${budgetLimit}
- Category Breakdown: ${JSON.stringify(categoryTotalsMap)}

Generate 3 tailored, punchy, actionable financial suggestions and saving tips. Structure your response as a valid JSON array of objects. Each object has:
- "type": "info", "warning", "success", or "danger" (depending on severity)
- "text": The advice string (keep it friendly, expert, and referencing Indian platforms like Swiggy, Zomato, Uber, Jio, Blinkit if appropriate).
Example output: [{"type": "warning", "text": "You spent Rs.2400 on Zomato this week, which is 30% higher than last week. Consider home meals!"}]`;

        const result = await model.generateContent(prompt);
        let cleanJsonText = result.response.text().trim();
        if (cleanJsonText.startsWith('```')) {
          cleanJsonText = cleanJsonText.replace(/```json|```/g, '').trim();
        }

        const insights = JSON.parse(cleanJsonText);
        return res.json({ success: true, insights, source: 'Gemini AI' });
      } catch (err) {
        console.error('Gemini financial insights failed, using heuristic fallback:', err);
      }
    }

    // Heuristics fallback
    const insights = getLocalInsights(monthlyTotal, prevMonthlyTotal, categoryTotals, budgetLimit);
    res.json({ success: true, insights, source: 'Local Heuristics Engine' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
