import ExcelJS from 'exceljs';

export const exportExpenseToExcel = async (
  filteredExpenses,
  totalExpense,
  selectedDate
) => {
  try {
    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Expense Report');

    // Set worksheet properties
    worksheet.properties.defaultRowHeight = 20;

    // Define headers for expense table (matching the ExpenseTable component)
    const headers = ['Payee Name', 'Purpose', 'Category', 'Department', 'Amount'];

    // Calculate the last column letter based on actual header count
    const lastColumnLetter = String.fromCharCode(64 + headers.length);

    // Add title
    const titleRow = worksheet.addRow(['']);
    const titleCell = titleRow.getCell(1);
    titleCell.value = 'PUREHEALTH DIAGNOSTIC CENTER';
    titleCell.font = { bold: true, size: 18, color: { argb: '000000' } };
    titleCell.alignment = { horizontal: 'center' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'E0E0E0' }
    };
    worksheet.mergeCells(`A1:${lastColumnLetter}1`);

    // Add date
    const dateRow = worksheet.addRow(['']);
    const dateCell = dateRow.getCell(1);
    dateCell.value = `Expense Report - ${selectedDate.toLocaleDateString()}`;
    dateCell.font = { bold: true, size: 14, color: { argb: '000000' } };
    dateCell.alignment = { horizontal: 'center' };
    dateCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'F5F5F5' }
    };
    worksheet.mergeCells(`A2:${lastColumnLetter}2`);

    // Add empty row
    worksheet.addRow([]);

    // Create header row with exact column count and precise formatting
    const headerRow = worksheet.getRow(worksheet.rowCount + 1);
    for (let i = 0; i < headers.length; i++) {
      const cell = headerRow.getCell(i + 1);
      cell.value = headers[i];
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '166534' } // Green color
      };
      cell.alignment = { horizontal: 'center' };
    }
    headerRow.commit();

    // Add expense data
    const activeExpenses = filteredExpenses.filter(expense => expense.status !== 'cancelled');
    
    activeExpenses.forEach((expense) => {
      // Check if expense has multiple ExpenseItems
      if (expense.ExpenseItems && expense.ExpenseItems.length > 0) {
        // Export each expense item as a separate row
        expense.ExpenseItems.forEach((item) => {
          const rowData = new Array(headers.length).fill('');
          
          // Map data according to correct header order: Payee Name, Purpose, Category, Department, Amount
          rowData[0] = `${expense.firstName || ''} ${expense.lastName || ''}`.trim() || 'N/A'; // Payee Name
          rowData[1] = item.purpose || 'N/A'; // Purpose
          rowData[2] = item.Category?.name || 'No Category'; // Category
          rowData[3] = expense.Department?.name || expense.Department?.departmentName || 'N/A'; // Department
          rowData[4] = parseFloat(item.amount || 0); // Amount

          // Add row with exact positioning
          const dataRow = worksheet.getRow(worksheet.rowCount + 1);
          for (let i = 0; i < headers.length; i++) {
            dataRow.getCell(i + 1).value = rowData[i];
          }
          dataRow.commit();
          
          // Format amount column (last column)
          if (typeof rowData[4] === 'number') {
            dataRow.getCell(5).numFmt = '#,##0.00';
          }
        });
      } else {
        // Single expense item or no items
        const rowData = new Array(headers.length).fill('');
        
        // Map data according to correct header order: Payee Name, Purpose, Category, Department, Amount
        rowData[0] = `${expense.firstName || ''} ${expense.lastName || ''}`.trim() || 'N/A'; // Payee Name
        rowData[1] = expense.purpose || expense.description || 'N/A'; // Purpose
        rowData[2] = expense.Category?.name || 'No Category'; // Category
        rowData[3] = expense.Department?.name || expense.Department?.departmentName || 'N/A'; // Department
        rowData[4] = parseFloat(expense.totalAmount || expense.amount || 0); // Amount

        // Add row with exact positioning
        const dataRow = worksheet.getRow(worksheet.rowCount + 1);
        for (let i = 0; i < headers.length; i++) {
          dataRow.getCell(i + 1).value = rowData[i];
        }
        dataRow.commit();
        
        // Format amount column (last column)
        if (typeof rowData[4] === 'number') {
          dataRow.getCell(5).numFmt = '#,##0.00';
        }
      }
    });

    // Calculate data table boundaries
    const dataStartRow = 4; // Header row
    // Count total rows: each expense item becomes a row
    let totalDataRows = 0;
    activeExpenses.forEach(expense => {
      if (expense.ExpenseItems && expense.ExpenseItems.length > 0) {
        totalDataRows += expense.ExpenseItems.length;
      } else {
        totalDataRows += 1;
      }
    });
    const dataEndRow = dataStartRow + totalDataRows;
    
    // Add totals row
    const totalsRowData = new Array(headers.length).fill('');
    totalsRowData[0] = '';
    totalsRowData[1] = '';
    totalsRowData[2] = '';
    totalsRowData[3] = 'TOTAL:'; // Department column
    totalsRowData[4] = totalExpense; // Amount column

    // Create totals row with exact positioning
    const totalsRow = worksheet.getRow(worksheet.rowCount + 1);
    for (let i = 0; i < headers.length; i++) {
      const cell = totalsRow.getCell(i + 1);
      cell.value = totalsRowData[i];
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'DCF5DC' } // Light green
      };
      
      // Format amount column (last column)
      if (i === 4 && typeof totalsRowData[i] === 'number') {
        cell.numFmt = '#,##0.00';
      }
    }
    totalsRow.commit();
    
    const finalDataEndRow = dataEndRow + 1;

    // Set column widths to prevent overflow
    for (let i = 0; i < headers.length; i++) {
      let width;
      if (i === 0) {
        width = 20; // Payee Name column
      } else if (i === 1) {
        width = 25; // Purpose column
      } else if (i === 2) {
        width = 15; // Category column
      } else if (i === 3) {
        width = 15; // Department column
      } else {
        width = 12; // Amount column
      }
      
      worksheet.getColumn(i + 1).width = width;
    }

    // Clear any formatting beyond our table boundaries
    const lastCol = headers.length;
    for (let row = 1; row <= finalDataEndRow + 10; row++) {
      for (let col = lastCol + 1; col <= lastCol + 20; col++) {
        const cell = worksheet.getCell(row, col);
        cell.value = null;
        cell.fill = { type: 'pattern', pattern: 'none' };
        cell.font = {};
        cell.border = {};
      }
    }
    
    // Add borders to title and date rows
    for (let row = 1; row <= 2; row++) {
      for (let col = 1; col <= lastCol; col++) {
        const cell = worksheet.getCell(row, col);
        cell.border = {
          top: { style: 'medium' },
          left: { style: 'medium' },
          bottom: { style: 'medium' },
          right: { style: 'medium' }
        };
      }
    }
    
    // Add borders to main data table
    for (let row = dataStartRow; row <= finalDataEndRow; row++) {
      for (let col = 1; col <= lastCol; col++) {
        const cell = worksheet.getCell(row, col);
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Create and download file
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Expense_Report_${selectedDate.toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error exporting expense to Excel:', error);
    throw error;
  }
};
