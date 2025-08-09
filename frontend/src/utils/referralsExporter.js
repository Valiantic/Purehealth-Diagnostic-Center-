import ExcelJS from 'exceljs';

export const exportReferralsToExcel = async (
  filteredReferrers, 
  allReferrerTransactions, 
  renderableDepartments, 
  selectedDate,
  calculateReferrerTotals,
  getTestsForDepartment
) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Rebates Report');

    // Format the selected date for display
    const formattedDate = selectedDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Calculate total columns: OR#, Patient Name + Department columns
    const totalColumns = 2 + renderableDepartments.length;

    // Add title - merge across all columns and occupy row 2 space
    worksheet.mergeCells(1, 1, 2, totalColumns);
    const titleCell = worksheet.getCell(1, 1);
    titleCell.value = `Rebate Report - ${formattedDate}`;
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

    // Set column widths
    worksheet.getColumn(1).width = 12; // OR#
    worksheet.getColumn(2).width = 20; // Patient Name
    // Department columns
    for (let i = 3; i <= totalColumns; i++) {
      worksheet.getColumn(i).width = 15;
    }

    // Process each referrer
    filteredReferrers.forEach((referrer) => {
      const referrerTransactions = allReferrerTransactions[referrer.referrerId] || [];

      // Referrer name header
      worksheet.mergeCells(currentRow, 1, currentRow, totalColumns);
      const referrerTitleCell = worksheet.getCell(currentRow, 1);
      referrerTitleCell.value = `Dr. ${referrer.firstName} ${referrer.lastName}`;
      referrerTitleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      referrerTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF166534' } };
      referrerTitleCell.alignment = { horizontal: 'left', vertical: 'middle' };
      referrerTitleCell.border = {
        top: { style: 'thick', color: { argb: 'FF166534' } },
        left: { style: 'thick', color: { argb: 'FF166534' } },
        bottom: { style: 'thick', color: { argb: 'FF166534' } },
        right: { style: 'thick', color: { argb: 'FF166534' } }
      };

      // Table headers
      currentRow += 1;
      const headers = ['OR#', 'Patient Name', ...renderableDepartments.map(dept => dept.departmentName)];
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

      // Transaction data
      currentRow += 1;
      if (referrerTransactions.length > 0) {
        referrerTransactions.forEach((transaction) => {
          // OR# and Patient Name
          const cell1 = worksheet.getCell(currentRow, 1);
          cell1.value = transaction.mcNo;
          cell1.alignment = { horizontal: 'center', vertical: 'middle' };
          cell1.border = {
            top: { style: 'thin', color: { argb: 'FF166534' } },
            left: { style: 'thin', color: { argb: 'FF166534' } },
            bottom: { style: 'thin', color: { argb: 'FF166534' } },
            right: { style: 'thin', color: { argb: 'FF166534' } }
          };

          const cell2 = worksheet.getCell(currentRow, 2);
          cell2.value = `${transaction.firstName} ${transaction.lastName}`;
          cell2.alignment = { horizontal: 'center', vertical: 'middle' };
          cell2.border = {
            top: { style: 'thin', color: { argb: 'FF166534' } },
            left: { style: 'thin', color: { argb: 'FF166534' } },
            bottom: { style: 'thin', color: { argb: 'FF166534' } },
            right: { style: 'thin', color: { argb: 'FF166534' } }
          };

          // Department amounts
          renderableDepartments.forEach((department, deptIndex) => {
            const deptId = String(department.departmentId);
            const testsForDepartment = getTestsForDepartment(transaction, deptId);
            const testTotalAmount = testsForDepartment.reduce(
              (sum, test) => sum + parseFloat(test.discountedPrice || 0), 
              0
            );

            const cell = worksheet.getCell(currentRow, 3 + deptIndex);
            cell.value = testTotalAmount > 0 ? testTotalAmount.toFixed(2) : '';
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FF166534' } },
              left: { style: 'thin', color: { argb: 'FF166534' } },
              bottom: { style: 'thin', color: { argb: 'FF166534' } },
              right: { style: 'thin', color: { argb: 'FF166534' } }
            };
          });

          currentRow += 1;
        });
      } else {
        // No transactions row
        const noDataCell1 = worksheet.getCell(currentRow, 1);
        noDataCell1.value = '';
        noDataCell1.border = {
          top: { style: 'thin', color: { argb: 'FF166534' } },
          left: { style: 'thin', color: { argb: 'FF166534' } },
          bottom: { style: 'thin', color: { argb: 'FF166534' } },
          right: { style: 'thin', color: { argb: 'FF166534' } }
        };

        const noDataCell2 = worksheet.getCell(currentRow, 2);
        noDataCell2.value = 'No transactions found';
        noDataCell2.alignment = { horizontal: 'center', vertical: 'middle' };
        noDataCell2.font = { italic: true, color: { argb: 'FF6B7280' } };
        noDataCell2.border = {
          top: { style: 'thin', color: { argb: 'FF166534' } },
          left: { style: 'thin', color: { argb: 'FF166534' } },
          bottom: { style: 'thin', color: { argb: 'FF166534' } },
          right: { style: 'thin', color: { argb: 'FF166534' } }
        };

        // Empty department cells
        renderableDepartments.forEach((_, deptIndex) => {
          const emptyCell = worksheet.getCell(currentRow, 3 + deptIndex);
          emptyCell.value = '';
          emptyCell.border = {
            top: { style: 'thin', color: { argb: 'FF166534' } },
            left: { style: 'thin', color: { argb: 'FF166534' } },
            bottom: { style: 'thin', color: { argb: 'FF166534' } },
            right: { style: 'thin', color: { argb: 'FF166534' } }
          };
        });

        currentRow += 1;
      }

      // Calculate totals and rebates
      const { testDetailTotals } = referrerTransactions.length 
        ? calculateReferrerTotals(referrerTransactions)
        : { testDetailTotals: {} };

      // TOTAL row
      const totalCell1 = worksheet.getCell(currentRow, 1);
      totalCell1.value = 'TOTAL:';
      totalCell1.font = { bold: true, color: { argb: 'FF166534' } };
      totalCell1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F7FF' } };
      totalCell1.alignment = { horizontal: 'center', vertical: 'middle' };
      totalCell1.border = {
        top: { style: 'thick', color: { argb: 'FF166534' } },
        left: { style: 'thin', color: { argb: 'FF166534' } },
        bottom: { style: 'thick', color: { argb: 'FF166534' } },
        right: { style: 'thin', color: { argb: 'FF166534' } }
      };

      const totalCell2 = worksheet.getCell(currentRow, 2);
      totalCell2.value = '';
      totalCell2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F7FF' } };
      totalCell2.border = {
        top: { style: 'thick', color: { argb: 'FF166534' } },
        left: { style: 'thin', color: { argb: 'FF166534' } },
        bottom: { style: 'thick', color: { argb: 'FF166534' } },
        right: { style: 'thin', color: { argb: 'FF166534' } }
      };

      // Department totals
      renderableDepartments.forEach((department, deptIndex) => {
        const deptId = String(department.departmentId);
        const deptTotal = testDetailTotals[deptId] || 0;

        const totalCell = worksheet.getCell(currentRow, 3 + deptIndex);
        totalCell.value = deptTotal > 0 ? deptTotal.toFixed(2) : '';
        totalCell.font = { bold: true, color: { argb: 'FF166534' } };
        totalCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F7FF' } };
        totalCell.alignment = { horizontal: 'center', vertical: 'middle' };
        totalCell.border = {
          top: { style: 'thick', color: { argb: 'FF166534' } },
          left: { style: 'thin', color: { argb: 'FF166534' } },
          bottom: { style: 'thick', color: { argb: 'FF166534' } },
          right: { style: 'thin', color: { argb: 'FF166534' } }
        };
      });

      currentRow += 1;

      // REBATES (20%) row
      const rebateCell1 = worksheet.getCell(currentRow, 1);
      rebateCell1.value = 'REBATES (20%):';
      rebateCell1.font = { bold: true, color: { argb: 'FF166534' } };
      rebateCell1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F7FF' } };
      rebateCell1.alignment = { horizontal: 'center', vertical: 'middle' };
      rebateCell1.border = {
        top: { style: 'thin', color: { argb: 'FF166534' } },
        left: { style: 'thin', color: { argb: 'FF166534' } },
        bottom: { style: 'thin', color: { argb: 'FF166534' } },
        right: { style: 'thin', color: { argb: 'FF166534' } }
      };

      const rebateCell2 = worksheet.getCell(currentRow, 2);
      rebateCell2.value = '';
      rebateCell2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F7FF' } };
      rebateCell2.border = {
        top: { style: 'thin', color: { argb: 'FF166534' } },
        left: { style: 'thin', color: { argb: 'FF166534' } },
        bottom: { style: 'thin', color: { argb: 'FF166534' } },
        right: { style: 'thin', color: { argb: 'FF166534' } }
      };

      // Department rebates (20% of each department total)
      renderableDepartments.forEach((department, deptIndex) => {
        const deptId = String(department.departmentId);
        const deptTotal = testDetailTotals[deptId] || 0;
        const deptRebate = deptTotal * 0.20;

        const rebateCell = worksheet.getCell(currentRow, 3 + deptIndex);
        rebateCell.value = deptRebate > 0 ? deptRebate.toFixed(2) : '';
        rebateCell.font = { bold: true, color: { argb: 'FF166534' } };
        rebateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F7FF' } };
        rebateCell.alignment = { horizontal: 'center', vertical: 'middle' };
        rebateCell.border = {
          top: { style: 'thin', color: { argb: 'FF166534' } },
          left: { style: 'thin', color: { argb: 'FF166534' } },
          bottom: { style: 'thin', color: { argb: 'FF166534' } },
          right: { style: 'thin', color: { argb: 'FF166534' } }
        };
      });

      currentRow += 1;

      // TOTAL REBATES row
      const grandTotal = Object.values(testDetailTotals).reduce(
        (sum, amount) => sum + parseFloat(amount || 0), 0
      );
      const totalRebates = grandTotal * 0.20;

      worksheet.mergeCells(currentRow, 1, currentRow, totalColumns);
      const totalRebatesCell = worksheet.getCell(currentRow, 1);
      totalRebatesCell.value = `TOTAL REBATES: ${totalRebates.toFixed(2)}`;
      totalRebatesCell.font = { bold: true, color: { argb: 'FF166534' } };
      totalRebatesCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }; // Yellow background
      totalRebatesCell.alignment = { horizontal: 'right', vertical: 'middle' };
      totalRebatesCell.border = {
        top: { style: 'thick', color: { argb: 'FF166534' } },
        left: { style: 'thick', color: { argb: 'FF166534' } },
        bottom: { style: 'thick', color: { argb: 'FF166534' } },
        right: { style: 'thick', color: { argb: 'FF166534' } }
      };

      currentRow += 3; // Add spacing between referrers
    });

    // Generate and download the file
    const formattedDateForFile = selectedDate.toISOString().split('T')[0];
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rebates_Report_${formattedDateForFile}.xlsx`;
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
