import ExcelJS from 'exceljs';

export const exportMonthlyIncomeToExcel = async (monthlyData, monthlySummary, collectibles, currentMonth, profitLossData = null, allTransactions = []) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Monthly Income Report');

    // Helper functions
    const formatCurrency = (value) => parseFloat(value || 0).toFixed(2);
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString().slice(-2);
      return `${day}-${month}-${year}`;
    };

    // Total columns for the main monthly table (Day + Gross + each Department + GCash)
    const mainTableColumns = 3 + monthlyData.departments.length;
    // We'll use at least 5 columns for the transaction details (Date, OR#, Name, Services, Amount)
    const maxColumns = Math.max(mainTableColumns, 5);

    // Set initial column widths
    worksheet.columns = [
      { width: 12 }, // Date / Day
      { width: 15 }, // OR# / Gross
      { width: 25 }, // Patient Name / Dept 1
      { width: 40 }, // Services / Dept 2
      { width: 15 }, // Amount / Dept 3 ...
    ];

    // Add title
    worksheet.mergeCells(1, 1, 2, maxColumns);
    const titleCell = worksheet.getCell(1, 1);
    titleCell.value = `Monthly Transaction & Income Report - ${currentMonth}`;
    titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF166534' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.border = {
      top: { style: 'thick', color: { argb: 'FF166534' } },
      left: { style: 'thick', color: { argb: 'FF166534' } },
      bottom: { style: 'thick', color: { argb: 'FF166534' } },
      right: { style: 'thick', color: { argb: 'FF166534' } }
    };

    let currentRow = 4;

    // SECTION 1: TRANSACTION DETAILS
    worksheet.mergeCells(currentRow, 1, currentRow, maxColumns);
    const transTitleCell = worksheet.getCell(currentRow, 1);
    transTitleCell.value = 'Transaction Details';
    transTitleCell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    transTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF166534' } };
    transTitleCell.alignment = { horizontal: 'left', vertical: 'middle' };
    currentRow++;

    const transHeaders = ['Date', 'OR#', 'Patient Name', 'Services/Tests', 'Amount'];
    transHeaders.forEach((header, index) => {
      const cell = worksheet.getCell(currentRow, index + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: 'FF166534' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F7FF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF166534' } },
        left: { style: 'thin', color: { argb: 'FF166534' } },
        bottom: { style: 'thin', color: { argb: 'FF166534' } },
        right: { style: 'thin', color: { argb: 'FF166534' } }
      };
    });
    currentRow++;

    let transTotal = 0;
    if (allTransactions && allTransactions.length > 0) {
      allTransactions.forEach(trans => {
        const tests = (trans.TestDetails || []).map(td => td.testName).join(', ');
        const amount = parseFloat(trans.totalAmount || 0);
        transTotal += amount;

        const rowData = [
          formatDate(trans.transactionDate),
          trans.mcNo,
          `${trans.firstName} ${trans.lastName}`,
          tests,
          formatCurrency(amount)
        ];

        rowData.forEach((data, index) => {
          const cell = worksheet.getCell(currentRow, index + 1);
          cell.value = data;
          cell.alignment = { horizontal: index === 3 ? 'left' : 'center', vertical: 'middle', wrapText: true };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFCCE3D5' } },
            left: { style: 'thin', color: { argb: 'FFCCE3D5' } },
            bottom: { style: 'thin', color: { argb: 'FFCCE3D5' } },
            right: { style: 'thin', color: { argb: 'FFCCE3D5' } }
          };
        });
        currentRow++;
      });
    } else {
      worksheet.mergeCells(currentRow, 1, currentRow, 5);
      worksheet.getCell(currentRow, 1).value = 'No transactions found for this period';
      worksheet.getCell(currentRow, 1).alignment = { horizontal: 'center' };
      currentRow++;
    }

    // Transaction Summary Row
    const transSummaryCell = worksheet.getCell(currentRow, 4);
    transSummaryCell.value = 'TOTAL TRANSACTIONS:';
    transSummaryCell.font = { bold: true };
    const transTotalCell = worksheet.getCell(currentRow, 5);
    transTotalCell.value = formatCurrency(transTotal);
    transTotalCell.font = { bold: true };
    currentRow += 3;

    // SECTION 2: DAILY SUMMARY
    worksheet.mergeCells(currentRow, 1, currentRow, mainTableColumns);
    const dailyTitleCell = worksheet.getCell(currentRow, 1);
    dailyTitleCell.value = 'Daily Income Summary';
    dailyTitleCell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    dailyTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF166534' } };
    dailyTitleCell.alignment = { horizontal: 'left', vertical: 'middle' };
    currentRow++;

    const dailyHeadersRow = currentRow;
    const headers = ['Day', 'Gross', ...monthlyData.departments.map(dept => dept.name), 'GCash'];

    headers.forEach((header, index) => {
      const cell = worksheet.getCell(dailyHeadersRow, index + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: 'FF166534' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F7FF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF166534' } },
        left: { style: 'thin', color: { argb: 'FF166534' } },
        bottom: { style: 'thin', color: { argb: 'FF166534' } },
        right: { style: 'thin', color: { argb: 'FF166534' } }
      };
    });
    currentRow++;

    monthlyData.dailyIncome.forEach((day) => {
      const rowData = [
        formatDate(day.date),
        formatCurrency(day.grossAmount),
        ...monthlyData.departments.map(dept => formatCurrency(day.departments[dept.id])),
        formatCurrency(day.gCashAmount)
      ];

      rowData.forEach((data, index) => {
        const cell = worksheet.getCell(currentRow, index + 1);
        cell.value = data;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF166534' } },
          left: { style: 'thin', color: { argb: 'FF166534' } },
          bottom: { style: 'thin', color: { argb: 'FF166534' } },
          right: { style: 'thin', color: { argb: 'FF166534' } }
        };
      });
      currentRow++;
    });

    // Add totals row
    const totalsData = [
      'TOTAL:',
      formatCurrency(monthlySummary.totalGross),
      ...monthlyData.departments.map(dept => formatCurrency(monthlySummary.departmentTotals[dept.id])),
      formatCurrency(monthlySummary.totalGCash)
    ];

    totalsData.forEach((data, index) => {
      const cell = worksheet.getCell(currentRow, index + 1);
      cell.value = data;
      cell.font = { bold: true, color: { argb: 'FF166534' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F7FF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thick', color: { argb: 'FF166534' } },
        left: { style: 'thin', color: { argb: 'FF166534' } },
        bottom: { style: 'thick', color: { argb: 'FF166534' } },
        right: { style: 'thin', color: { argb: 'FF166534' } }
      };
    });

    // SECTION 3: COLLECTIBLE INCOME
    currentRow += 3; // Add spacing

    // Collectible income title
    worksheet.mergeCells(currentRow, 1, currentRow, 4);
    const collectibleTitleCell = worksheet.getCell(currentRow, 1);
    collectibleTitleCell.value = 'Collectible Income';
    collectibleTitleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    collectibleTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF166534' } };
    collectibleTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    collectibleTitleCell.border = {
      top: { style: 'thick', color: { argb: 'FF166534' } },
      left: { style: 'thick', color: { argb: 'FF166534' } },
      bottom: { style: 'thick', color: { argb: 'FF166534' } },
      right: { style: 'thick', color: { argb: 'FF166534' } }
    };

    // Collectible income headers
    currentRow += 1;
    const collectibleHeaders = ['Company', 'Coordinator', 'Date', 'Income'];

    collectibleHeaders.forEach((header, index) => {
      const cell = worksheet.getCell(currentRow, index + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: 'FF166534' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F7FF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF166534' } },
        left: { style: 'thin', color: { argb: 'FF166534' } },
        bottom: { style: 'thin', color: { argb: 'FF166534' } },
        right: { style: 'thin', color: { argb: 'FF166534' } }
      };
    });
    currentRow += 1;

    // Add collectible income data
    collectibles.forEach((item) => {
      const rowData = [
        item.companyName,
        item.coordinatorName,
        new Date(item.dateConducted).toLocaleDateString(),
        formatCurrency(item.totalIncome)
      ];

      rowData.forEach((data, index) => {
        const cell = worksheet.getCell(currentRow, index + 1);
        cell.value = data;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF166534' } },
          left: { style: 'thin', color: { argb: 'FF166534' } },
          bottom: { style: 'thin', color: { argb: 'FF166534' } },
          right: { style: 'thin', color: { argb: 'FF166534' } }
        };
      });
      currentRow++;
    });

    // Add collectible income total
    const collectibleTotal = collectibles.reduce((sum, item) => sum + parseFloat(item.totalIncome || 0), 0);
    const collectibleTotalData = ['TOTAL:', '', '', formatCurrency(collectibleTotal)];

    collectibleTotalData.forEach((data, index) => {
      const cell = worksheet.getCell(currentRow, index + 1);
      cell.value = data;
      cell.font = { bold: true, color: { argb: 'FF166534' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F7FF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thick', color: { argb: 'FF166534' } },
        left: { style: 'thin', color: { argb: 'FF166534' } },
        bottom: { style: 'thick', color: { argb: 'FF166534' } },
        right: { style: 'thin', color: { argb: 'FF166534' } }
      };
    });

    // ===== ADD PROFIT & LOSS REPORT SHEET =====
    if (profitLossData) {
      const plWorksheet = workbook.addWorksheet('Profit&Loss Report');

      plWorksheet.columns = [
        { width: 25 }, // Category names
        { width: 22 }, // Previous month
        { width: 22 }, // Current month
      ];

      let plRow = 1;

      plWorksheet.mergeCells(plRow, 1, plRow, 3);
      let titleCellPL = plWorksheet.getCell(plRow, 1);
      titleCellPL.value = 'Purehealth Diagnostic Center Inc.';
      titleCellPL.font = { bold: true, size: 16, color: { argb: 'FF166534' } };
      titleCellPL.alignment = { horizontal: 'center', vertical: 'middle' };
      plRow++;

      plWorksheet.mergeCells(plRow, 1, plRow, 3);
      let subtitleCell = plWorksheet.getCell(plRow, 1);
      subtitleCell.value = 'General Mariano Alvarez, Cavite Branch';
      subtitleCell.font = { size: 12, color: { argb: 'FF166534' } };
      subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      plRow++;

      plWorksheet.mergeCells(plRow, 1, plRow, 3);
      let dateCell = plWorksheet.getCell(plRow, 1);
      dateCell.value = `Date: ${profitLossData.date}`;
      dateCell.font = { size: 10, color: { argb: 'FF000000' } };
      dateCell.alignment = { horizontal: 'left', vertical: 'middle' };
      plRow += 2;

      plWorksheet.mergeCells(plRow, 1, plRow, 3);
      let sectionTitleCell = plWorksheet.getCell(plRow, 1);
      sectionTitleCell.value = 'Profit&Loss Report';
      sectionTitleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      sectionTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF166534' } };
      sectionTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      sectionTitleCell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
      plRow += 2;

      const headerData = ['', profitLossData.previousMonth, profitLossData.currentMonth];
      headerData.forEach((header, index) => {
        const cell = plWorksheet.getCell(plRow, index + 1);
        cell.value = header;
        cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF166534' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
      });
      plWorksheet.getRow(plRow).height = 30;
      plRow++;

      // Revenue Section
      let revenueHeaderCell = plWorksheet.getCell(plRow, 1);
      revenueHeaderCell.value = 'Revenue';
      revenueHeaderCell.font = { bold: true, size: 11 };
      revenueHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } };
      revenueHeaderCell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
      plRow++;

      profitLossData.revenue.departments.forEach(dept => {
        const rowData = [dept.name, dept.previousMonth, dept.currentMonth];
        rowData.forEach((value, index) => {
          const cell = plWorksheet.getCell(plRow, index + 1);
          cell.value = value;
          if (index === 0) {
            cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAF4EA' } };
          } else {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
            cell.numFmt = '₱#,##0.00';
          }
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          };
        });
        plRow++;
      });

      // Additional Income
      ['Additional Income', profitLossData.revenue.additionalIncome.previousMonth, profitLossData.revenue.additionalIncome.currentMonth].forEach((value, index) => {
        const cell = plWorksheet.getCell(plRow, index + 1);
        cell.value = value;
        if (index === 0) {
          cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAF4EA' } };
        } else {
          cell.numFmt = '₱#,##0.00';
        }
        cell.border = { style: 'thin', color: { argb: 'FF000000' } };
      });
      plRow++;

      // GCash Income
      ['GCash Income', profitLossData.revenue.gCashIncome.previousMonth, profitLossData.revenue.gCashIncome.currentMonth].forEach((value, index) => {
        const cell = plWorksheet.getCell(plRow, index + 1);
        cell.value = value;
        if (index === 0) {
          cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAF4EA' } };
        } else {
          cell.numFmt = '₱#,##0.00';
        }
        cell.border = { style: 'thin', color: { argb: 'FF000000' } };
      });
      plRow++;

      // Total Revenue
      ['Total Revenue', profitLossData.revenue.total.previousMonth, profitLossData.revenue.total.currentMonth].forEach((value, index) => {
        const cell = plWorksheet.getCell(plRow, index + 1);
        cell.value = value;
        cell.font = { bold: true };
        if (index === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } };
        } else {
          cell.numFmt = '₱#,##0.00';
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAF4EA' } };
        }
        cell.border = { style: 'thin', color: { argb: 'FF000000' } };
      });
      plRow += 2;

      // Expense Section
      let expensesHeaderCell = plWorksheet.getCell(plRow, 1);
      expensesHeaderCell.value = 'Expenses';
      expensesHeaderCell.font = { bold: true, size: 11 };
      expensesHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } };
      expensesHeaderCell.border = { style: 'thin', color: { argb: 'FF000000' } };
      plRow++;

      profitLossData.expenses.categories.forEach(category => {
        const rowData = [category.name, category.previousMonth, category.currentMonth];
        rowData.forEach((value, index) => {
          const cell = plWorksheet.getCell(plRow, index + 1);
          cell.value = value;
          if (index === 0) {
            cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAF4EA' } };
          } else {
            cell.numFmt = '₱#,##0.00';
          }
          cell.border = { style: 'thin', color: { argb: 'FF000000' } };
        });
        plRow++;
      });

      // Total Expenses
      ['Total Expenses', profitLossData.expenses.total.previousMonth, profitLossData.expenses.total.currentMonth].forEach((value, index) => {
        const cell = plWorksheet.getCell(plRow, index + 1);
        cell.value = value;
        cell.font = { bold: true };
        if (index === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } };
        } else {
          cell.numFmt = '₱#,##0.00';
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAF4EA' } };
        }
        cell.border = { style: 'thin', color: { argb: 'FF000000' } };
      });
      plRow += 2;

      // Bottom Summary
      [['Income before tax', profitLossData.incomeBeforeTax],
      ['Income tax expense (12%)', profitLossData.incomeTax],
      ['Net Profit (Loss)', profitLossData.netProfit]].forEach(([label, data]) => {
        [label, data.previousMonth, data.currentMonth].forEach((value, index) => {
          const cell = plWorksheet.getCell(plRow, index + 1);
          cell.value = value;
          if (index === 0) {
            cell.font = { bold: label.includes('Net Profit') || label.includes('Income before') };
          } else {
            cell.numFmt = '₱#,##0.00';
          }
          cell.border = { style: 'thin', color: { argb: 'FF000000' } };
        });
        plRow++;
      });
    }

    // Generate and download the file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Monthly_Income_Report_${currentMonth}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
};
