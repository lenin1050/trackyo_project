// ============================================================
// Trackyo Appium E2E — Main Test Runner
// Connects to physical Android device via USB (ADB)
// Installs APK, runs 40 test cases, generates Excel report
// ============================================================

const { remote } = require('webdriverio');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');

const testCases = require('./test-cases');

// ---- CONFIG ----
const ADB_PATH = 'C:\\Users\\noname\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe';
const APK_PATH = path.resolve('C:\\Users\\noname\\Downloads\\trackyo_website\\Trackyo 1.0\\android\\app-release.apk');
const APP_PACKAGE = 'com.example.tracko';
const APP_ACTIVITY = 'com.example.tracko.MainActivity';
const APPIUM_HOST = '127.0.0.1';
const APPIUM_PORT = 4723;

// Test credentials — update these if you have real credentials
const TEST_CREDENTIALS = {
  email: 'rahul@trackyo.in',
  password: 'password123',
  username: 'Rahul Sharma'
};

// Output path
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
const OUTPUT_PATH = path.join(
  'C:\\Users\\noname\\Downloads\\trackyo_website\\Vulnerability Test Results',
  `Trackyo_Appium_E2E_Report_${timestamp}.xlsx`
);

// ---- LOGGING ----
const logs = [];
function log(level, msg) {
  const ts = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const line = `[${ts}] [${level.padEnd(5)}] ${msg}`;
  console.log(line);
  logs.push({ timestamp: new Date(), level, message: msg });
}

// ---- SWITCH TO WEBVIEW ----
async function switchToWebView(driver) {
  log('INFO', 'Waiting for WebView context...');
  for (let i = 0; i < 15; i++) {
    const contexts = await driver.getContexts();
    log('DEBUG', `Contexts: ${JSON.stringify(contexts)}`);
    const webCtx = contexts.find(c =>
      c.includes('WEBVIEW') || c.includes('CHROMIUM')
    );
    if (webCtx) {
      await driver.switchContext(webCtx);
      log('INFO', `Switched to WebView context: ${webCtx}`);
      return webCtx;
    }
    await driver.pause(1000);
  }
  throw new Error('WebView context never appeared. App may be crashed or loading too slowly.');
}

