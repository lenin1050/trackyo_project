const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load Schemas
const User = require('../models/User');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const SavingsGoal = require('../models/SavingsGoal');
const Notification = require('../models/Notification');

dotenv.config();

const seedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/trackyo');
    console.log('Database connected for seeding...');

    // Clear existing data
    await User.deleteMany();
    await Expense.deleteMany();
    await Budget.deleteMany();
    await SavingsGoal.deleteMany();
    await Notification.deleteMany();
    console.log('Existing database records cleared.');

    // 1. Create Hashed Passwords
    const salt = await bcrypt.genSalt(10);
    const commonPassword = await bcrypt.hash('password123', salt);
    const adminPassword = await bcrypt.hash('adminpassword', salt);

    // 2. Seed Users
    const users = await User.create([
      {
        name: 'Rahul Sharma',
        email: 'rahul@trackyo.in',
        password: 'password123', // hooks will auto-hash on create if using model directly, but we passed plaintext so User pre-save hook handles it
        mobile: '9876543210',
        preferredCurrency: 'INR',
        themePreference: 'dark',
        isAdmin: false
      },
      {
        name: 'Priya Patel',
        email: 'priya@trackyo.in',
        password: 'password123',
        mobile: '9812345678',
        preferredCurrency: 'INR',
        themePreference: 'neon',
        isAdmin: false
      },
      {
        name: 'Admin Master',
        email: 'admin@trackyo.in',
        password: 'adminpassword',
        mobile: '9900001122',
        preferredCurrency: 'INR',
        themePreference: 'minimal',
        isAdmin: true
      }
    ]);

    const rahulId = users[0]._id;
    const priyaId = users[1]._id;

    console.log('Users seeded successfully!');

    // Get current month string: YYYY-MM
    const now = new Date();
    const currentMonthStr = now.toISOString().slice(0, 7);

    // Get date offsets
    const getPastDate = (daysAgo) => {
      const d = new Date();
      d.setDate(now.getDate() - daysAgo);
      return d;
    };

    // 3. Seed Rahul's Expenses (Rich dataset with Indian merchants)
    const rahulExpenses = [
      {
        user: rahulId,
        title: 'Zomato Chicken Biryani Dinner',
        amount: 450,
        category: 'Food',
        paymentMethod: 'UPI',
        merchantName: 'Zomato',
        dateTime: getPastDate(1),
        notes: 'Dinner with college friends',
        isAutomated: false
      },
      {
        user: rahulId,
        title: 'Swiggy Instamart Grocery Delivery',
        amount: 820,
        category: 'Groceries',
        paymentMethod: 'UPI',
        merchantName: 'Swiggy Instamart',
        dateTime: getPastDate(2),
        notes: 'Monthly staples',
        isAutomated: false
      },
      {
        user: rahulId,
        title: 'Uber Ride to HSR Layout Office',
        amount: 320,
        category: 'Travel',
        paymentMethod: 'Card',
        merchantName: 'Uber',
        dateTime: getPastDate(3),
        notes: 'Client office visit',
        isAutomated: true
      },
      {
        user: rahulId,
        title: 'Jio 3-Month Prepaid Recharge',
        amount: 749,
        category: 'Recharge',
        paymentMethod: 'UPI',
        merchantName: 'Jio',
        dateTime: getPastDate(5),
        notes: 'Unlimited 5G Pack',
        isAutomated: true
      },
      {
        user: rahulId,
        title: 'Netflix Premium Monthly Subscription',
        amount: 649,
        category: 'Entertainment',
        paymentMethod: 'Card',
        merchantName: 'Netflix',
        dateTime: getPastDate(7),
        notes: 'Shared screen pack',
        isAutomated: true
      },
      {
        user: rahulId,
        title: 'Flipkart Premium Gym Shoes',
        amount: 2450,
        category: 'Shopping',
        paymentMethod: 'NetBanking',
        merchantName: 'Flipkart',
        dateTime: getPastDate(9),
        notes: 'Sale discount applied',
        isAutomated: false
      },
      {
        user: rahulId,
        title: 'Apollo Pharmacy Medicines',
        amount: 1200,
        category: 'Health',
        paymentMethod: 'Cash',
        merchantName: 'Apollo Pharmacy',
        dateTime: getPastDate(12),
        notes: 'Vitamin pills and band-aids',
        isAutomated: false
      },
      {
        user: rahulId,
        title: 'Airtel Broadband Fiber Bill',
        amount: 1179,
        category: 'Bills',
        paymentMethod: 'UPI',
        merchantName: 'Airtel Broadband',
        dateTime: getPastDate(15),
        notes: '200 Mbps home wifi',
        isAutomated: true
      },
      {
        user: rahulId,
        title: 'Udemy Fullstack Development Course',
        amount: 499,
        category: 'Education',
        paymentMethod: 'UPI',
        merchantName: 'Udemy',
        dateTime: getPastDate(20),
        notes: 'React & Node learning course',
        isAutomated: false
      },
      {
        user: rahulId,
        title: 'Flat Rent Payment',
        amount: 12000,
        category: 'Bills',
        paymentMethod: 'NetBanking',
        merchantName: 'Flat Owner',
        dateTime: getPastDate(25),
        notes: 'Rent for May',
        isAutomated: false
      },
      {
        user: rahulId,
        title: 'Cafe Coffee Day Meetup',
        amount: 380,
        category: 'Food',
        paymentMethod: 'UPI',
        merchantName: 'CCD',
        dateTime: getPastDate(4),
        notes: 'Espresso and cookies',
        isAutomated: false
      },
      {
        user: rahulId,
        title: 'Ola Auto Ride to Metro',
        amount: 90,
        category: 'Travel',
        paymentMethod: 'UPI',
        merchantName: 'Ola Auto',
        dateTime: getPastDate(11),
        notes: 'Short commute',
        isAutomated: false
      }
    ];

    await Expense.create(rahulExpenses);
    console.log("Rahul's transaction history seeded!");

    // 4. Seed Priya's Expenses (Fewer logs)
    const priyaExpenses = [
      {
        user: priyaId,
        title: 'Amazon Handbag Purchase',
        amount: 3500,
        category: 'Shopping',
        paymentMethod: 'Card',
        merchantName: 'Amazon',
        dateTime: getPastDate(2),
        isAutomated: false
      },
      {
        user: priyaId,
        title: 'Dominos Pizza Party',
        amount: 1100,
        category: 'Food',
        paymentMethod: 'UPI',
        merchantName: 'Dominos Pizza',
        dateTime: getPastDate(4),
        isAutomated: false
      }
    ];

    await Expense.create(priyaExpenses);
    console.log("Priya's transactions seeded!");

    // 5. Seed Budgets for Rahul and Priya
    await Budget.create([
      {
        user: rahulId,
        month: currentMonthStr,
        monthlyLimit: 30000,
        categoryLimits: {
          Food: 6000,
          Travel: 4000,
          Shopping: 8000,
          Bills: 15000,
          Entertainment: 3000,
          Groceries: 5000
        }
      },
      {
        user: priyaId,
        month: currentMonthStr,
        monthlyLimit: 10000,
        categoryLimits: {
          Shopping: 3000, // Priya already spent 3500, so her shopping budget is blown!
          Food: 2000
        }
      }
    ]);
    console.log('Monthly Budgets seeded!');

    // 6. Seed Savings Goals (Rahul)
    await SavingsGoal.create([
      {
        user: rahulId,
        goalName: 'MacBook Pro',
        targetAmount: 120000,
        currentAmount: 45000,
        targetDate: new Date(now.getFullYear(), now.getMonth() + 6, 15),
        imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
        isCompleted: false
      },
      {
        user: rahulId,
        goalName: 'Goa Holiday',
        targetAmount: 18000,
        currentAmount: 18000, // completed
        targetDate: new Date(now.getFullYear(), now.getMonth() + 1, 10),
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
        isCompleted: true
      }
    ]);
    console.log('Savings Goals seeded!');

    // 7. Seed Notifications (Rahul and Priya)
    await Notification.create([
      {
        user: rahulId,
        message: 'Welcome to Trackyo! Make a scan of your purchase bill or paste transaction SMS to test the AI parser.',
        type: 'General',
        isRead: false
      },
      {
        user: rahulId,
        message: '🎉 Congratulations! You have achieved your savings goal for "Goa Holiday with Friends"! Total saved: Rs.18,000.',
        type: 'GoalAchieved',
        isRead: true
      },
      {
        user: priyaId,
        message: '⚠️ Alert! Your monthly category budget limit for Shopping (Rs.3,000) has been exceeded. Current Shopping spending: Rs.3,500.',
        type: 'BudgetExceeded',
        isRead: false
      }
    ]);
    console.log('System notification alerts seeded!');

    console.log('DATA SEEDING COMPLETED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding process failed: ', error);
    process.exit(1);
  }
};

seedData();
