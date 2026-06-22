const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { MongoMemoryServer } = require('mongodb-memory-server');

const testCases = require('./test-cases');
const { generateReport } = require('./report-generator');

// Output report filename
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
const outputFilename = `E2E_Test_Report_Trackyo_${timestamp}.xlsx`;

let outputDir = 'c:\\Users\\noname\\Downloads';
if (process.env.CI || !fs.existsSync(outputDir)) {
  outputDir = __dirname;
}
const outputPath = path.join(outputDir, outputFilename);

let mongodServer = null;
let backendProcess = null;
let frontendProcess = null;
let driver = null;

// Helpers to check if endpoints are active
function checkEndpoint(url, timeout = 15000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const interval = setInterval(() => {
      http.get(url, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          clearInterval(interval);
          resolve(true);
        }
      }).on('error', () => {
        if (Date.now() - start > timeout) {
          clearInterval(interval);
          resolve(false);
        }
      });
    }, 500);
  });
}

// Runs a shell command synchronously as a promise
function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { cwd, shell: true });
    process.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command ${command} exited with code ${code}`));
    });
  });
}

async function main() {
  const startTime = new Date();
  const logs = [];
  const results = [];

  const logMessage = (level, message) => {
    const now = new Date();
    logs.push({ timestamp: now, level, message });
    console.log(`[${now.toISOString().replace('T', ' ').substring(0, 19)}] [${level}] ${message}`);
  };

  logMessage('INFO', 'Starting E2E Test Suite for Trackyo AI Expense Tracker');
  logMessage('INFO', `Seeding database and launching local test environment`);

  try {
    // 1. Launch In-Memory MongoDB Server on 27017
    logMessage('INFO', 'Spinning up virtual MongoDB Memory Server on port 27017...');
    mongodServer = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbName: 'trackyo'
      }
    });
    logMessage('INFO', 'Virtual MongoDB started successfully!');

    // 2. Seed Mock Database Data
    logMessage('INFO', 'Running utils/seedData.js...');
    await runCommand('node', ['utils/seedData.js'], path.join(__dirname, '..'));
    logMessage('INFO', 'Mock database tables successfully seeded!');

    // 3. Start Backend Express Server
    logMessage('INFO', 'Launching Trackyo Backend Server (Port 5000)...');
    backendProcess = spawn('node', ['server.js'], {
      cwd: path.join(__dirname, '..'),
      shell: true,
      env: { ...process.env, PORT: 5000, MONGODB_URI: 'mongodb://127.0.0.1:27017/trackyo' }
    });
    
    // Wait for backend to be online
    const backendOnline = await checkEndpoint('http://localhost:5000/');
    if (!backendOnline) {
      throw new Error('Backend failed to start or respond on port 5000 within timeout.');
    }
    logMessage('INFO', 'Backend server is operational!');

    // 4. Start Frontend React/Vite Client
    logMessage('INFO', 'Launching Trackyo Frontend Vite Server (Port 5173)...');
    frontendProcess = spawn('npx', ['vite', '--port', '5173', '--strictPort'], {
      cwd: path.join(__dirname, '..', '..', 'frontend'),
      shell: true
    });

    // Wait for frontend to be online
    const frontendOnline = await checkEndpoint('http://localhost:5173/');
    if (!frontendOnline) {
      throw new Error('Frontend failed to start or respond on port 5173 within timeout.');
    }
    logMessage('INFO', 'Frontend web application is operational!');

    // 5. Initialize Selenium Chrome WebDriver in headless mode
    logMessage('INFO', 'Initializing Selenium Chrome WebDriver (Headless mode)...');
    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--disable-gpu');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--window-size=1280,800');

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
    await driver.manage().window().setRect({ width: 1280, height: 800 });

    logMessage('INFO', 'Selenium Chrome session established. Navigating to http://localhost:5173/');
    await driver.get('http://localhost:5173/');

    // 6. Run all 105 Test Cases
    const context = {
      isLoggedIn: false,
      newEmail: null,
      newPassword: null
    };

    logMessage('INFO', `Starting test execution of ${testCases.length} E2E cases...`);

    for (const testCase of testCases) {
      const tStart = Date.now();
      logMessage('INFO', `Running test: [${testCase.category}] ${testCase.name}`);
      try {
        await testCase.run(driver, context);
        const tDuration = Date.now() - tStart;
        results.push({
          id: testCase.id,
          category: testCase.category,
          name: testCase.name,
          description: testCase.description,
          status: 'PASSED',
          duration: tDuration,
          error: null
        });
        logMessage('INFO', `[${testCase.category}] ${testCase.name} -> PASSED in ${(tDuration/1000).toFixed(2)}s`);
      } catch (err) {
        const tDuration = Date.now() - tStart;
        results.push({
          id: testCase.id,
          category: testCase.category,
          name: testCase.name,
          description: testCase.description,
          status: 'FAILED',
          duration: tDuration,
          error: err.stack || err.message
        });
        logMessage('ERROR', `[${testCase.category}] ${testCase.name} -> FAILED: ${err.message}`);
      }
    }

    logMessage('INFO', 'E2E Test Execution finished successfully.');

  } catch (error) {
    logMessage('ERROR', `E2E suite encountered fatal runner error: ${error.stack || error.message}`);
  } finally {
    // 7. Tear down processes and server sessions cleanly
    logMessage('INFO', 'Tearing down test environment...');
    if (driver) {
      try { await driver.quit(); } catch (e) {}
    }
    if (backendProcess) {
      try { backendProcess.kill('SIGINT'); } catch (e) {}
    }
    if (frontendProcess) {
      try { frontendProcess.kill('SIGINT'); } catch (e) {}
    }
    if (mongodServer) {
      try { await mongodServer.stop(); } catch (e) {}
    }
    logMessage('INFO', 'Processes shut down successfully.');

    // 8. Generate Excel report
    const endTime = new Date();
    logMessage('INFO', 'Generating E2E Excel Report...');
    try {
      await generateReport(results, logs, startTime, endTime, outputPath);
      logMessage('INFO', `E2E Excel report saved to: ${outputPath}`);
    } catch (excelError) {
      console.error('Failed to create report: ', excelError);
    }
  }
}

main();
