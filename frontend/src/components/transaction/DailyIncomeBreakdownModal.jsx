import React from 'react';
import { X, Download } from 'lucide-react';
import ExcelJS from 'exceljs';

const DailyIncomeBreakdownModal = ({
    isOpen,
    onClose,
    breakdownData,
    selectedDate,
    user,
    adminUser,
    labels = { col1: 'Yesterday', col2: 'Today', title: 'Daily Income Report' },
    onGenerateExternal = null
}) => {
    if (!isOpen || !breakdownData) return null;

    // Helper to format full name
    const formatName = (u) => {
        if (!u) return '';
        return [u.firstName, u.middleName, u.lastName].filter(Boolean).join(' ');
    };

    const handleGenerateClick = () => {
        if (onGenerateExternal) {
            onGenerateExternal();
        } else {
            handleGenerateExcel();
        }
    };

    const handleGenerateExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(labels.title || 'Income Report');

        // Styles
        const headerFill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '166534' } // green-800
        };
        const headerFont = {
            name: 'Arial',
            color: { argb: 'FFFFFF' },
            bold: true
        };
        const titleFont = {
            name: 'Arial',
            size: 14,
            bold: true,
            color: { argb: '166534' }
        };
        const centerAlign = { horizontal: 'center', vertical: 'middle' };
        const borderStyle = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };

        // Calculate columns based on transactions table (if exists)
        const numDepts = breakdownData.departmentRevenues.length;
        // If transactions exist, use their headers, else just 3 columns
        const hasTransactions = breakdownData.transactions && breakdownData.transactions.length > 0;
        const totalCols = hasTransactions ? (4 + numDepts) : 3;

        // --- Title Section ---
        const titleRow = worksheet.getRow(1);
        titleRow.getCell(1).value = 'Purehealth Diagnostic Center Inc.';
        titleRow.getCell(1).font = titleFont;
        titleRow.getCell(1).alignment = centerAlign;
        worksheet.mergeCells(1, 1, 1, totalCols);

        const subTitleRow = worksheet.getRow(2);
        subTitleRow.getCell(1).value = 'General Mariano Alvarez, Cavite Branch';
        subTitleRow.getCell(1).font = { name: 'Arial', color: { argb: '166534' }, bold: true };
        subTitleRow.getCell(1).alignment = centerAlign;
        worksheet.mergeCells(2, 1, 2, totalCols);

        const dateRow = worksheet.getRow(3);
        dateRow.getCell(1).value = `Date: ${new Date(selectedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
        dateRow.getCell(1).font = { bold: true };

        let currentRowIdx = 5;

        // --- Transactions Section (First - if present) ---
        if (hasTransactions) {
            // Transaction Title
            const txnTitleRow = worksheet.getRow(currentRowIdx);
            txnTitleRow.getCell(1).value = 'TRANSACTION DETAILS';
            txnTitleRow.getCell(1).fill = headerFill;
            txnTitleRow.getCell(1).font = headerFont;
            txnTitleRow.getCell(1).alignment = centerAlign;
            worksheet.mergeCells(currentRowIdx, 1, currentRowIdx, totalCols);
            currentRowIdx++;

            const txnHeaderRow = worksheet.getRow(currentRowIdx);
            const txnHeaders = ['OR#', 'Patient Name', ...breakdownData.departmentRevenues.map(d => d.departmentName), 'Gross', 'Referrer'];

            txnHeaders.forEach((h, i) => {
                const cell = txnHeaderRow.getCell(i + 1);
                cell.value = h;
                cell.fill = headerFill;
                cell.font = headerFont;
                cell.border = borderStyle;
                cell.alignment = centerAlign;
            });
            currentRowIdx++;

            breakdownData.transactions.forEach(txn => {
                const row = worksheet.getRow(currentRowIdx);
                row.getCell(1).value = txn.mcNo;
                row.getCell(1).border = borderStyle;
                row.getCell(2).value = `${txn.firstName} ${txn.lastName}`;
                row.getCell(2).border = borderStyle;

                let col = 3;
                breakdownData.departmentRevenues.forEach(dept => {
                    const amount = txn.departmentAmounts?.[dept.departmentName] || 0;
                    const cell = row.getCell(col);
                    cell.value = amount > 0 ? parseFloat(amount) : '';
                    if (amount > 0) cell.numFmt = '#,##0.00';
                    cell.border = borderStyle;
                    col++;
                });

                const grossCell = row.getCell(col);
                grossCell.value = parseFloat(txn.totalAmount || 0);
                grossCell.numFmt = '#,##0.00';
                grossCell.font = { bold: true };
                grossCell.border = borderStyle;
                col++;

                const refCell = row.getCell(col);
                refCell.value = txn.referrerName || '';
                refCell.border = borderStyle;

                currentRowIdx++;
            });

            currentRowIdx += 2; // Spacer before revenue section
        }

        // --- Report Section ---
        const revTitleRow = worksheet.getRow(currentRowIdx);
        revTitleRow.getCell(1).value = labels.title.toUpperCase();
        revTitleRow.getCell(1).fill = headerFill;
        revTitleRow.getCell(1).font = headerFont;
        revTitleRow.getCell(1).alignment = centerAlign;
        worksheet.mergeCells(currentRowIdx, 1, currentRowIdx, 3); // Spans 3 columns for revenue table
        currentRowIdx++;

        // Headers
        const revHeaderRow = worksheet.getRow(currentRowIdx);
        revHeaderRow.getCell(1).value = 'Description';
        revHeaderRow.getCell(2).value = labels.col1;
        revHeaderRow.getCell(3).value = labels.col2;
        [1, 2, 3].forEach(c => {
            const cell = revHeaderRow.getCell(c);
            cell.fill = headerFill;
            cell.font = headerFont;
            cell.border = borderStyle;
            cell.alignment = centerAlign;
        });
        currentRowIdx++;

        const addRow = (label, val1, val2, isTotal = false, isHeader = false) => {
            const row = worksheet.getRow(currentRowIdx);
            row.getCell(1).value = label;
            row.getCell(2).value = val1;
            row.getCell(3).value = val2;

            [1, 2, 3].forEach(c => {
                const cell = row.getCell(c);
                cell.border = borderStyle;
                if (isHeader) {
                    cell.font = { bold: true };
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } }; // Light green
                }
                if (isTotal) {
                    cell.font = { bold: true };
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } };
                }
                if (c > 1 && typeof val1 === 'number') cell.numFmt = '"₱"#,##0.00';
            });
            currentRowIdx++;
        };

        // Revenue Items
        addRow('Revenue', '', '', true, true);
        breakdownData.departmentRevenues.forEach(dept => {
            addRow(
                dept.departmentName,
                parseFloat(dept.yesterday || 0),
                parseFloat(dept.today || 0)
            );
        });

        if (breakdownData.additionalIncome) {
            addRow('Additional Income', parseFloat(breakdownData.additionalIncome.yesterday || 0), parseFloat(breakdownData.additionalIncome.today || 0));
        }
        if (breakdownData.gcashIncome) {
            addRow('GCash Income', parseFloat(breakdownData.gcashIncome.yesterday || 0), parseFloat(breakdownData.gcashIncome.today || 0));
        }

        // Revenue Totals
        const totalRevYesterday = breakdownData.totals?.revenue?.yesterday || breakdownData.departmentRevenues.reduce((sum, d) => sum + parseFloat(d.yesterday || 0), 0) +
            parseFloat(breakdownData.additionalIncome?.yesterday || 0) +
            parseFloat(breakdownData.gcashIncome?.yesterday || 0);

        const totalRevToday = breakdownData.totals?.revenue?.today || breakdownData.departmentRevenues.reduce((sum, d) => sum + parseFloat(d.today || 0), 0) +
            parseFloat(breakdownData.additionalIncome?.today || 0) +
            parseFloat(breakdownData.gcashIncome?.today || 0);

        addRow('Total Revenue', totalRevYesterday, totalRevToday, true);

        // Expenses Section (if exists)
        if (breakdownData.departmentExpenses && breakdownData.departmentExpenses.length > 0) {
            currentRowIdx++; // Spacer
            // Expense Header
            addRow('Expenses', '', '', true, true);

            breakdownData.departmentExpenses.forEach(exp => {
                addRow(
                    exp.departmentName,
                    parseFloat(exp.yesterday || 0),
                    parseFloat(exp.today || 0)
                );
            });

            // Expense Totals
            const totalExpYesterday = breakdownData.totals?.expenses?.yesterday || 0;
            const totalExpToday = breakdownData.totals?.expenses?.today || 0;

            addRow('Total Expenses', totalExpYesterday, totalExpToday, true);

            // Net Income
            currentRowIdx++;
            const netYest = totalRevYesterday - totalExpYesterday;
            const netToday = totalRevToday - totalExpToday;
            addRow('Net Income', netYest, netToday, true);
        }

        currentRowIdx += 2; // Spacer

        // --- Signatures ---
        const sigRow1 = worksheet.getRow(currentRowIdx);
        sigRow1.getCell(1).value = 'Checked by:';
        sigRow1.getCell(1).font = { bold: true };

        const approvedCol = Math.max(3, totalCols - 1);
        sigRow1.getCell(approvedCol).value = 'Approved by:';
        sigRow1.getCell(approvedCol).font = { bold: true };

        currentRowIdx++;
        const sigRow2 = worksheet.getRow(currentRowIdx);
        sigRow2.getCell(1).value = formatName(user) || 'Unknown User';
        sigRow2.getCell(1).font = { size: 11 };

        sigRow2.getCell(approvedCol).value = formatName(adminUser) || 'Admin';
        sigRow2.getCell(approvedCol).font = { size: 11 };

        // Column Widths
        worksheet.getColumn(1).width = 25; // Wider for descriptions
        worksheet.getColumn(2).width = 20;
        worksheet.getColumn(3).width = 20;

        if (hasTransactions) {
            worksheet.getColumn(1).width = 15; // Reset if transactions present? No, Description/OR needs width.
            worksheet.getColumn(2).width = 25;
            for (let i = 3; i <= totalCols; i++) {
                worksheet.getColumn(i).width = 15;
            }
        }

        // Generate and Download
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${labels.title.replace(/\s+/g, '_')}_${new Date(selectedDate).toISOString().split('T')[0]}.xlsx`;
        anchor.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-6xl mx-auto shadow-xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Top Bar: Export Summary */}
                <div className="bg-green-800 text-white px-6 py-3 flex justify-between items-center">
                    <h3 className="font-semibold text-lg">Export Summary</h3>
                    <button onClick={onClose} className="hover:text-gray-200 transition-colors"><X size={24} /></button>
                </div>

                {/* Company Header (White) */}
                <div className="bg-white px-6 py-4 border-b border-gray-100">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-green-900">Purehealth Diagnostic Center Inc.</h2>
                        <p className="text-green-800 font-medium">General Mariano Alvarez, Cavite Branch</p>
                    </div>
                    <div className="mt-4 text-sm font-semibold text-gray-800 border-t border-gray-100 pt-3 text-left">
                        <p>Date: {new Date(selectedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {/* Transactions Table (First - if present) */}
                    {breakdownData.transactions && breakdownData.transactions.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
                            <div className="bg-green-800 text-white px-4 py-2 font-semibold">
                                Transaction Details
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-green-700 text-white text-xs uppercase">
                                            <th className="px-3 py-2 text-left font-semibold">OR#</th>
                                            <th className="px-3 py-2 text-left font-semibold">Patient Name</th>
                                            {breakdownData.departmentRevenues.map((dept, index) => (
                                                <th key={index} className="px-3 py-2 text-right font-semibold">{dept.departmentName}</th>
                                            ))}
                                            <th className="px-3 py-2 text-right font-semibold bg-green-900">Gross</th>
                                            <th className="px-3 py-2 text-left font-semibold">Referrer</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {breakdownData.transactions.map((txn, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-3 py-2 font-mono text-gray-600">{txn.mcNo}</td>
                                                <td className="px-3 py-2 font-medium text-gray-800">{txn.firstName} {txn.lastName}</td>
                                                {breakdownData.departmentRevenues.map((dept, deptIndex) => {
                                                    const amount = txn.departmentAmounts?.[dept.departmentName] || 0;
                                                    return (
                                                        <td key={deptIndex} className="px-3 py-2 text-right text-gray-600">
                                                            {amount > 0 ? parseFloat(amount).toFixed(2) : ''}
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-3 py-2 text-right font-bold text-green-800 bg-green-50">{parseFloat(txn.totalAmount || 0).toFixed(2)}</td>
                                                <td className="px-3 py-2 text-gray-600">{txn.referrerName || ''}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Report Bar */}
                    <div className="bg-green-800 text-white text-center py-2 mb-0 font-semibold uppercase tracking-wide rounded-t-lg">
                        {labels.title}
                    </div>

                    {/* Department Revenue Comparison */}
                    <div className="mb-8 bg-white rounded-b-lg shadow-sm overflow-hidden">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-green-700 text-white">
                                    <th className="border-b border-green-600 px-4 py-2 text-left w-1/3">Description</th>
                                    <th className="border-b border-green-600 px-4 py-2 text-right w-1/3">
                                        {labels.col1}
                                    </th>
                                    <th className="border-b border-green-600 px-4 py-2 text-right w-1/3">
                                        {labels.col2}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Revenue Section Header */}
                                <tr className="bg-green-50 font-bold text-green-900">
                                    <td colSpan="3" className="px-4 py-2 border-b border-green-200">Revenue</td>
                                </tr>
                                {breakdownData.departmentRevenues.map((dept, index) => (
                                    <tr key={`rev-${index}`} className="bg-white hover:bg-gray-50">
                                        <td className="border-b border-gray-200 px-4 py-3 font-medium text-gray-700 pl-8">{dept.departmentName}</td>
                                        <td className="border-b border-gray-200 px-4 py-3 text-right text-gray-600">₱{parseFloat(dept.yesterday || 0).toFixed(2)}</td>
                                        <td className="border-b border-gray-200 px-4 py-3 text-right text-gray-800 font-medium">₱{parseFloat(dept.today || 0).toFixed(2)}</td>
                                    </tr>
                                ))}
                                {breakdownData.additionalIncome && (
                                    <tr className="bg-white hover:bg-gray-50">
                                        <td className="border-b border-gray-200 px-4 py-3 font-medium text-gray-700 pl-8">Additional Income</td>
                                        <td className="border-b border-gray-200 px-4 py-3 text-right text-gray-600">₱{parseFloat(breakdownData.additionalIncome.yesterday || 0).toFixed(2)}</td>
                                        <td className="border-b border-gray-200 px-4 py-3 text-right text-gray-800 font-medium">₱{parseFloat(breakdownData.additionalIncome.today || 0).toFixed(2)}</td>
                                    </tr>
                                )}
                                {breakdownData.gcashIncome && (
                                    <tr className="bg-white hover:bg-gray-50">
                                        <td className="border-b border-gray-200 px-4 py-3 font-medium text-gray-700 pl-8">GCash Income</td>
                                        <td className="border-b border-gray-200 px-4 py-3 text-right text-gray-600">₱{parseFloat(breakdownData.gcashIncome.yesterday || 0).toFixed(2)}</td>
                                        <td className="border-b border-gray-200 px-4 py-3 text-right text-gray-800 font-medium">₱{parseFloat(breakdownData.gcashIncome.today || 0).toFixed(2)}</td>
                                    </tr>
                                )}
                                <tr className="bg-green-100 font-bold text-green-900 border-t-2 border-green-200">
                                    <td className="px-4 py-3">Total Revenue</td>
                                    <td className="px-4 py-3 text-right">
                                        ₱{(breakdownData.totals?.revenue?.yesterday || breakdownData.departmentRevenues.reduce((sum, d) => sum + parseFloat(d.yesterday || 0), 0) + parseFloat(breakdownData.additionalIncome?.yesterday || 0) + parseFloat(breakdownData.gcashIncome?.yesterday || 0)).toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        ₱{(breakdownData.totals?.revenue?.today || breakdownData.departmentRevenues.reduce((sum, d) => sum + parseFloat(d.today || 0), 0) + parseFloat(breakdownData.additionalIncome?.today || 0) + parseFloat(breakdownData.gcashIncome?.today || 0)).toFixed(2)}
                                    </td>
                                </tr>

                                {/* Expenses Section if Exists */}
                                {breakdownData.departmentExpenses && breakdownData.departmentExpenses.length > 0 && (
                                    <>
                                        <tr className="bg-green-50 font-bold text-green-900">
                                            <td colSpan="3" className="px-4 py-2 border-b border-green-200 border-t-2 border-gray-100">Expenses</td>
                                        </tr>
                                        {breakdownData.departmentExpenses.map((exp, index) => (
                                            <tr key={`exp-${index}`} className="bg-white hover:bg-gray-50">
                                                <td className="border-b border-gray-200 px-4 py-3 font-medium text-gray-700 pl-8">{exp.departmentName}</td>
                                                <td className="border-b border-gray-200 px-4 py-3 text-right text-gray-600">₱{parseFloat(exp.yesterday || 0).toFixed(2)}</td>
                                                <td className="border-b border-gray-200 px-4 py-3 text-right text-gray-800 font-medium">₱{parseFloat(exp.today || 0).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                        <tr className="bg-red-50 font-bold text-red-900 border-t-2 border-red-200">
                                            <td className="px-4 py-3">Total Expenses</td>
                                            <td className="px-4 py-3 text-right">₱{parseFloat(breakdownData.totals?.expenses?.yesterday || 0).toFixed(2)}</td>
                                            <td className="px-4 py-3 text-right">₱{parseFloat(breakdownData.totals?.expenses?.today || 0).toFixed(2)}</td>
                                        </tr>
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Signature Section */}
                    <div className="grid grid-cols-2 gap-8 mt-12 mb-4 px-8">
                        <div className="text-center">
                            <p className="font-bold text-gray-900 border-b border-gray-400 pb-2 mb-2">{formatName(user) || 'Unknown User'}</p>
                            <p className="text-sm text-gray-600 uppercase tracking-widest font-medium">Checked by</p>
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-gray-900 border-b border-gray-400 pb-2 mb-2">{formatName(adminUser) || 'Admin'}</p>
                            <p className="text-sm text-gray-600 uppercase tracking-widest font-medium">Approved by</p>
                        </div>
                    </div>
                </div>

                {/* Footer with Generate Report Button */}
                <div className="border-t border-gray-200 px-6 py-4 bg-white rounded-b-lg">
                    <button
                        onClick={handleGenerateClick}
                        className="w-full bg-green-800 text-white py-3 px-4 rounded-md font-bold text-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                        <Download size={24} />
                        Generate Report
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DailyIncomeBreakdownModal;
