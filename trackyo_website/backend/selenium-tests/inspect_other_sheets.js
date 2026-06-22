const ExcelJS = require('exceljs');

const xlsxPath = 'c:\\Users\\noname\\Downloads\\E2E_Test_Report_PancreaScan_2026-06-09T16-22-48.xlsx';

async function inspect() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(xlsxPath);
  
  for (const sheetName of ['Passed Tests', 'Failed Tests', 'Execution Log']) {
    const sheet = workbook.getWorksheet(sheetName);
    console.log(`\n======================================================`);
    console.log(`SHEET: ${sheetName} (Rows: ${sheet.rowCount}, Columns: ${sheet.actualColumnCount})`);
    console.log(`======================================================`);
    for (let i = 1; i <= Math.min(sheet.rowCount, 4); i++) {
      const row = sheet.getRow(i);
      const cells = [];
      for (let j = 1; j <= sheet.actualColumnCount; j++) {
        const cell = row.getCell(j);
        cells.push({
          col: j,
          val: cell.value,
          bg: cell.fill && cell.fill.fgColor ? cell.fill.fgColor.argb : (cell.fill && cell.fill.color ? cell.fill.color.argb : null),
          fg: cell.font && cell.font.color ? cell.font.color.argb : null,
          bold: cell.font && cell.font.bold ? true : false
        });
      }
      console.log(`Row ${i}:`, cells.map(c => `Col ${c.col}: ${JSON.stringify(c.val)} (bg=${c.bg})`).join(' | '));
    }
  }
}

inspect().catch(err => {
  console.error('Inspection error:', err);
});
