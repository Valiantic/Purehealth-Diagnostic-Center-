import ExcelJS from 'exceljs';

export const exportMonthlyExpensesToExcel = async (departmentsList, monthlyData, currentMonth, getExpenseItemsByDepartment, getExpenseItemsWithNoDepartment, calculateDepartmentTotal, calculateOtherExpensesTotal) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Monthly Expenses Report');

    // Add title - merge across 4 columns (A to D) and occupy row 2 space
    worksheet.mergeCells(1, 1, 2, 4);
    const titleCell = worksheet.getCell(1, 1);
    titleCell.value = `Monthly Expenses Report - ${currentMonth}`;
    titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF166534' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.border = {
      top: { style: 'thick', color: { argb: 'FF166534' } },
      left: { style: 'thick', color: { argb: 'FF166534' } },
      bottom: { style: 'thick', color: { argb: 'FF166534' } },
      right: { style: 'thick', color: { argb: 'FF166534' } }
    };

    let currentRow = 4; // Start after title
    const formatCurrency = (value) => parseFloat(value || 0).toFixed(2);
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString().slice(-2);
      return `${day}-${month}-${year}`;
    };

    // Set column widths
    worksheet.getColumn(1).width = 12; // Date
    worksheet.getColumn(2).width = 20; // Paid To
    worksheet.getColumn(3).width = 15; // Category
    worksheet.getColumn(4).width = 15; // Amount

    // Process each department
    departmentsList.forEach((department) => {
      const departmentItems = getExpenseItemsByDepartment(department.departmentId || department.id);
      const departmentTotal = calculateDepartmentTotal(department.departmentId || department.id);
      
      // Only process department if it has expenses
      if (departmentItems.length === 0) {
        return;
      }

      // Department title
      worksheet.mergeCells(currentRow, 1, currentRow, 4);
      const deptTitleCell = worksheet.getCell(currentRow, 1);
      deptTitleCell.value = `${department.departmentName} Department`;
      deptTitleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      deptTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF166534' } };
      deptTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      deptTitleCell.border = {
        top: { style: 'thick', color: { argb: 'FF166534' } },
        left: { style: 'thick', color: { argb: 'FF166534' } },
        bottom: { style: 'thick', color: { argb: 'FF166534' } },
        right: { style: 'thick', color: { argb: 'FF166534' } }
      };

      // Department headers
      currentRow += 1;
      const headers = ['Date', 'Paid To', 'Category', 'Amount'];
      headers.forEach((header, index) => {
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

      // Department data
      currentRow += 1;
      departmentItems.forEach((item) => {
        const rowData = [
          formatDate(item.date),
          item.paidTo || '-',
          item.categoryName || '-',
          formatCurrency(item.amount)
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

      // Department total
      const totalData = ['TOTAL:', '', '', formatCurrency(departmentTotal)];
      totalData.forEach((data, index) => {
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

      currentRow += 3; // Add spacing between departments
    });

    // Process Other Expenses (No Department)
    const otherExpensesItems = getExpenseItemsWithNoDepartment();
    if (otherExpensesItems.length > 0) {
      // Other expenses title
      worksheet.mergeCells(currentRow, 1, currentRow, 4);
      const otherTitleCell = worksheet.getCell(currentRow, 1);
      otherTitleCell.value = 'Other Expenses (No Department)';
      otherTitleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      otherTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B7280' } }; // Gray color
      otherTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      otherTitleCell.border = {
        top: { style: 'thick', color: { argb: 'FF6B7280' } },
        left: { style: 'thick', color: { argb: 'FF6B7280' } },
        bottom: { style: 'thick', color: { argb: 'FF6B7280' } },
        right: { style: 'thick', color: { argb: 'FF6B7280' } }
      };

      // Other expenses headers
      currentRow += 1;
      const headers = ['Date', 'Paid To', 'Category', 'Amount'];
      headers.forEach((header, index) => {
        const cell = worksheet.getCell(currentRow, index + 1);
        cell.value = header;
        cell.font = { bold: true, color: { argb: 'FF6B7280' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }; // Light gray
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF6B7280' } },
          left: { style: 'thin', color: { argb: 'FF6B7280' } },
          bottom: { style: 'thin', color: { argb: 'FF6B7280' } },
          right: { style: 'thin', color: { argb: 'FF6B7280' } }
        };
      });

      // Other expenses data
      currentRow += 1;
      otherExpensesItems.forEach((item) => {
        const rowData = [
          formatDate(item.date),
          item.paidTo || '-',
          item.categoryName || '-',
          formatCurrency(item.amount)
        ];

        rowData.forEach((data, index) => {
          const cell = worksheet.getCell(currentRow, index + 1);
          cell.value = data;
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF6B7280' } },
            left: { style: 'thin', color: { argb: 'FF6B7280' } },
            bottom: { style: 'thin', color: { argb: 'FF6B7280' } },
            right: { style: 'thin', color: { argb: 'FF6B7280' } }
          };
        });
        currentRow++;
      });

      // Other expenses total
      const otherTotal = calculateOtherExpensesTotal();
      const totalData = ['TOTAL:', '', '', formatCurrency(otherTotal)];
      totalData.forEach((data, index) => {
        const cell = worksheet.getCell(currentRow, index + 1);
        cell.value = data;
        cell.font = { bold: true, color: { argb: 'FF6B7280' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thick', color: { argb: 'FF6B7280' } },
          left: { style: 'thin', color: { argb: 'FF6B7280' } },
          bottom: { style: 'thick', color: { argb: 'FF6B7280' } },
          right: { style: 'thin', color: { argb: 'FF6B7280' } }
        };
      });
    }

    // Generate and download the file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Monthly_Expenses_Report_${currentMonth}.xlsx`;
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
