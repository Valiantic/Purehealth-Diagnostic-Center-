import ExcelJS from 'exceljs';

export const exportActivityLogToExcel = async (logsData, selectedDate, searchTerm) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Activity Log Report');

    // Create title based on filters
    let titleText = 'Activity Log Report';
    if (selectedDate && searchTerm) {
      const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      titleText = `Activity Log Report - ${formattedDate} - Search: "${searchTerm}"`;
    } else if (selectedDate) {
      const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      titleText = `Activity Log Report - ${formattedDate}`;
    } else if (searchTerm) {
      titleText = `Activity Log Report - Search: "${searchTerm}"`;
    }

    // Add title - merge across 5 columns (A to E) and occupy row 2 space
    worksheet.mergeCells(1, 1, 2, 5);
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
    worksheet.getColumn(1).width = 20; // User
    worksheet.getColumn(2).width = 15; // Role
    worksheet.getColumn(3).width = 12; // Time
    worksheet.getColumn(4).width = 12; // Date
    
    // Calculate dynamic width for action column based on content
    const logs = logsData?.logs || [];
    let maxActionLength = 20; // Minimum width
    
    if (logs.length > 0) {
      logs.forEach(log => {
        if (log.details) {
          const detailsLength = log.details.length;
          if (detailsLength > maxActionLength) {
            maxActionLength = Math.min(detailsLength, 100); // Cap at 100 characters
          }
        }
      });
    }
    
    worksheet.getColumn(5).width = Math.max(maxActionLength, 30); // Action column with dynamic width

    // Add headers
    const headerRow = 3;
    const headers = ['User', 'Role', 'Time', 'Date', 'Action'];
    
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

    // Add activity log data
    let currentRow = headerRow + 1;

    if (logs.length === 0) {
      // No data row
      const noDataRow = [
        'No activity logs found',
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
      logs.forEach((log) => {
        const rowData = [
          log.user?.name || 'System',
          log.user?.role 
            ? (log.user.role === 'admin' ? 'Admin' : 'Receptionist')
            : 'SYSTEM',
          log.time,
          log.date,
          log.details
        ];

        rowData.forEach((data, index) => {
          const cell = worksheet.getCell(currentRow, index + 1);
          cell.value = data;
          cell.alignment = { 
            horizontal: index === 4 ? 'left' : 'center', // Left align action column
            vertical: 'middle',
            wrapText: index === 4 // Enable text wrapping for action column
          };
          
          // Special formatting for role column
          if (index === 1 && log.user?.role) {
            if (log.user.role === 'admin') {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } }; // Light blue
              cell.font = { color: { argb: 'FF1E40AF' } }; // Blue text
            } else {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }; // Light green
              cell.font = { color: { argb: 'FF166534' } }; // Green text
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

    // Total logs count
    const totalCell1 = worksheet.getCell(currentRow, 1);
    totalCell1.value = 'Total Logs:';
    totalCell1.font = { bold: true };
    totalCell1.alignment = { horizontal: 'left', vertical: 'middle' };

    const totalCell2 = worksheet.getCell(currentRow, 2);
    totalCell2.value = logs.length;
    totalCell2.alignment = { horizontal: 'left', vertical: 'middle' };

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
    let filename = 'Activity_Log_Report';
    if (selectedDate) {
      const fileDate = selectedDate.replace(/-/g, '_');
      filename += `_${fileDate}`;
    }
    if (searchTerm) {
      const cleanSearch = searchTerm.replace(/[^a-zA-Z0-9]/g, '_');
      filename += `_${cleanSearch}`;
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
