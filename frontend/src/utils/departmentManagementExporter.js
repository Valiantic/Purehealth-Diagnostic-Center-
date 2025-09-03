import ExcelJS from 'exceljs';

export const exportDepartmentManagementToExcel = async (departments, searchTerm, filterOption) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Test Departments List Report');

    // Create title based on filters
    let titleText = 'Test Departments List Report';
    if (searchTerm && filterOption !== 'default') {
      const filterText = filterOption === 'highest' ? 'Highest Tests' : 
                        filterOption === 'lowest' ? 'Lowest Tests' : 'Default Order';
      titleText = `Test Departments List Report - Search: "${searchTerm}" - Filter: ${filterText}`;
    } else if (searchTerm) {
      titleText = `Test Departments List Report - Search: "${searchTerm}"`;
    } else if (filterOption !== 'default') {
      const filterText = filterOption === 'highest' ? 'Highest Tests' : 
                        filterOption === 'lowest' ? 'Lowest Tests' : 'Default Order';
      titleText = `Test Departments List Report - Filter: ${filterText}`;
    }

    // Add title - merge across 4 columns (A to D) and occupy row 2 space
    worksheet.mergeCells(1, 1, 2, 4);
    const titleCell = worksheet.getCell(1, 1);
    titleCell.value = titleText;
    titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF166534' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.border = {
      top: { style: 'thick', color: { argb: 'FF166534' } },
      left: { style: 'thick', color: { argb: 'FF166534' } },
      bottom: { style: 'thick', color: { argb: 'FF166534' } },
      right: { style: 'thick', color: { argb: 'FF166534' } }
    };

    // Set column widths
    worksheet.getColumn(1).width = 25; // Department Name
    worksheet.getColumn(2).width = 15; // Test Quantity
    worksheet.getColumn(3).width = 15; // Date Created
    worksheet.getColumn(4).width = 15; // Status

    // Add headers
    const headerRow = 3;
    const headers = ['Department Name', 'Test Quantity', 'Date Created', 'Status'];
    
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

    // Add department data
    let currentRow = headerRow + 1;

    if (departments.length === 0) {
      // No data row
      const noDataRow = [
        'No departments found',
        '',
        '',
        ''
      ];

      noDataRow.forEach((data, index) => {
        const cell = worksheet.getCell(currentRow, index + 1);
        cell.value = data;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { italic: true, color: { argb: 'FF6B7280' } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF166534' } },
          left: { style: 'thin', color: { argb: 'FF166534' } },
          bottom: { style: 'thin', color: { argb: 'FF166534' } },
          right: { style: 'thin', color: { argb: 'FF166534' } }
        };
      });
    } else {
      departments.forEach((dept) => {
        const rowData = [
          dept.departmentName,
          dept.testQuantity,
          new Date(dept.createdAt).toLocaleDateString(),
          dept.status === 'active' ? 'Unarchived' : 'Archived'
        ];

        rowData.forEach((data, index) => {
          const cell = worksheet.getCell(currentRow, index + 1);
          cell.value = data;
          cell.alignment = { 
            horizontal: index === 0 ? 'left' : 'center', // Left align department name
            vertical: 'middle' 
          };
          
          // Special formatting for status column
          if (index === 3) {
            if (dept.status === 'active') {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }; // Light green
              cell.font = { color: { argb: 'FF166534' } }; // Green text
            } else {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFECACA' } }; // Light red
              cell.font = { color: { argb: 'FFDC2626' } }; // Red text
            }
          }
          
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF166534' } },
            left: { style: 'thin', color: { argb: 'FF166534' } },
            bottom: { style: 'thin', color: { argb: 'FF166534' } },
            right: { style: 'thin', color: { argb: 'FF166534' } }
          };
        });
        currentRow++;
      });
    }

    // Add summary information
    currentRow += 2; // Add spacing

    // Summary section
    worksheet.mergeCells(currentRow, 1, currentRow, 2);
    const summaryTitleCell = worksheet.getCell(currentRow, 1);
    summaryTitleCell.value = 'Summary';
    summaryTitleCell.font = { bold: true, size: 12, color: { argb: 'FF166534' } };
    summaryTitleCell.alignment = { horizontal: 'left', vertical: 'middle' };

    currentRow += 1;

    // Total departments count
    const totalCell1 = worksheet.getCell(currentRow, 1);
    totalCell1.value = 'Total Departments:';
    totalCell1.font = { bold: true };
    totalCell1.alignment = { horizontal: 'left', vertical: 'middle' };

    const totalCell2 = worksheet.getCell(currentRow, 2);
    totalCell2.value = departments.length;
    totalCell2.alignment = { horizontal: 'left', vertical: 'middle' };

    currentRow += 1;

    // Active departments count
    const activeDepts = departments.filter(dept => dept.status === 'active').length;
    const activeCell1 = worksheet.getCell(currentRow, 1);
    activeCell1.value = 'Active Departments:';
    activeCell1.font = { bold: true };
    activeCell1.alignment = { horizontal: 'left', vertical: 'middle' };

    const activeCell2 = worksheet.getCell(currentRow, 2);
    activeCell2.value = activeDepts;
    activeCell2.alignment = { horizontal: 'left', vertical: 'middle' };

    currentRow += 1;

    // Archived departments count
    const archivedDepts = departments.filter(dept => dept.status !== 'active').length;
    const archivedCell1 = worksheet.getCell(currentRow, 1);
    archivedCell1.value = 'Archived Departments:';
    archivedCell1.font = { bold: true };
    archivedCell1.alignment = { horizontal: 'left', vertical: 'middle' };

    const archivedCell2 = worksheet.getCell(currentRow, 2);
    archivedCell2.value = archivedDepts;
    archivedCell2.alignment = { horizontal: 'left', vertical: 'middle' };

    currentRow += 1;

    // Total tests count
    const totalTests = departments.reduce((sum, dept) => sum + (dept.testQuantity || 0), 0);
    const testsCell1 = worksheet.getCell(currentRow, 1);
    testsCell1.value = 'Total Tests:';
    testsCell1.font = { bold: true };
    testsCell1.alignment = { horizontal: 'left', vertical: 'middle' };

    const testsCell2 = worksheet.getCell(currentRow, 2);
    testsCell2.value = totalTests;
    testsCell2.alignment = { horizontal: 'left', vertical: 'middle' };

    currentRow += 1;

    // Export timestamp
    const timestampCell1 = worksheet.getCell(currentRow, 1);
    timestampCell1.value = 'Exported on:';
    timestampCell1.font = { bold: true };
    timestampCell1.alignment = { horizontal: 'left', vertical: 'middle' };

    const timestampCell2 = worksheet.getCell(currentRow, 2);
    timestampCell2.value = new Date().toLocaleString();
    timestampCell2.alignment = { horizontal: 'left', vertical: 'middle' };

    // Generate filename based on filters
    let filename = 'Test_Departments_List_Report';
    if (searchTerm) {
      const cleanSearch = searchTerm.replace(/[^a-zA-Z0-9]/g, '_');
      filename += `_${cleanSearch}`;
    }
    if (filterOption !== 'default') {
      filename += `_${filterOption}_tests`;
    }
    filename += '.xlsx';

    // Generate and download the file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
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
