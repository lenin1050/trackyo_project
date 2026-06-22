const ExcelJS = require('exceljs');

const xlsxPath = 'c:\\Users\\noname\\Downloads\\E2E_Test_Report_PancreaScan_2026-06-09T16-22-48.xlsx';

async function inspect() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(xlsxPath);
  
  const summarySheet = workbook.getWorksheet('Summary');
  console.log(`Summary Sheet Rows: ${summarySheet.rowCount}, Columns: ${summarySheet.actualColumnCount}`);
  
  for (let i = 1; i <= summarySheet.rowCount; i++) {
    const row = summarySheet.getRow(i);
    const cells = [];
    for (let j = 1; j <= summarySheet.actualColumnCount; j++) {
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
    console.log(`Summary Row ${i}:`, cells.map(c => `Col ${c.col}: val=${JSON.stringify(c.val)} bg=${c.bg} fg=${c.fg} bold=${c.bold} size=${c.size}`).join(' | '));
  }
}

inspect().catch(err => {
  console.error('Inspection error:', err);
});
