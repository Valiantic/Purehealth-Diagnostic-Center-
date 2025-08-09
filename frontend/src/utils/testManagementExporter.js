import ExcelJS from 'exceljs';

export const exportTestManagementToExcel = async (
  tests, 
  departments, 
  searchTerm = '', 
  selectedDepartmentFilter = 'all'
) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Test List Report');

    // Set column widths
    worksheet.columns = [
      { key: 'A', width: 25 }, // Test Name
      { key: 'B', width: 20 }, // Department
      { key: 'C', width: 15 }, // Price
      { key: 'D', width: 15 }, // Date Created
      { key: 'E', width: 12 }  // Status
    ];

    let currentRow = 1;

    // Create title based on filters
    let titleText = 'Test List Report';
    if (searchTerm || selectedDepartmentFilter !== 'all') {
      const filters = [];
      if (searchTerm) filters.push(`Search: "${searchTerm}"`);
      if (selectedDepartmentFilter !== 'all') {
        const selectedDept = departments.find(d => d.departmentId === parseInt(selectedDepartmentFilter));
        if (selectedDept) filters.push(`Department: ${selectedDept.departmentName}`);
      }
      titleText += ` (${filters.join(', ')})`;
    }

    // Title - merge A1:E2
    worksheet.mergeCells('A1:E2');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = titleText;
    titleCell.font = { 
      bold: true, 
      size: 16, 
      color: { argb: 'FF166534' } 
    };
    titleCell.alignment = { 
      horizontal: 'center', 
      vertical: 'middle' 
    };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF0FDF4' }
    };
    titleCell.border = {
      top: { style: 'thick', color: { argb: 'FF166534' } },
      left: { style: 'thick', color: { argb: 'FF166534' } },
      bottom: { style: 'thick', color: { argb: 'FF166534' } },
      right: { style: 'thick', color: { argb: 'FF166534' } }
    };

    currentRow = 3;

    // Headers
    const headers = [
      'Test Name',
      'Department', 
      'Price',
      'Date Created',
      'Status'
    ];

    headers.forEach((header, index) => {
      const cell = worksheet.getCell(currentRow, index + 1);
      cell.value = header;
      cell.font = { 
        bold: true, 
        color: { argb: 'FFFFFFFF' } 
      };
      cell.alignment = { 
        horizontal: 'center', 
        vertical: 'middle' 
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF166534' }
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF166534' } },
        left: { style: 'thin', color: { argb: 'FF166534' } },
        bottom: { style: 'thin', color: { argb: 'FF166534' } },
        right: { style: 'thin', color: { argb: 'FF166534' } }
      };
    });

    currentRow++;

    // Filter tests based on search and department filter
    const filteredTests = tests.filter(test => {
      if (!searchTerm.trim() && selectedDepartmentFilter === 'all') return true;
      
      const departmentMatch = selectedDepartmentFilter === 'all' || 
        (test.departmentId === parseInt(selectedDepartmentFilter));
      
      const searchTermLower = searchTerm.toLowerCase();
      const searchMatch = !searchTerm.trim() || (
        test.testName?.toLowerCase?.().includes(searchTermLower) ||
        test.Department?.departmentName?.toLowerCase?.().includes(searchTermLower) ||
        test.price?.toString?.().includes(searchTerm) ||
        test.status?.toLowerCase?.().includes(searchTermLower)
      );
      
      return departmentMatch && searchMatch;
    });

    // Data rows
    if (filteredTests.length === 0) {
      // No data row
      const noDataRow = [
        'No tests found',
        '',
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
      filteredTests.forEach((test) => {
        const rowData = [
          test.testName,
          test.Department?.departmentName || 'N/A',
          parseFloat(test.price).toLocaleString('en-US', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).replace('PHP', '₱'),
          test.dateCreated ? new Date(test.dateCreated).toLocaleDateString() : 'N/A',
          test.status === 'active' ? 'Unarchived' : 'Archived'
        ];

        rowData.forEach((data, index) => {
          const cell = worksheet.getCell(currentRow, index + 1);
          cell.value = data;
          
          // Alignment
          if (index === 0) { // Test Name - left aligned
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
          } else { // Others - center aligned
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }
          
          // Status styling
          if (index === 4) { // Status column
            if (test.status === 'active') {
              cell.font = { color: { argb: 'FF166534' }, bold: true };
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF0FDF4' }
              };
            } else {
              cell.font = { color: { argb: 'FFDC2626' }, bold: true };
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFEF2F2' }
              };
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

    // Total tests count
    const totalTests = filteredTests.length;
    const totalCell1 = worksheet.getCell(currentRow, 1);
    totalCell1.value = 'Total Tests:';
    totalCell1.font = { bold: true };
    totalCell1.alignment = { horizontal: 'left', vertical: 'middle' };

    const totalCell2 = worksheet.getCell(currentRow, 2);
    totalCell2.value = totalTests;
    totalCell2.alignment = { horizontal: 'left', vertical: 'middle' };

    currentRow += 1;

    // Active tests count
    const activeTests = filteredTests.filter(test => test.status === 'active').length;
    const activeCell1 = worksheet.getCell(currentRow, 1);
    activeCell1.value = 'Active Tests:';
    activeCell1.font = { bold: true };
    activeCell1.alignment = { horizontal: 'left', vertical: 'middle' };

    const activeCell2 = worksheet.getCell(currentRow, 2);
    activeCell2.value = activeTests;
    activeCell2.alignment = { horizontal: 'left', vertical: 'middle' };

    currentRow += 1;

    // Archived tests count
    const archivedTests = filteredTests.filter(test => test.status === 'inactive').length;
    const archivedCell1 = worksheet.getCell(currentRow, 1);
    archivedCell1.value = 'Archived Tests:';
    archivedCell1.font = { bold: true };
    archivedCell1.alignment = { horizontal: 'left', vertical: 'middle' };

    const archivedCell2 = worksheet.getCell(currentRow, 2);
    archivedCell2.value = archivedTests;
    archivedCell2.alignment = { horizontal: 'left', vertical: 'middle' };

    currentRow += 1;

    // Departments with tests count
    const totalDepartments = [...new Set(filteredTests.map(test => test.departmentId))].length;
    const deptsCell1 = worksheet.getCell(currentRow, 1);
    deptsCell1.value = 'Departments with Tests:';
    deptsCell1.font = { bold: true };
    deptsCell1.alignment = { horizontal: 'left', vertical: 'middle' };

    const deptsCell2 = worksheet.getCell(currentRow, 2);
    deptsCell2.value = totalDepartments;
    deptsCell2.alignment = { horizontal: 'left', vertical: 'middle' };

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
    let filename = 'Test_List_Report';
    if (searchTerm || selectedDepartmentFilter !== 'all') {
      const parts = [];
      if (searchTerm) parts.push(`search_${searchTerm.replace(/[^a-zA-Z0-9]/g, '_')}`);
      if (selectedDepartmentFilter !== 'all') {
        const selectedDept = departments.find(d => d.departmentId === parseInt(selectedDepartmentFilter));
        if (selectedDept) parts.push(`dept_${selectedDept.departmentName.replace(/[^a-zA-Z0-9]/g, '_')}`);
      }
      filename += `_${parts.join('_')}`;
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    filename += `_${timestamp}.xlsx`;

    // Generate buffer and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true, filename };
  } catch (error) {
    console.error('Error exporting test management to Excel:', error);
    throw error;
  }
};
