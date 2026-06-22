const ExcelJS = require('exceljs');
const path = require('path');

const xlsxPath = 'c:\\Users\\noname\\Downloads\\E2E_Test_Report_PancreaScan_2026-06-09T16-22-48.xlsx';

async function inspect() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(xlsxPath);
  
  console.log('Sheet Names:', workbook.worksheets.map(w => w.name));
  
  for (const sheetName of ['Summary', 'Passed Tests', 'Failed Tests', 'Execution Log', 'Test Details']) {
    const sheet = workbook.getWorksheet(sheetName);
    if (!sheet) {
      console.log(`\nSheet ${sheetName} not found!`);
      continue;
    }
    console.log(`\n======================================================`);
    console.log(`SHEET: ${sheetName} (Rows: ${sheet.rowCount}, Columns: ${sheet.actualColumnCount})`);
    console.log(`======================================================`);
    
    // Print first 8 rows
    for (let i = 1; i <= Math.min(sheet.rowCount, 8); i++) {
      const row = sheet.getRow(i);
      const cells = [];
      for (let j = 1; j <= sheet.actualColumnCount; j++) {
        const cell = row.getCell(j);
        cells.push({
          col: j,
          val: cell.value,
          bg: cell.fill && cell.fill.fgColor ? cell.fill.fgColor.argb : (cell.fill && cell.fill.color ? cell.fill.color.argb : null),
          fg: cell.font && cell.font.color ? cell.font.color.argb : null,
          bold: cell.font && cell.font.bold ? true : false,
          size: cell.font && cell.font.size ? cell.font.size : null
        });
      }
      console.log(`Row ${i}:`, cells.map(c => `Col ${c.col}: ${JSON.stringify(c.val)} (bg=${c.bg}, fg=${c.fg}, bold=${c.bold}, size=${c.size})`).join(' | '));
    }
  }
}

inspect().catch(err => {
  console.error('Inspection error:', err);
});
