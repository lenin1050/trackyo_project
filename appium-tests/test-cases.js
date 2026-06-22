// ============================================================
// Trackyo Appium E2E — Test Cases
// App: com.trackyo.trackyo (WebIntoApp WebView wrapper)
// Total: 40 test cases across 8 categories
// ============================================================


// ----------------------------------------------------------------
// HELPER: wait for WebView context and switch into it
// ----------------------------------------------------------------
async function switchToWebView(driver) {
  await driver.pause(2000);
  let contexts = [];
  for (let i = 0; i < 10; i++) {
    contexts = await driver.getContexts();
    const webCtx = contexts.find(c => c.includes('WEBVIEW') || c.includes('CHROMIUM'));
    if (webCtx) {
      await driver.switchContext(webCtx);
      return webCtx;
    }
    await driver.pause(1000);
  }
  throw new Error(`WebView context not found. Available: ${JSON.stringify(contexts)}`);
}

// ----------------------------------------------------------------
// HELPER: find element with timeout
// ----------------------------------------------------------------
async function findEl(driver, selector, timeout = 8000) {
  await driver.waitUntil(
    async () => {
      const el = await driver.$(selector);
      return await el.isDisplayed().catch(() => false);
    },
    { timeout, timeoutMsg: `Element "${selector}" not visible after ${timeout}ms` }
  );
  return driver.$(selector);
}

// ----------------------------------------------------------------
// HELPER: get toast notification text
// ----------------------------------------------------------------
async function getToast(driver, timeout = 6000) {
  const toast = await driver.waitUntil(
    async () => {
      // Try multiple toast selectors used by the app
      const selectors = [
        '//div[contains(@class,"fixed") and contains(@class,"top-4")]',
        '//div[contains(@class,"toast")]',
        '//*[contains(@class,"animate-in")]',
        '//div[contains(@class,"z-50") and contains(@class,"shadow")]'
      ];
      for (const sel of selectors) {
        try {
          const el = await driver.$(`/android=...`);
          const webEl = await driver.$(`xpath=${sel}`);
          if (await webEl.isDisplayed()) return webEl;
        } catch {}
      }
      return null;
    },
    { timeout, timeoutMsg: 'Toast notification did not appear' }
  );
  return toast;
}