// ---- EXCEL REPORT GENERATOR ----
async function generateExcelReport(results, startTime, endTime) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Trackyo Appium E2E Runner';
  wb.created = new Date();

  // ---- SUMMARY SHEET ----
  const sum = wb.addWorksheet('Summary');

  const totalDuration = ((endTime - startTime) / 1000).toFixed(1);
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  const skipped = results.filter(r => r.status === 'SKIPPED').length;
  const total = results.length;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

  // Title
  sum.mergeCells('A1:F1');
  const titleCell = sum.getCell('A1');
  titleCell.value = 'TRACKYO ANDROID APP — APPIUM E2E TEST REPORT';
  titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sum.getRow(1).height = 35;

  // Meta info
  const metaRows = [
    ['Test Environment', 'Physical Android Device (USB via ADB)'],
    ['APK Package', APP_PACKAGE],
    ['APK Path', APK_PATH],
    ['Test Framework', 'Appium v2 + WebdriverIO v8 (UIAutomator2 + ChromeDriver)'],
    ['Test Started', startTime.toLocaleString('en-IN')],
    ['Test Ended', endTime.toLocaleString('en-IN')],
    ['Total Duration', `${totalDuration}s`],
    ['Login Credentials', TEST_CREDENTIALS.email],
  ];
  let row = 3;
  for (const [k, v] of metaRows) {
    sum.getCell(`A${row}`).value = k;
    sum.getCell(`A${row}`).font = { bold: true };
    sum.getCell(`B${row}`).value = v;
    sum.mergeCells(`B${row}:F${row}`);
    row++;
  }

  // Stats block
  row += 1;
  const statsHeader = sum.getRow(row);
  ['Metric', 'Value', '', '', '', ''].forEach((h, i) => {
    const cell = sum.getCell(row, i + 1);
    cell.value = h;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C3E50' } };
    cell.alignment = { horizontal: 'center' };
  });
  row++;

  const statData = [
    ['Total Test Cases', total, 'FF2C3E50'],
    ['PASSED', passed, 'FF27AE60'],
    ['FAILED', failed, 'FFE74C3C'],
    ['SKIPPED / ERROR', skipped, 'FFF39C12'],
    ['Pass Rate', `${passRate}%`, passed === total ? 'FF27AE60' : 'FFFF6B00'],
  ];
  for (const [label, value, color] of statData) {
    sum.getCell(row, 1).value = label;
    sum.getCell(row, 1).font = { bold: true };
    sum.getCell(row, 2).value = value;
    sum.getCell(row, 2).font = { bold: true, color: { argb: color } };
    sum.getCell(row, 2).alignment = { horizontal: 'center' };
    row++;
  }

  sum.getColumn(1).width = 30;
  sum.getColumn(2).width = 50;

  // ---- CATEGORY BREAKDOWN SHEET ----
  const catSheet = wb.addWorksheet('By Category');
  const catHeaders = ['Category', 'Total', 'Passed', 'Failed', 'Skipped', 'Pass Rate'];
  const catHdrRow = catSheet.addRow(catHeaders);
  catHdrRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
    cell.alignment = { horizontal: 'center' };
    cell.border = { bottom: { style: 'thin' } };
  });

  const categories = [...new Set(results.map(r => r.category))];
  for (const cat of categories) {
    const catResults = results.filter(r => r.category === cat);
    const catPassed = catResults.filter(r => r.status === 'PASSED').length;
    const catFailed = catResults.filter(r => r.status === 'FAILED').length;
    const catSkipped = catResults.filter(r => r.status === 'SKIPPED').length;
    const catTotal = catResults.length;
    const catPassRate = catTotal > 0 ? `${((catPassed / catTotal) * 100).toFixed(0)}%` : 'N/A';
    const catRow = catSheet.addRow([cat, catTotal, catPassed, catFailed, catSkipped, catPassRate]);
    catRow.eachCell(cell => { cell.alignment = { horizontal: 'center' }; });
    // Color row by pass rate
    if (catFailed === 0) {
      catRow.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCFFCC' } }; });
    } else if (catPassed === 0) {
      catRow.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFCCCC' } }; });
    } else {
      catRow.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFCC' } }; });
    }
  }
  [20, 10, 10, 10, 10, 12].forEach((w, i) => { catSheet.getColumn(i + 1).width = w; });

  // ---- ALL TEST CASES SHEET ----
  const tcSheet = wb.addWorksheet('Test Cases');
  const tcHeaders = ['#', 'Test ID', 'Category', 'Description', 'Status', 'Duration (ms)', 'Error / Remarks'];
  const tcHdrRow = tcSheet.addRow(tcHeaders);
  tcHdrRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });
  tcSheet.getRow(1).height = 28;

  const statusColors = { PASSED: 'FFCCFFCC', FAILED: 'FFFFCCCC', SKIPPED: 'FFFFFFCC', ERROR: 'FFFFEECC' };
  const statusFontColors = { PASSED: 'FF1A7F2E', FAILED: 'FFCC0000', SKIPPED: 'FF996600', ERROR: 'FF994400' };

  results.forEach((r, idx) => {
    const tcRow = tcSheet.addRow([
      idx + 1,
      r.name,
      r.category,
      r.description,
      r.status,
      r.duration,
      r.error ? r.error.substring(0, 400) : '—'
    ]);
    const bg = statusColors[r.status] || 'FFFFFFFF';
    tcRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.alignment = { wrapText: true, vertical: 'top' };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } } };
    });
    // Bold + colored status cell
    const statusCell = tcRow.getCell(5);
    statusCell.font = { bold: true, color: { argb: statusFontColors[r.status] || 'FF000000' } };
    statusCell.alignment = { horizontal: 'center', vertical: 'middle' };
    tcSheet.getRow(idx + 2).height = 45;
  });

  // Freeze header + autofilter
  tcSheet.views = [{ state: 'frozen', ySplit: 1 }];
  tcSheet.autoFilter = { from: 'A1', to: 'G1' };

  [5, 18, 22, 55, 12, 16, 55].forEach((w, i) => { tcSheet.getColumn(i + 1).width = w; });

  // ---- FAILED TESTS SHEET ----
  const failedResults = results.filter(r => r.status !== 'PASSED');
  if (failedResults.length > 0) {
    const failSheet = wb.addWorksheet('Failed & Skipped');
    const failHeaders = ['#', 'Test ID', 'Category', 'Description', 'Status', 'Error Details'];
    const failHdrRow = failSheet.addRow(failHeaders);
    failHdrRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCC0000' } };
      cell.alignment = { horizontal: 'center' };
    });
    failedResults.forEach((r, idx) => {
      const fRow = failSheet.addRow([
        idx + 1, r.name, r.category, r.description, r.status,
        r.error ? r.error.substring(0, 800) : 'No error captured'
      ]);
      fRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF0F0' } };
        cell.alignment = { wrapText: true, vertical: 'top' };
      });
      failSheet.getRow(idx + 2).height = 60;
    });
    [5, 18, 22, 50, 12, 70].forEach((w, i) => { failSheet.getColumn(i + 1).width = w; });
    failSheet.views = [{ state: 'frozen', ySplit: 1 }];
  }

  // ---- LOG SHEET ----
  const logSheet = wb.addWorksheet('Execution Log');
  logSheet.addRow(['Timestamp', 'Level', 'Message']).eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C3E50' } };
  });
  logs.forEach(l => {
    logSheet.addRow([
      l.timestamp.toLocaleString('en-IN'),
      l.level,
      l.message
    ]);
  });
  [22, 10, 120].forEach((w, i) => { logSheet.getColumn(i + 1).width = w; });

  // Save
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  await wb.xlsx.writeFile(OUTPUT_PATH);
  log('INFO', `Excel report saved: ${OUTPUT_PATH}`);
  return OUTPUT_PATH;
}

