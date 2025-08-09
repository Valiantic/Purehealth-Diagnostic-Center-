import ExcelJS from 'exceljs';

export const exportMonthlyIncomeToExcel = async (monthlyData, monthlySummary, collectibles, currentMonth) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Monthly Income Report');

  // Set column widths
  // Total columns = Day + Gross + each Department + GCash
  const totalColumns = 3 + monthlyData.departments.length; // Day, Gross, Departments..., GCash
    worksheet.columns = [
      { width: 12 }, // Day
      { width: 15 }, // Gross
      ...monthlyData.departments.map(() => ({ width: 15 })), // Department columns
      { width: 15 }, // GCash
    ];

  // Add title - merge across the entire table width and occupy rows 1-2
  const titleEndColumn = totalColumns; // Merge to the last column of the table
  worksheet.mergeCells(1, 1, 2, titleEndColumn); // Merge from A1 to the last header column in row 2
    const titleCell = worksheet.getCell(1, 1);
    titleCell.value = `Monthly Income Report - ${currentMonth}`;
    titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF166534' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.border = {
      top: { style: 'thick', color: { argb: 'FF166534' } },
      left: { style: 'thick', color: { argb: 'FF166534' } },
      bottom: { style: 'thick', color: { argb: 'FF166534' } },
      right: { style: 'thick', color: { argb: 'FF166534' } }
    };

    // Add monthly income table headers
    const headerRow = 3;
    const headers = ['Day', 'Gross', ...monthlyData.departments.map(dept => dept.name), 'GCash'];
    
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(headerRow, index + 1);
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

    // Add monthly income data
    let currentRow = headerRow + 1;
    const formatCurrency = (value) => parseFloat(value || 0).toFixed(2);
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString().slice(-2);
      return `${day}-${month}-${year}`;
    };

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

    // Add collectible income section
    currentRow += 3; // Add spacing

    // Collectible income title - never exceed column D (4th column)
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

    // Add collectible income data
    currentRow += 1;
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

    // Set column widths for collectible section
    worksheet.getColumn(1).width = 20; // Company
    worksheet.getColumn(2).width = 20; // Coordinator
    worksheet.getColumn(3).width = 15; // Date
    worksheet.getColumn(4).width = 15; // Income

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