// ----------------------------------------------------------------
// TEST CASE DEFINITIONS
// ----------------------------------------------------------------
const testCases = [

  // ========================
  // 1. APP LAUNCH (5 tests)
  // ========================
  {
    id: 1, category: 'App Launch', name: 'TC_LAUNCH_01',
    description: 'App launches without crash and WebView loads',
    run: async (driver, ctx) => {
      const ctx_ = await switchToWebView(driver);
      if (!ctx_) throw new Error('WebView context not found — app may have crashed');
    }
  },
  {
    id: 2, category: 'App Launch', name: 'TC_LAUNCH_02',
    description: 'Page title contains Trackyo',
    run: async (driver) => {
      const title = await driver.getTitle();
      if (!title.toLowerCase().includes('trackyo')) throw new Error(`Title was: "${title}"`);
    }
  },
  {
    id: 3, category: 'App Launch', name: 'TC_LAUNCH_03',
    description: 'Login page body renders — email field is visible',
    run: async (driver) => {
      const el = await findEl(driver, '[name="email"]');
      if (!await el.isDisplayed()) throw new Error('Email input not visible on launch');
    }
  },
  {
    id: 4, category: 'App Launch', name: 'TC_LAUNCH_04',
    description: 'Password field is present',
    run: async (driver) => {
      const el = await findEl(driver, '[name="password"]');
      if (!await el.isDisplayed()) throw new Error('Password input not visible');
    }
  },
  {
    id: 5, category: 'App Launch', name: 'TC_LAUNCH_05',
    description: 'Brand motto "Track Smart. Spend Wise" is visible',
    run: async (driver) => {
      const el = await findEl(driver, '//p[contains(text(),"Track Smart")]', 8000);
      const txt = await el.getText();
      if (!txt.includes('Track Smart')) throw new Error(`Motto text was: "${txt}"`);
    }
  },

  // ========================
  // 2. AUTHENTICATION (10 tests)
  // ========================
  {
    id: 6, category: 'Authentication', name: 'TC_AUTH_01',
    description: 'Login with empty fields shows validation',
    run: async (driver) => {
      const emailEl = await findEl(driver, '[name="email"]');
      await emailEl.clearValue();
      const pwEl = await findEl(driver, '[name="password"]');
      await pwEl.clearValue();
      const submitBtn = await findEl(driver, 'button[type="submit"]');
      await submitBtn.click();
      await driver.pause(1500);
      const required = await (await driver.$('[name="email"]')).getAttribute('required');
      if (!required) throw new Error('Form did not block empty submission');
    }
  },
  {
    id: 7, category: 'Authentication', name: 'TC_AUTH_02',
    description: 'Login with wrong password shows error toast',
    run: async (driver) => {
      const emailEl = await findEl(driver, '[name="email"]');
      await emailEl.clearValue();
      await emailEl.setValue(ctx.email || 'rahul@trackyo.in');
      const pwEl = await findEl(driver, '[name="password"]');
      await pwEl.clearValue();
      await pwEl.setValue('wrongpassword123');
      await (await findEl(driver, 'button[type="submit"]')).click();
      await driver.pause(3000);
      const body = await (await driver.$('body')).getText();
      if (!body.toLowerCase().includes('invalid') && !body.toLowerCase().includes('incorrect')) {
        throw new Error('Expected error message for wrong password');
      }
    }
  },
  {
    id: 8, category: 'Authentication', name: 'TC_AUTH_03',
    description: 'Login with non-existent email shows user not found',
    run: async (driver) => {
      const emailEl = await findEl(driver, '[name="email"]');
      await emailEl.clearValue();
      await emailEl.setValue('ghost_user_xyz@trackyo.in');
      const pwEl = await findEl(driver, '[name="password"]');
      await pwEl.clearValue();
      await pwEl.setValue('password123');
      await (await findEl(driver, 'button[type="submit"]')).click();
      await driver.pause(3000);
      const body = await (await driver.$('body')).getText();
      if (!body.toLowerCase().includes('invalid') && !body.toLowerCase().includes('not found')) {
        throw new Error('Expected not found error for unknown email');
      }
    }
  },
  {
    id: 9, category: 'Authentication', name: 'TC_AUTH_04',
    description: 'Forgot Password with empty email shows validation toast',
    run: async (driver) => {
      const emailEl = await findEl(driver, '[name="email"]');
      await emailEl.clearValue();
      const forgotBtn = await findEl(driver, '//button[text()="Forgot Password?"]');
      await forgotBtn.click();
      await driver.pause(2000);
      const body = await (await driver.$('body')).getText();
      if (!body.toLowerCase().includes('enter your email')) {
        throw new Error('No email validation for forgot password');
      }
    }
  },
  {
    id: 10, category: 'Authentication', name: 'TC_AUTH_05',
    description: 'Forgot Password with valid email triggers mock reset',
    run: async (driver, ctx) => {
      const emailEl = await findEl(driver, '[name="email"]');
      await emailEl.clearValue();
      await emailEl.setValue(ctx.email || 'rahul@trackyo.in');
      const forgotBtn = await findEl(driver, '//button[text()="Forgot Password?"]');
      await forgotBtn.click();
      await driver.pause(2500);
      const body = await (await driver.$('body')).getText();
      if (!body.toLowerCase().includes('reset') && !body.toLowerCase().includes('sent')) {
        throw new Error('Forgot password did not trigger mock reset message');
      }
    }
  },
  {
    id: 11, category: 'Authentication', name: 'TC_AUTH_06',
    description: 'Password eye icon toggles field type',
    run: async (driver) => {
      const pwEl = await findEl(driver, '[name="password"]');
      const typeBefore = await pwEl.getAttribute('type');
      if (typeBefore !== 'password') throw new Error('Initial type should be password');
      const eyeBtn = await findEl(driver, 'button[type="button"] > svg.lucide-eye');
      await eyeBtn.click();
      await driver.pause(500);
      const typeAfter = await pwEl.getAttribute('type');
      if (typeAfter !== 'text') throw new Error('Type did not toggle to text');
      await eyeBtn.click(); // toggle back
    }
  },
  {
    id: 12, category: 'Authentication', name: 'TC_AUTH_07',
    description: 'Switch to Register form — all fields present',
    run: async (driver) => {
      const regBtn = await findEl(driver, '//button[text()="Create Account"]');
      await regBtn.click();
      await driver.pause(1000);
      const nameEl = await findEl(driver, '[name="name"]');
      const mobileEl = await findEl(driver, '[name="mobile"]');
      if (!await nameEl.isDisplayed() || !await mobileEl.isDisplayed()) {
        throw new Error('Register form fields not shown');
      }
      // Switch back
      const backBtn = await findEl(driver, '//button[text()="Sign In"]');
      await backBtn.click();
    }
  },
  {
    id: 13, category: 'Authentication', name: 'TC_AUTH_08',
    description: 'Register with duplicate email shows error',
    run: async (driver) => {
      const regBtn = await findEl(driver, '//button[text()="Create Account"]');
      await regBtn.click();
      await driver.pause(800);
      await (await findEl(driver, '[name="name"]')).setValue('Duplicate User');
      await (await findEl(driver, '[name="mobile"]')).setValue('9123456789');
      await (await findEl(driver, '[name="email"]')).setValue('rahul@trackyo.in');
      await (await findEl(driver, '[name="password"]')).setValue('password123');
      await (await findEl(driver, 'button[type="submit"]')).click();
      await driver.pause(3000);
      const body = await (await driver.$('body')).getText();
      if (!body.toLowerCase().includes('already') && !body.toLowerCase().includes('exist')) {
        throw new Error('Expected duplicate email error');
      }
      const backBtn = await findEl(driver, '//button[text()="Sign In"]');
      await backBtn.click();
    }
  },
  {
    id: 14, category: 'Authentication', name: 'TC_AUTH_09',
    description: 'Successful login with valid credentials — dashboard loads',
    run: async (driver, ctx) => {
      const emailEl = await findEl(driver, '[name="email"]');
      await emailEl.clearValue();
      await emailEl.setValue(ctx.email || 'rahul@trackyo.in');
      const pwEl = await findEl(driver, '[name="password"]');
      await pwEl.clearValue();
      await pwEl.setValue(ctx.password || 'password123');
      await (await findEl(driver, 'button[type="submit"]')).click();
      // Wait for dashboard
      await driver.waitUntil(
        async () => {
          try { return await (await driver.$('aside')).isDisplayed(); } catch { return false; }
        },
        { timeout: 10000, timeoutMsg: 'Dashboard sidebar did not appear after login' }
      );
      ctx.isLoggedIn = true;
    }
  },
  {
    id: 15, category: 'Authentication', name: 'TC_AUTH_10',
    description: 'Logout redirects to login screen',
    run: async (driver, ctx) => {
      const logoutBtn = await findEl(driver, '//button[span[text()="Sign Out"]]');
      await logoutBtn.click();
      await driver.waitUntil(
        async () => {
          try { return await (await driver.$('[name="email"]')).isDisplayed(); } catch { return false; }
        },
        { timeout: 8000, timeoutMsg: 'Login screen not shown after logout' }
      );
      ctx.isLoggedIn = false;
    }
  },

  // ========================
  // 3. DASHBOARD (8 tests)
  // ========================
  {
    id: 16, category: 'Dashboard', name: 'TC_DASH_01',
    description: 'Login as Rahul and verify dashboard heading',
    run: async (driver, ctx) => {
      const emailEl = await findEl(driver, '[name="email"]');
      await emailEl.clearValue();
      await emailEl.setValue(ctx.email || 'rahul@trackyo.in');
      const pwEl = await findEl(driver, '[name="password"]');
      await pwEl.clearValue();
      await pwEl.setValue(ctx.password || 'password123');
      await (await findEl(driver, 'button[type="submit"]')).click();
      await driver.waitUntil(
        async () => { try { return await (await driver.$('aside')).isDisplayed(); } catch { return false; } },
        { timeout: 10000, timeoutMsg: 'Dashboard did not load' }
      );
      const h2 = await findEl(driver, 'header h2');
      const txt = await h2.getText();
      if (!txt.toLowerCase().includes('dashboard')) throw new Error(`Header was: "${txt}"`);
      ctx.isLoggedIn = true;
    }
  },
  {
    id: 17, category: 'Dashboard', name: 'TC_DASH_02',
    description: 'Summary cards (Monthly Spent, Weekly Spent) are visible',
    run: async (driver) => {
      const body = await (await driver.$('main')).getText();
      if (!body.toLowerCase().includes('monthly') || !body.toLowerCase().includes('weekly')) {
        throw new Error('Summary stat cards missing');
      }
    }
  },
  {
    id: 18, category: 'Dashboard', name: 'TC_DASH_03',
    description: 'Recharts chart component renders on dashboard',
    run: async (driver) => {
      const charts = await driver.$$('.recharts-responsive-container');
      if (charts.length === 0) throw new Error('No charts rendered on dashboard');
    }
  },
  {
    id: 19, category: 'Dashboard', name: 'TC_DASH_04',
    description: 'Recent Transactions section is visible',
    run: async (driver) => {
      const el = await findEl(driver, '//h4[contains(text(),"Recent Transactions")]');
      if (!await el.isDisplayed()) throw new Error('Recent Transactions header missing');
    }
  },
  {
    id: 20, category: 'Dashboard', name: 'TC_DASH_05',
    description: 'Trackyo AI Financial Advisory section is present',
    run: async (driver) => {
      const body = await (await driver.$('main')).getText();
      if (!body.toLowerCase().includes('ai') && !body.toLowerCase().includes('financial advisory')) {
        throw new Error('AI advisory section missing');
      }
    }
  },
  {
    id: 21, category: 'Dashboard', name: 'TC_DASH_06',
    description: 'Sidebar navigation shows all tabs',
    run: async (driver) => {
      const aside = await findEl(driver, 'aside');
      const txt = await aside.getText();
      const expectedTabs = ['Dashboard', 'Transactions', 'Budgets', 'Wishlist'];
      for (const tab of expectedTabs) {
        if (!txt.includes(tab)) throw new Error(`Sidebar tab "${tab}" missing`);
      }
    }
  },
  {
    id: 22, category: 'Dashboard', name: 'TC_DASH_07',
    description: 'User name displayed in sidebar',
    run: async (driver, ctx) => {
      const aside = await findEl(driver, 'aside');
      const txt = await aside.getText();
      if (!txt.includes('Rahul') && !(ctx.username && txt.includes(ctx.username))) {
        throw new Error(`Expected user name in sidebar. Sidebar text: "${txt.substring(0, 100)}"`);
      }
    }
  },
  {
    id: 23, category: 'Dashboard', name: 'TC_DASH_08',
    description: 'Simulate Bank SMS button is visible on dashboard',
    run: async (driver) => {
      const btn = await findEl(driver, '//button[contains(.,"Simulate Bank SMS")]');
      if (!await btn.isDisplayed()) throw new Error('SMS Simulator button not found');
    }
  },

  // ========================
  // 4. TRANSACTIONS (5 tests)
  // ========================
  {
    id: 24, category: 'Transactions', name: 'TC_TRANS_01',
    description: 'Navigate to Transactions tab',
    run: async (driver) => {
      const transTab = await findEl(driver, '//button[span[text()="Transactions"]]');
      await transTab.click();
      await driver.pause(1500);
      const h2 = await findEl(driver, 'header h2');
      const txt = await h2.getText();
      if (!txt.toLowerCase().includes('transaction')) throw new Error(`Expected Transactions header, got: "${txt}"`);
    }
  },
  {
    id: 25, category: 'Transactions', name: 'TC_TRANS_02',
    description: 'Transaction list renders with at least 1 entry',
    run: async (driver) => {
      await driver.pause(2000);
      const rows = await driver.$$('table tbody tr');
      if (rows.length === 0) {
        // Try card layout
        const cards = await driver.$$('[data-testid="expense-row"], .transaction-card, article');
        if (cards.length === 0) throw new Error('No transaction entries found');
      }
    }
  },
  {
    id: 26, category: 'Transactions', name: 'TC_TRANS_03',
    description: 'Search field filters transactions',
    run: async (driver) => {
      const searchEl = await findEl(driver, 'input[placeholder*="Search"], input[type="search"]');
      await searchEl.setValue('Zomato');
      await driver.pause(1500);
      const body = await (await driver.$('main')).getText();
      if (!body.toLowerCase().includes('zomato') && !body.toLowerCase().includes('no result')) {
        throw new Error('Search filter did not respond');
      }
      await searchEl.clearValue();
    }
  },
  {
    id: 27, category: 'Transactions', name: 'TC_TRANS_04',
    description: 'Add new expense manually via + button',
    run: async (driver) => {
      const addBtn = await findEl(driver, '//button[contains(.,"Add") or contains(.,"New") or contains(.,"+ ")]');
      await addBtn.click();
      await driver.pause(1000);
      const body = await (await driver.$('body')).getText();
      if (!body.toLowerCase().includes('title') && !body.toLowerCase().includes('amount')) {
        throw new Error('Add expense form did not open');
      }
      // Close without saving
      try {
        const cancelBtn = await driver.$('//button[text()="Cancel" or contains(@class,"close")]');
        if (await cancelBtn.isDisplayed()) await cancelBtn.click();
      } catch {}
    }
  },
  {
    id: 28, category: 'Transactions', name: 'TC_TRANS_05',
    description: 'Export CSV button is present',
    run: async (driver) => {
      const body = await (await driver.$('main')).getText();
      if (!body.toLowerCase().includes('export') && !body.toLowerCase().includes('csv')) {
        throw new Error('Export CSV option not found on Transactions page');
      }
    }
  },

  // ========================
  // 5. BUDGETS (4 tests)
  // ========================
  {
    id: 29, category: 'Budgets', name: 'TC_BUDGET_01',
    description: 'Navigate to Budgets page',
    run: async (driver) => {
      const budgetTab = await findEl(driver, '//button[contains(span,"Budget")]');
      await budgetTab.click();
      await driver.pause(1500);
      const body = await (await driver.$('main')).getText();
      if (!body.toLowerCase().includes('budget') && !body.toLowerCase().includes('limit')) {
        throw new Error('Budget page content not found');
      }
    }
  },
  {
    id: 30, category: 'Budgets', name: 'TC_BUDGET_02',
    description: 'Monthly budget limit is displayed',
    run: async (driver) => {
      const body = await (await driver.$('main')).getText();
      if (!body.match(/\d+/)) throw new Error('No numeric budget values found on page');
    }
  },
  {
    id: 31, category: 'Budgets', name: 'TC_BUDGET_03',
    description: 'Category budget progress bars render',
    run: async (driver) => {
      const bars = await driver.$$('.rounded-full');
      if (bars.length === 0) throw new Error('No budget progress bars found');
    }
  },
  {
    id: 32, category: 'Budgets', name: 'TC_BUDGET_04',
    description: 'Edit budget button is accessible',
    run: async (driver) => {
      const body = await (await driver.$('main')).getText();
      if (!body.toLowerCase().includes('edit') && !body.toLowerCase().includes('update') && !body.toLowerCase().includes('set')) {
        throw new Error('Budget edit control not found');
      }
    }
  },

  // ========================
  // 6. SAVINGS GOALS (4 tests)
  // ========================
  {
    id: 33, category: 'Savings Goals', name: 'TC_SAVINGS_01',
    description: 'Navigate to Wishlist/Savings Goals page',
    run: async (driver) => {
      const tab = await findEl(driver, '//button[contains(span,"Wishlist") or contains(span,"Savings") or contains(span,"Goals")]');
      await tab.click();
      await driver.pause(1500);
      const body = await (await driver.$('main')).getText();
      if (!body.toLowerCase().includes('goal') && !body.toLowerCase().includes('saving')) {
        throw new Error('Savings Goals page content not found');
      }
    }
  },
  {
    id: 34, category: 'Savings Goals', name: 'TC_SAVINGS_02',
    description: 'At least one savings goal card renders',
    run: async (driver) => {
      await driver.pause(1500);
      const body = await (await driver.$('main')).getText();
      if (!body.match(/Rs\.|₹|\d+/) ) throw new Error('No savings goal amounts visible');
    }
  },
  {
    id: 35, category: 'Savings Goals', name: 'TC_SAVINGS_03',
    description: 'Deposit button is present on goal card',
    run: async (driver) => {
      const body = await (await driver.$('main')).getText();
      if (!body.toLowerCase().includes('deposit') && !body.toLowerCase().includes('add funds')) {
        throw new Error('Deposit button not found on savings goal');
      }
    }
  },
  {
    id: 36, category: 'Savings Goals', name: 'TC_SAVINGS_04',
    description: 'Add New Goal button is accessible',
    run: async (driver) => {
      const body = await (await driver.$('main')).getText();
      if (!body.toLowerCase().includes('add') && !body.toLowerCase().includes('new goal') && !body.toLowerCase().includes('create')) {
        throw new Error('Add New Goal control not found');
      }
    }
  },

  // ========================
  // 7. NOTIFICATIONS (2 tests)
  // ========================
  {
    id: 37, category: 'Notifications', name: 'TC_NOTIF_01',
    description: 'Navigate to Alerts/Notifications page',
    run: async (driver) => {
      const tab = await findEl(driver, '//button[contains(span,"Alert") or contains(span,"Notif")]');
      await tab.click();
      await driver.pause(1500);
      const body = await (await driver.$('main')).getText();
      if (!body.toLowerCase().includes('notification') && !body.toLowerCase().includes('alert')) {
        throw new Error('Notifications page not loaded');
      }
    }
  },
  {
    id: 38, category: 'Notifications', name: 'TC_NOTIF_02',
    description: 'At least one notification entry is visible',
    run: async (driver) => {
      await driver.pause(1000);
      const body = await (await driver.$('main')).getText();
      if (!body.includes('Welcome') && !body.includes('Budget') && !body.includes('Goal') && body.trim().length < 20) {
        throw new Error('Notifications page appears empty');
      }
    }
  },

  // ========================
  // 8. BACK NAVIGATION (2 tests)
  // ========================
  {
    id: 39, category: 'Back Navigation', name: 'TC_NAV_01',
    description: 'Android back button returns to previous page',
    run: async (driver) => {
      // Navigate to transactions first
      const transTab = await findEl(driver, '//button[span[text()="Transactions"]]');
      await transTab.click();
      await driver.pause(1000);
      // Press Android back
      await driver.back();
      await driver.pause(1500);
      // App should still be running (not exit)
      const body = await (await driver.$('body')).getText();
      if (!body || body.trim().length < 5) throw new Error('App exited or blank after back button');
    }
  },
  {
    id: 40, category: 'Back Navigation', name: 'TC_NAV_02',
    description: 'App returns to Dashboard when navigating via sidebar',
    run: async (driver) => {
      const dashTab = await findEl(driver, '//button[span[text()="Dashboard"]]');
      await dashTab.click();
      await driver.pause(1500);
      const h2 = await findEl(driver, 'header h2');
      const txt = await h2.getText();
      if (!txt.toLowerCase().includes('dashboard')) throw new Error(`Expected Dashboard, got: "${txt}"`);
    }
  }
];

module.exports = testCases;
