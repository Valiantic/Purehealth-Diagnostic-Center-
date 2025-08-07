import ExcelJS from 'exceljs';

export const exportIncomeToExcel = async (
  filteredTransactions,
  departmentsWithValues,
  departmentTotals,
  totalGross,
  totalGCash,
  totalRefunds,
  selectedDate
) => {
  try {
    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Income Report');

    // Set worksheet properties
    worksheet.properties.defaultRowHeight = 20;

    // Create header row first to get correct column count
    const headers = ['OR#', 'Patient Name'];
    departmentsWithValues.forEach(dept => {
      headers.push(dept.departmentName + (dept.status !== 'active' ? ' (archived)' : ''));
    });
    headers.push('Gross', 'Referrer');

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
    dateCell.value = `Income Report - ${selectedDate.toLocaleDateString()}`;
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

    // Add transaction data
    const activeTransactions = filteredTransactions.filter(t => t.status !== 'cancelled');
    
    activeTransactions.forEach(transaction => {
      // Create array with exact header length, fill with empty strings first
      const rowData = new Array(headers.length).fill('');
      
      // Add OR# and Patient Name
      rowData[0] = transaction.id;
      rowData[1] = transaction.name;

      // Add department amounts starting from index 2
      let colIndex = 2;
      departmentsWithValues.forEach(dept => {
        if (colIndex < headers.length - 2) { // Ensure we don't exceed boundaries
          const deptData = transaction.departmentRevenues[dept.departmentId];
          const amount = deptData && deptData.amount > 0 ? deptData.amount : 0;
          rowData[colIndex] = amount;
          colIndex++;
        }
      });

      // Add gross (second to last column) and referrer (last column)
      if (headers.length >= 2) {
        rowData[headers.length - 2] = transaction.grossDeposit;
        rowData[headers.length - 1] = transaction.referrer || 'Out Patient';
      }

      // Add only the exact number of cells needed - don't use addRow with array
      const dataRow = worksheet.getRow(worksheet.rowCount + 1);
      for (let i = 0; i < headers.length; i++) {
        dataRow.getCell(i + 1).value = rowData[i];
      }
      dataRow.commit();
      
      // Format currency columns (skip OR# and Patient Name, and Referrer columns)
      for (let i = 2; i < headers.length - 1; i++) {
        if (typeof rowData[i] === 'number') {
          dataRow.getCell(i + 1).numFmt = '#,##0.00';
        }
      }
    });

    // Calculate data table boundaries for later use
    const dataStartRow = 4; // Header row
    const dataEndRow = dataStartRow + activeTransactions.length; // Just the transaction rows, totals will be added separately
    
    // Add totals row after calculating the correct end row
    // Create array with exact header length, fill with empty strings first
    const totalsRowData = new Array(headers.length).fill('');
    totalsRowData[0] = '';
    totalsRowData[1] = 'TOTAL:';
    
    // Add department totals starting from index 2
    let colIndex = 2;
    departmentsWithValues.forEach(dept => {
      if (colIndex < headers.length - 2) { // Ensure we don't exceed boundaries
        const grossRevenue = departmentTotals[dept.departmentId] || 0;
        const netRevenue = Math.max(0, grossRevenue);
        totalsRowData[colIndex] = netRevenue;
        colIndex++;
      }
    });
    
    // Add total gross (second to last column) and empty referrer (last column)
    if (headers.length >= 2) {
      totalsRowData[headers.length - 2] = totalGross;
      totalsRowData[headers.length - 1] = '';
    }

    // Create totals row with exact positioning - don't use addRow with array
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
      
      // Format currency columns (skip OR#, Patient Name, and Referrer columns)
      if (i >= 2 && i < headers.length - 1 && typeof totalsRowData[i] === 'number') {
        cell.numFmt = '#,##0.00';
      }
    }
    totalsRow.commit();
    
    // Update dataEndRow to include the totals row
    const finalDataEndRow = dataEndRow + 1;

    // Add some spacing
    worksheet.addRow([]);
    worksheet.addRow([]);

    // Position Income Summary below the main table instead of to the right
    const summaryStartRow = finalDataEndRow + 3; // 3 rows after the main table
    
    // Add Income Summary section positioned below the main table
    const summaryTitleCell = worksheet.getCell(summaryStartRow, 1);
    summaryTitleCell.value = 'INCOME SUMMARY';
    summaryTitleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFF' } };
    summaryTitleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FCD34D' } // Yellow color
    };
    summaryTitleCell.alignment = { horizontal: 'center' };
    worksheet.mergeCells(`A${summaryStartRow}:B${summaryStartRow}`);

    // Add summary data positioned below the main table
    const deposit = Math.max(0, totalGross - totalRefunds - totalGCash);
    
    const summaryData = [
      ['GCASH', totalGCash],
      ['REFUND', totalRefunds],
      ['DEPOSIT', deposit]
    ];

    summaryData.forEach((item, index) => {
      const rowNum = summaryStartRow + 1 + index;
      const labelCell = worksheet.getCell(rowNum, 1); // Column A
      const valueCell = worksheet.getCell(rowNum, 2); // Column B
      
      labelCell.value = item[0];
      valueCell.value = item[1];
      
      labelCell.font = { bold: true, color: { argb: 'FFFFFF' } };
      valueCell.numFmt = '#,##0.00';
      
      // Set background colors
      if (index === 0) { // GCASH
        labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3B82F6' } }; // Blue
      } else if (index === 1) { // REFUND
        labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EF4444' } }; // Red
      } else { // DEPOSIT
        labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '166534' } }; // Green
      }
    });

    // Set column widths to prevent overflow
    worksheet.columns = [];
    
    for (let i = 0; i < headers.length; i++) {
      let width;
      if (i === 0) {
        width = 8; // OR# column
      } else if (i === 1) {
        width = 18; // Patient Name column
      } else if (i === headers.length - 1) {
        width = 12; // Referrer column
      } else if (i === headers.length - 2) {
        width = 10; // Gross column
      } else {
        width = 10; // Department columns
      }
      
      worksheet.getColumn(i + 1).width = width;
    }

    // Add borders to data table only
    const lastCol = headers.length;
    
    // Clear any formatting beyond our table boundaries first
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

    // Add borders to summary section positioned below the main table
    const summaryEndRow = summaryStartRow + 3; // Title + 3 data rows
    
    for (let row = summaryStartRow; row <= summaryEndRow; row++) {
      for (let col = 1; col <= 2; col++) { // Only 2 columns for summary (A and B)
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
    link.download = `Income_Report_${selectedDate.toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
};
