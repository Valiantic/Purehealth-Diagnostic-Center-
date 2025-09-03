import ExcelJS from 'exceljs';

export const exportReferralsListToExcel = async (
  referrers, 
  searchQuery = '', 
  sortDirection = 'asc'
) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Referrals List Report');

    // Set column widths
    worksheet.columns = [
      { key: 'A', width: 25 }, // Doctor Name
      { key: 'B', width: 25 }, // Clinic Name
      { key: 'C', width: 30 }, // Address
      { key: 'D', width: 15 }, // Birth Date
      { key: 'E', width: 15 }, // Date Created
      { key: 'F', width: 12 }  // Status
    ];

    let currentRow = 1;

    // Create title based on filters
    let titleText = 'Referrals List Report';
    if (searchQuery || sortDirection !== 'asc') {
      const filters = [];
      if (searchQuery) filters.push(`Search: "${searchQuery}"`);
      if (sortDirection !== 'asc') filters.push(`Sort: First Name Z-A`);
      titleText += ` (${filters.join(', ')})`;
    }

    // Title - merge A1:F2
    worksheet.mergeCells('A1:F2');
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
      'Doctor Name',
      'Clinic Name', 
      'Address',
      'Birth Date',
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

    // Data rows
    if (referrers.length === 0) {
      // No data row
      const noDataRow = [
        'No referrers found',
        '',
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
      referrers.forEach((referrer) => {
        const rowData = [
          `${referrer.firstName} ${referrer.lastName}`,
          referrer.clinicName || 'N/A',
          referrer.clinicAddress || 'N/A',
          referrer.birthday ? new Date(referrer.birthday).toLocaleDateString() : 'N/A',
          referrer.createdAt ? new Date(referrer.createdAt).toLocaleDateString() : 'N/A',
          referrer.status?.toLowerCase() === 'active' ? 'Unarchived' : 'Archived'
        ];

        rowData.forEach((data, index) => {
          const cell = worksheet.getCell(currentRow, index + 1);
          cell.value = data;
          
          // Alignment
          if (index === 0) { // Doctor Name - left aligned
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
          } else { // Others - center aligned
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }
          
          // Status styling
          if (index === 5) { // Status column
            if (referrer.status?.toLowerCase() === 'active') {
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

    // Total referrers count
    const totalCell1 = worksheet.getCell(currentRow, 1);
    totalCell1.value = 'Total Referrers:';
    totalCell1.font = { bold: true };
    totalCell1.alignment = { horizontal: 'left', vertical: 'middle' };

    const totalCell2 = worksheet.getCell(currentRow, 2);
    totalCell2.value = referrers.length;
    totalCell2.alignment = { horizontal: 'left', vertical: 'middle' };

    currentRow += 1;

    // Active referrers count
    const activeReferrers = referrers.filter(referrer => referrer.status?.toLowerCase() === 'active').length;
    const activeCell1 = worksheet.getCell(currentRow, 1);
    activeCell1.value = 'Active Referrers:';
    activeCell1.font = { bold: true };
    activeCell1.alignment = { horizontal: 'left', vertical: 'middle' };

    const activeCell2 = worksheet.getCell(currentRow, 2);
    activeCell2.value = activeReferrers;
    activeCell2.alignment = { horizontal: 'left', vertical: 'middle' };

    currentRow += 1;

    // Archived referrers count
    const archivedReferrers = referrers.filter(referrer => referrer.status?.toLowerCase() !== 'active').length;
    const archivedCell1 = worksheet.getCell(currentRow, 1);
    archivedCell1.value = 'Archived Referrers:';
    archivedCell1.font = { bold: true };
    archivedCell1.alignment = { horizontal: 'left', vertical: 'middle' };

    const archivedCell2 = worksheet.getCell(currentRow, 2);
    archivedCell2.value = archivedReferrers;
    archivedCell2.alignment = { horizontal: 'left', vertical: 'middle' };

    currentRow += 1;

    // Referrers with clinics count
    const referrersWithClinics = referrers.filter(referrer => referrer.clinicName && referrer.clinicName.trim() !== '').length;
    const clinicsCell1 = worksheet.getCell(currentRow, 1);
    clinicsCell1.value = 'Referrers with Clinics:';
    clinicsCell1.font = { bold: true };
    clinicsCell1.alignment = { horizontal: 'left', vertical: 'middle' };

    const clinicsCell2 = worksheet.getCell(currentRow, 2);
    clinicsCell2.value = referrersWithClinics;
    clinicsCell2.alignment = { horizontal: 'left', vertical: 'middle' };

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
    let filename = 'Referrals_List_Report';
    if (searchQuery || sortDirection !== 'asc') {
      const parts = [];
      if (searchQuery) parts.push(`search_${searchQuery.replace(/[^a-zA-Z0-9]/g, '_')}`);
      if (sortDirection !== 'asc') parts.push('sorted_ZA');
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
    console.error('Error exporting referrals list to Excel:', error);
    throw error;
  }
};
