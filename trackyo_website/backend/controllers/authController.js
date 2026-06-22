const User = require('../models/User');
const Budget = require('../models/Budget');
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'trackyosecretjwt12345!@#', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, mobile, preferredCurrency, themePreference } = req.body;

    // Check if user already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const mobileExists = await User.findOne({ mobile });
    if (mobileExists) {
      return res.status(400).json({ success: false, message: 'Mobile number already registered' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      mobile,
      preferredCurrency: preferredCurrency || 'INR',
      themePreference: themePreference || 'dark',
    });

    if (user) {
      // Create a default monthly budget for the user
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      await Budget.create({
        user: user._id,
        month: currentMonth,
        monthlyLimit: 15000, // Default 15k limit
        categoryLimits: {
          Food: 5000,
          Travel: 2000,
          Shopping: 3000,
          Bills: 3000,
          Entertainment: 2000,
        },
      });

      // Create a welcome notification
      await Notification.create({
        user: user._id,
        message: `Welcome to Trackyo, ${user.name}! Track Smart. Spend Wise. We have created a default monthly budget of Rs.15,000 to help you get started!`,
        type: 'General',
      });

      res.status(201).json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        preferredCurrency: user.preferredCurrency,
        themePreference: user.themePreference,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data provided' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email and include password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    res.json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      preferredCurrency: user.preferredCurrency,
      themePreference: user.themePreference,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        preferredCurrency: user.preferredCurrency,
        themePreference: user.themePreference,
        isAdmin: user.isAdmin,
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Forgot Password Mock
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found with that email' });
    }

    // In production we would send an email. For demo/academic purpose, we return a mock success message.
    res.json({
      success: true,
      message: 'Password reset link sent successfully! (Demo simulated: check server console / use fallback reset password "123456")',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user preferences
// @route   PUT /api/auth/preferences
// @access  Private
exports.updatePreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.preferredCurrency = req.body.preferredCurrency || user.preferredCurrency;
      user.themePreference = req.body.themePreference || user.themePreference;
      
      if (req.body.name) user.name = req.body.name;
      if (req.body.mobile) user.mobile = req.body.mobile;

      const updatedUser = await user.save();

      res.json({
        success: true,
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        mobile: updatedUser.mobile,
        preferredCurrency: updatedUser.preferredCurrency,
        themePreference: updatedUser.themePreference,
        isAdmin: updatedUser.isAdmin,
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