// ---- MAIN ----
async function main() {
  const startTime = new Date();
  const results = [];
  let driver = null;

  log('INFO', '====================================================');
  log('INFO', '  Trackyo Android App — Appium E2E Test Suite');
  log('INFO', '====================================================');
  log('INFO', `APK: ${APK_PATH}`);
  log('INFO', `Package: ${APP_PACKAGE}`);
  log('INFO', `Appium Server: ${APPIUM_HOST}:${APPIUM_PORT}`);
  log('INFO', `Total test cases: ${testCases.length}`);

  // Context shared across tests (login state, credentials etc)
  const ctx = {
    isLoggedIn: false,
    email: TEST_CREDENTIALS.email,
    password: TEST_CREDENTIALS.password,
    username: TEST_CREDENTIALS.username,
  };

  try {
    log('INFO', 'Connecting to Appium server...');
    driver = await remote({
      hostname: APPIUM_HOST,
      port: APPIUM_PORT,
      logLevel: 'warn',
      capabilities: {
        platformName: 'Android',
        'appium:automationName': 'UiAutomator2',
        // 'appium:app': APK_PATH,
        'appium:appPackage': APP_PACKAGE,
        'appium:appActivity': APP_ACTIVITY,
        'appium:noReset': false,
        'appium:fullReset': false,
        'appium:autoGrantPermissions': true,
        'appium:chromedriverAutodownload': true,
        'appium:newCommandTimeout': 120,
        'appium:androidInstallTimeout': 90000,
        'appium:adbExecTimeout': 60000,
      }
    });

    log('INFO', 'Appium session established. Waiting for app to load...');
    await driver.pause(4000);

    // Switch to WebView context (Trackyo is a WebView app)
    await switchToWebView(driver);
    await driver.pause(3000);

    log('INFO', 'WebView ready. Starting test execution...');
    log('INFO', '----------------------------------------------------');

    // Execute each test case
    for (const tc of testCases) {
      const tStart = Date.now();
      log('INFO', `[${tc.id.toString().padStart(2, '0')}/${testCases.length}] Running: [${tc.category}] ${tc.name}`);
      try {
        await tc.run(driver, ctx);
        const duration = Date.now() - tStart;
        results.push({
          id: tc.id,
          name: tc.name,
          category: tc.category,
          description: tc.description,
          status: 'PASSED',
          duration,
          error: null
        });
        log('INFO', `     ✓ PASSED (${(duration / 1000).toFixed(2)}s)`);
      } catch (err) {
        const duration = Date.now() - tStart;
        const errorMsg = err.message || String(err);
        results.push({
          id: tc.id,
          name: tc.name,
          category: tc.category,
          description: tc.description,
          status: 'FAILED',
          duration,
          error: errorMsg
        });
        log('ERROR', `     ✗ FAILED: ${errorMsg.substring(0, 150)}`);
        // Try to recover WebView context if lost
        try { await switchToWebView(driver); } catch {}
      }

      // Small pause between tests
      await driver.pause(500);
    }

  } catch (err) {
    log('ERROR', `Fatal runner error: ${err.message || String(err)}`);
    // If driver created but no tests ran, mark all as skipped
    if (results.length === 0) {
      for (const tc of testCases) {
        results.push({
          id: tc.id,
          name: tc.name,
          category: tc.category,
          description: tc.description,
          status: 'SKIPPED',
          duration: 0,
          error: `Suite aborted: ${err.message}`
        });
      }
    }
  } finally {
    if (driver) {
      log('INFO', 'Closing Appium session...');
      try { await driver.deleteSession(); } catch {}
    }

    // Summary
    const endTime = new Date();
    const passed = results.filter(r => r.status === 'PASSED').length;
    const failed = results.filter(r => r.status === 'FAILED').length;
    const skipped = results.filter(r => r.status === 'SKIPPED').length;
    const duration = ((endTime - startTime) / 1000).toFixed(1);

    log('INFO', '====================================================');
    log('INFO', `  TEST EXECUTION COMPLETE`);
    log('INFO', `  Total: ${results.length} | PASSED: ${passed} | FAILED: ${failed} | SKIPPED: ${skipped}`);
    log('INFO', `  Pass Rate: ${results.length > 0 ? ((passed / results.length) * 100).toFixed(1) : 0}%`);
    log('INFO', `  Duration: ${duration}s`);
    log('INFO', '====================================================');

    log('INFO', 'Generating Excel report...');
    try {
      const reportPath = await generateExcelReport(results, startTime, endTime);
      log('INFO', `Report: ${reportPath}`);
      console.log(`\n\n✅ REPORT SAVED TO:\n   ${reportPath}\n`);
    } catch (excelErr) {
      log('ERROR', `Failed to generate Excel: ${excelErr.message}`);
    }
  }
}

main();
