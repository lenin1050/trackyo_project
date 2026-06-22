const ExcelJS = require('exceljs');
const path = require('path');

async function generateReport(results, logs, startTime, endTime, outputPath) {
  const workbook = new ExcelJS.Workbook();
  
  const totalTests = results.length;
  const passedTests = results.filter(r => r.status === 'PASSED');
  const failedTests = results.filter(r => r.status === 'FAILED');
  const passRate = totalTests > 0 ? parseFloat(((passedTests.length / totalTests) * 100).toFixed(2)) : 0;
  const durationSec = parseFloat(((new Date(endTime) - new Date(startTime)) / 1000).toFixed(2));

  // Styles Definitions
  const headerFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1F3864' } // Dark Blue
  };
  const headerFont = {
    name: 'Arial',
    color: { argb: 'FFFFFFFF' }, // White
    bold: true,
    size: 11
  };
  const passFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFC6EFCE' } // Light Green
  };
  const failFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFC7CE' } // Light Red
  };
  const cellFont = {
    name: 'Arial',
    size: 11
  };
  const border = {
    top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
    left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
    bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
    right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
  };
  const alignmentCenter = { vertical: 'middle', horizontal: 'center' };
  const alignmentLeft = { vertical: 'middle', horizontal: 'left' };

  // Helper to style rows
  function styleRow(row, fill, font, alignment = alignmentLeft) {
    row.eachCell((cell) => {
      cell.fill = fill;
      cell.font = font;
      cell.border = border;
      cell.alignment = alignment;
    });
  }

  // ==========================================
  // 1. SUMMARY SHEET
  // ==========================================
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.views = [{ showGridLines: true }];
  summarySheet.columns = [
    { header: 'Test Suite', key: 'suite', width: 40 },
    { header: 'Total Tests', key: 'total', width: 15 },
    { header: 'Passed', key: 'passed', width: 15 },
    { header: 'Failed', key: 'failed', width: 15 },
    { header: 'Pass Rate %', key: 'rate', width: 15 },
    { header: 'Duration (sec)', key: 'duration', width: 18 },
    { header: 'Start Time', key: 'start', width: 30 },
    { header: 'End Time', key: 'end', width: 30 }
  ];

  summarySheet.addRow({
    suite: 'Trackyo Web App — Full E2E Workflow',
    total: totalTests,
    passed: passedTests.length,
    failed: failedTests.length,
    rate: passRate,
    duration: durationSec,
    start: startTime.toISOString(),
    end: endTime.toISOString()
  });

  styleRow(summarySheet.getRow(1), headerFill, headerFont, alignmentCenter);
  const row2 = summarySheet.getRow(2);
  styleRow(row2, { type: 'pattern', pattern: 'none' }, cellFont, alignmentCenter);
  row2.getCell(1).alignment = alignmentLeft; // Test Suite name left-aligned

  // ==========================================
  // 2. PASSED TESTS SHEET
  // ==========================================
  const passedSheet = workbook.addWorksheet('Passed Tests');
  passedSheet.views = [{ showGridLines: true }];
  passedSheet.columns = [
    { header: 'No.', key: 'no', width: 8 },
    { header: 'Category', key: 'category', width: 25 },
    { header: 'Test Name', key: 'name', width: 45 },
    { header: 'Time (sec)', key: 'time', width: 15 },
    { header: 'Status', key: 'status', width: 15 }
  ];
  styleRow(passedSheet.getRow(1), headerFill, headerFont, alignmentCenter);

  passedTests.forEach((t, index) => {
    const r = passedSheet.addRow({
      no: index + 1,
      category: t.category,
      name: t.name,
      time: parseFloat((t.duration / 1000).toFixed(2)),
      status: 'PASSED'
    });
    styleRow(r, passFill, cellFont, alignmentLeft);
    r.getCell(1).alignment = alignmentCenter;
    r.getCell(4).alignment = alignmentCenter;
    r.getCell(5).alignment = alignmentCenter;
  });

  // ==========================================
  // 3. FAILED TESTS SHEET
  // ==========================================
  const failedSheet = workbook.addWorksheet('Failed Tests');
  failedSheet.views = [{ showGridLines: true }];
  failedSheet.columns = [
    { header: 'No.', key: 'no', width: 8 },
    { header: 'Category', key: 'category', width: 25 },
    { header: 'Test Name', key: 'name', width: 45 },
    { header: 'Error', key: 'error', width: 70 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Timestamp', key: 'timestamp', width: 25 }
  ];
  styleRow(failedSheet.getRow(1), headerFill, headerFont, alignmentCenter);

  failedTests.forEach((t, index) => {
    const r = failedSheet.addRow({
      no: index + 1,
      category: t.category,
      name: t.name,
      error: t.error || 'Test failed.',
      status: 'FAILED',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });
    styleRow(r, failFill, cellFont, alignmentLeft);
    r.getCell(1).alignment = alignmentCenter;
    r.getCell(5).alignment = alignmentCenter;
    r.getCell(6).alignment = alignmentCenter;
  });

  // ==========================================
  // 4. EXECUTION LOG SHEET
  // ==========================================
  const logSheet = workbook.addWorksheet('Execution Log');
  logSheet.views = [{ showGridLines: true }];
  logSheet.columns = [
    { header: 'Timestamp', key: 'timestamp', width: 25 },
    { header: 'Level', key: 'level', width: 12 },
    { header: 'Message', key: 'message', width: 110 }
  ];
  styleRow(logSheet.getRow(1), headerFill, headerFont, alignmentCenter);

  logs.forEach((log) => {
    const r = logSheet.addRow({
      timestamp: log.timestamp.toISOString().replace('T', ' ').substring(0, 19),
      level: log.level,
      message: log.message
    });
    const fill = log.level === 'ERROR' ? failFill : passFill;
    styleRow(r, fill, cellFont, alignmentLeft);
    r.getCell(1).alignment = alignmentCenter;
    r.getCell(2).alignment = alignmentCenter;
  });

  // ==========================================
  // 5. TEST DETAILS SHEET
  // ==========================================
  const detailsSheet = workbook.addWorksheet('Test Details');
  detailsSheet.views = [{ showGridLines: true }];
  detailsSheet.columns = [
    { header: 'No.', key: 'no', width: 8 },
    { header: 'Category', key: 'category', width: 25 },
    { header: 'Test Name', key: 'name', width: 45 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Error Details', key: 'error', width: 70 }
  ];
  styleRow(detailsSheet.getRow(1), headerFill, headerFont, alignmentCenter);

  results.forEach((t, index) => {
    const r = detailsSheet.addRow({
      no: index + 1,
      category: t.category,
      name: t.name,
      status: t.status,
      error: t.error || 'None — test passed successfully.'
    });
    const fill = t.status === 'PASSED' ? passFill : failFill;
    styleRow(r, fill, cellFont, alignmentLeft);
    r.getCell(1).alignment = alignmentCenter;
    r.getCell(4).alignment = alignmentCenter;
  });

  // Save Workbook
  await workbook.xlsx.writeFile(outputPath);
  console.log(`E2E Excel Report generated successfully at: ${outputPath}`);
}

module.exports = { generateReport };
