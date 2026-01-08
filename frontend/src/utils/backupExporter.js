import ExcelJS from 'exceljs';
import { transactionAPI, expenseAPI, referrerAPI, departmentAPI, testAPI, monthlyIncomeAPI, monthlyExpenseAPI, collectibleIncomeAPI, rebateAPI } from '../services/api';

export const exportFullBackup = async () => {
    try {
        const workbook = new ExcelJS.Workbook();

        // Set workbook properties
        workbook.creator = 'Purehealth Diagnostic Center';
        workbook.created = new Date();
        workbook.modified = new Date();

        // Fetch all data
        console.log('Fetching all data...');

        const [
            transactionsResponse,
            expensesResponse,
            referrersResponse,
            departmentsResponse,
            testsResponse,
            collectiblesResponse
        ] = await Promise.all([
            transactionAPI.getAllTransactions({ limit: 10000, page: 1, status: '' }),
            expenseAPI.getExpenses({ limit: 10000, page: 1 }),
            referrerAPI.getAllReferrers(),
            departmentAPI.getAllDepartments(),
            testAPI.getAllTests(),
            collectibleIncomeAPI.getAllCollectibleIncome()
        ]);

        console.log('Raw API responses:', {
            transactionsResponse,
            expensesResponse
        });

        console.log('Transactions response full data:', transactionsResponse.data?.data);

        console.log('Transactions response data:', transactionsResponse.data);
        console.log('Transactions response data keys:', Object.keys(transactionsResponse.data || {}));

        // Extract data arrays - try all possible paths
        let transactions = [];
        if (transactionsResponse.data) {
            if (transactionsResponse.data.data && Array.isArray(transactionsResponse.data.data.transactions)) {
                transactions = transactionsResponse.data.data.transactions;
            } else if (Array.isArray(transactionsResponse.data.transactions)) {
                transactions = transactionsResponse.data.transactions;
            } else if (Array.isArray(transactionsResponse.data.data)) {
                transactions = transactionsResponse.data.data;
            } else if (Array.isArray(transactionsResponse.data)) {
                transactions = transactionsResponse.data;
            }
        }

        console.log('Extracted transactions:', transactions.length, transactions);

        console.log('Expenses response:', expensesResponse);
        console.log('Expenses response.data:', expensesResponse.data);

        // Extract expenses - try same pattern as transactions
        let expenses = [];
        if (expensesResponse.data) {
            if (expensesResponse.data.data && Array.isArray(expensesResponse.data.data.expenses)) {
                expenses = expensesResponse.data.data.expenses;
            } else if (Array.isArray(expensesResponse.data.expenses)) {
                expenses = expensesResponse.data.expenses;
            } else if (Array.isArray(expensesResponse.data.data)) {
                expenses = expensesResponse.data.data;
            } else if (Array.isArray(expensesResponse.data)) {
                expenses = expensesResponse.data;
            }
        }

        console.log('Extracted expenses:', expenses.length, expenses);

        // Extract collectible income
        let collectibles = [];
        if (collectiblesResponse.data) {
            if (Array.isArray(collectiblesResponse.data.data)) {
                collectibles = collectiblesResponse.data.data;
            } else if (Array.isArray(collectiblesResponse.data)) {
                collectibles = collectiblesResponse.data;
            }
        }
        console.log('Extracted collectibles:', collectibles.length, collectibles);

        console.log('Referrers response:', referrersResponse);
        console.log('Referrers response.data:', referrersResponse.data);

        // Extract referrers - try same pattern as transactions
        let referrers = [];
        if (referrersResponse.data) {
            if (referrersResponse.data.data && Array.isArray(referrersResponse.data.data.referrers)) {
                referrers = referrersResponse.data.data.referrers;
            } else if (Array.isArray(referrersResponse.data.referrers)) {
                referrers = referrersResponse.data.referrers;
            } else if (Array.isArray(referrersResponse.data.data)) {
                referrers = referrersResponse.data.data;
            } else if (Array.isArray(referrersResponse.data)) {
                referrers = referrersResponse.data;
            }
        }

        console.log('Extracted referrers:', referrers.length, referrers);

        const departments = Array.isArray(departmentsResponse.data?.departments)
            ? departmentsResponse.data.departments
            : Array.isArray(departmentsResponse.data) ? departmentsResponse.data : [];

        const tests = Array.isArray(testsResponse.data?.tests)
            ? testsResponse.data.tests
            : Array.isArray(testsResponse.data) ? testsResponse.data : [];

        console.log('Data fetched:', {
            transactions: transactions.length,
            expenses: expenses.length,
            referrers: referrers.length,
            departments: departments.length,
            tests: tests.length
        });

        // 1. TRANSACTIONS SHEET
        const transactionsSheet = workbook.addWorksheet('Transactions');

        // Build dynamic headers with department columns
        const headers = ['OR#', 'Patient Name'];

        // Add each department as a column
        departments.forEach(dept => {
            headers.push(dept.departmentName + (dept.status !== 'active' ? ' (archived)' : ''));
        });

        headers.push('Gross', 'Referrer');

        // Create header row
        const headerRow = transactionsSheet.getRow(1);
        headers.forEach((header, index) => {
            const cell = headerRow.getCell(index + 1);
            cell.value = header;
            cell.font = { bold: true, color: { argb: 'FFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '166534' } };
            cell.alignment = { horizontal: 'center' };

            // Set column width
            const column = transactionsSheet.getColumn(index + 1);
            if (index === 0) column.width = 15; // OR#
            else if (index === 1) column.width = 30; // Patient Name
            else if (index === headers.length - 2) column.width = 15; // Gross
            else if (index === headers.length - 1) column.width = 25; // Referrer
            else column.width = 18; // Department columns
        });
        headerRow.commit();

        console.log('Transactions to process:', transactions.length);
        console.log('Sample transaction:', transactions[0]);
        console.log('Sample transaction keys:', Object.keys(transactions[0] || {}));
        console.log('Sample transaction.originalTransaction:', transactions[0]?.originalTransaction);
        console.log('Sample transaction.TestDetails:', transactions[0]?.TestDetails);
        console.log('Sample transaction.originalTransaction?.TestDetails:', transactions[0]?.originalTransaction?.TestDetails);

        // Add transaction data
        transactions.forEach((transaction, txIndex) => {
            const rowData = new Array(headers.length).fill('');

            if (txIndex === 0) {
                console.log('First transaction full data:', transaction);
            }

            // OR# and Patient Name
            rowData[0] = transaction.mcNo || transaction.id || transaction.transactionId || '';
            rowData[1] = `${transaction.firstName || transaction.originalTransaction?.firstName || ''} ${transaction.lastName || transaction.originalTransaction?.lastName || ''}`.trim();

            // Calculate department revenues
            const testDetails = transaction.TestDetails || transaction.originalTransaction?.TestDetails || [];
            const deptRevenues = {};

            if (txIndex === 0) {
                console.log('First transaction test details:', testDetails);
                if (testDetails.length > 0) {
                    console.log('First test detail:', testDetails[0]);
                    console.log('First test detail keys:', Object.keys(testDetails[0]));
                }
            }

            testDetails.forEach(test => {
                if (test.departmentId) {
                    if (!deptRevenues[test.departmentId]) {
                        deptRevenues[test.departmentId] = 0;
                    }
                    deptRevenues[test.departmentId] += parseFloat(test.originalPrice || test.price || 0);
                }
            });

            if (txIndex === 0) {
                console.log('First transaction dept revenues:', deptRevenues);
            }

            // Fill department columns
            let colIndex = 2;
            departments.forEach(dept => {
                rowData[colIndex] = deptRevenues[dept.departmentId] || 0;
                colIndex++;
            });

            // Gross and Referrer
            rowData[headers.length - 2] = parseFloat(transaction.totalAmount || transaction.grossDeposit || 0);

            // Find referrer name - check if it's already on the transaction
            let referrerName = transaction.referrer || 'Out Patient';

            // If not, try to look it up by referrerId
            if (!transaction.referrer && transaction.referrerId) {
                if (txIndex === 0) {
                    console.log('Transaction referrerId:', transaction.referrerId, typeof transaction.referrerId);
                    console.log('Referrers array length:', referrers.length);
                    console.log('Sample referrer:', referrers[0]);
                }
                const referrer = referrers.find(r => String(r.referrerId) === String(transaction.referrerId));
                if (txIndex === 0) {
                    console.log('Found referrer:', referrer);
                }
                if (referrer) {
                    referrerName = `Dr. ${referrer.firstName || ''} ${referrer.lastName || ''}`.trim();
                }
            }
            rowData[headers.length - 1] = referrerName;

            if (txIndex === 0) {
                console.log('First transaction row data:', rowData);
            }

            // Add row
            const dataRow = transactionsSheet.getRow(transactionsSheet.rowCount + 1);
            rowData.forEach((value, index) => {
                dataRow.getCell(index + 1).value = value;
            });
            dataRow.commit();

            // Format currency columns (departments and gross)
            for (let i = 2; i < headers.length - 1; i++) {
                if (typeof rowData[i] === 'number') {
                    dataRow.getCell(i + 1).numFmt = '#,##0.00';
                }
            }
        });

        // 2. EXPENSES SHEET
        const expensesSheet = workbook.addWorksheet('Expenses');
        expensesSheet.columns = [
            { header: 'Payee', key: 'payee', width: 20 },
            { header: 'Paid to', key: 'paidTo', width: 20 },
            { header: 'Category', key: 'category', width: 20 },
            { header: 'Department', key: 'department', width: 20 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Amount', key: 'amount', width: 12 }
        ];


        // Style header cells only (not the entire row)
        const expensesHeaderRow = expensesSheet.getRow(1);
        expensesHeaderRow.height = 25;
        for (let i = 1; i <= 6; i++) { // Columns A-F (Payee, Paid to, Category, Department, Status, Amount)
            const cell = expensesHeaderRow.getCell(i);
            cell.font = { bold: true, color: { argb: 'FFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EF4444' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
        }


        // Process expenses - each ExpenseItem becomes a row
        expenses.forEach(expense => {
            const payeeName = `${expense.firstName || ''} ${expense.lastName || ''}`.trim() || 'N/A';
            const departmentName = expense.Department?.departmentName || expense.Department?.name || 'N/A';

            // Check if expense has ExpenseItems
            if (expense.ExpenseItems && expense.ExpenseItems.length > 0) {
                // Add a row for each expense item
                expense.ExpenseItems.forEach(item => {
                    expensesSheet.addRow({
                        payee: payeeName,
                        paidTo: item.paidTo || 'N/A',
                        category: item.Category?.name || 'N/A',
                        department: departmentName,
                        status: item.status || 'active',
                        amount: parseFloat(item.amount || 0)
                    });
                });
            } else {
                // Single expense without items
                expensesSheet.addRow({
                    payee: payeeName,
                    paidTo: expense.paidTo || expense.vendor || 'N/A',
                    category: expense.Category?.name || expense.category || 'N/A',
                    department: departmentName,
                    status: expense.status || 'active',
                    amount: parseFloat(expense.totalAmount || expense.amount || 0)
                });
            }
        });
        expensesSheet.getColumn('amount').numFmt = '#,##0.00';

        // 3. MONTHLY INCOME SHEET
        const monthlyIncomeSheet = workbook.addWorksheet('Monthly Income');

        // Build dynamic headers with department columns (same as Transactions)
        const incomeHeaders = ['Day', 'Gross'];
        departments.forEach(dept => {
            incomeHeaders.push(dept.departmentName + (dept.status !== 'active' ? ' (archived)' : ''));
        });
        incomeHeaders.push('GCash');

        // Create header row
        const incomeHeaderRow = monthlyIncomeSheet.getRow(1);
        incomeHeaders.forEach((header, index) => {
            const cell = incomeHeaderRow.getCell(index + 1);
            cell.value = header;
            cell.font = { bold: true, color: { argb: 'FFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3B82F6' } };
            cell.alignment = { horizontal: 'center' };

            // Set column width
            const column = monthlyIncomeSheet.getColumn(index + 1);
            if (index === 0) column.width = 15; // Day
            else if (index === 1) column.width = 15; // Gross
            else if (index === incomeHeaders.length - 1) column.width = 15; // GCash
            else column.width = 18; // Department columns
        });
        incomeHeaderRow.commit();

        // Group transactions by day and calculate department revenues
        const dailyIncome = {};
        transactions.forEach(transaction => {
            if (transaction.status === 'cancelled') return;

            const date = new Date(transaction.transactionDate || transaction.createdAt);
            const dayKey = date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });

            if (!dailyIncome[dayKey]) {
                dailyIncome[dayKey] = {
                    date: date,
                    gross: 0,
                    gcash: 0,
                    deptRevenues: {}
                };
            }

            dailyIncome[dayKey].gross += parseFloat(transaction.totalAmount || transaction.grossDeposit || 0);
            dailyIncome[dayKey].gcash += parseFloat(transaction.totalGCashAmount || transaction.gCashAmount || 0);

            // Calculate department revenues
            const testDetails = transaction.TestDetails || transaction.originalTransaction?.TestDetails || [];
            testDetails.forEach(test => {
                if (test.departmentId) {
                    if (!dailyIncome[dayKey].deptRevenues[test.departmentId]) {
                        dailyIncome[dayKey].deptRevenues[test.departmentId] = 0;
                    }
                    dailyIncome[dayKey].deptRevenues[test.departmentId] += parseFloat(test.originalPrice || test.price || 0);
                }
            });
        });

        // Sort by date and add rows
        Object.values(dailyIncome)
            .sort((a, b) => a.date - b.date)
            .forEach(dayData => {
                const rowData = new Array(incomeHeaders.length).fill('');

                // Day and Gross
                rowData[0] = dayData.date.toLocaleDateString();
                rowData[1] = dayData.gross;

                // Department columns
                let colIndex = 2;
                departments.forEach(dept => {
                    rowData[colIndex] = dayData.deptRevenues[dept.departmentId] || 0;
                    colIndex++;
                });

                // GCash
                rowData[incomeHeaders.length - 1] = dayData.gcash;

                // Add row
                const dataRow = monthlyIncomeSheet.getRow(monthlyIncomeSheet.rowCount + 1);
                rowData.forEach((value, index) => {
                    dataRow.getCell(index + 1).value = value;
                });
                dataRow.commit();

                // Format currency columns (all except Day)
                for (let i = 1; i < incomeHeaders.length; i++) {
                    if (typeof rowData[i] === 'number') {
                        dataRow.getCell(i + 1).numFmt = '#,##0.00';
                    }
                }
            });

        // 4. MONTHLY EXPENSES SHEET (Rebates)
        const monthlyExpensesSheet = workbook.addWorksheet('Monthly Expenses');

        // Headers: Day, Paid To, Category, Amount
        const expenseHeaders = ['Day', 'Paid To', 'Category', 'Amount'];

        // Create header row
        const expenseHeaderRow = monthlyExpensesSheet.getRow(1);
        expenseHeaders.forEach((header, index) => {
            const cell = expenseHeaderRow.getCell(index + 1);
            cell.value = header;
            cell.font = { bold: true, color: { argb: 'FFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F59E0B' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: false };

            // Set column widths
            const column = monthlyExpensesSheet.getColumn(index + 1);
            if (index === 0) column.width = 15; // Day
            else if (index === 1) column.width = 20; // Paid To
            else if (index === 2) column.width = 15; // Category
            else column.width = 15; // Amount
        });
        expenseHeaderRow.height = 25;
        expenseHeaderRow.commit();

        // Filter and display rebate expenses (category = "Rebates")
        const rebateExpenses = [];
        expenses.forEach(expense => {
            if (expense.status === 'deleted' || expense.status === 'cancelled') return;

            // Check if expense has ExpenseItems with Rebates category
            if (expense.ExpenseItems && expense.ExpenseItems.length > 0) {
                expense.ExpenseItems.forEach(item => {
                    if (item.Category?.name === 'Rebates' && item.status !== 'cancelled') {
                        rebateExpenses.push({
                            date: new Date(expense.date),
                            paidTo: item.paidTo || 'N/A',
                            category: item.Category?.name || 'Rebates',
                            amount: parseFloat(item.amount || 0)
                        });
                    }
                });
            }
        });

        // Sort by date
        rebateExpenses.sort((a, b) => a.date - b.date);

        // Add rebate rows
        rebateExpenses.forEach(rebate => {
            const rowData = [
                rebate.date.toLocaleDateString(),
                rebate.paidTo,
                rebate.category,
                rebate.amount
            ];

            const dataRow = monthlyExpensesSheet.getRow(monthlyExpensesSheet.rowCount + 1);
            rowData.forEach((value, index) => {
                dataRow.getCell(index + 1).value = value;
            });
            dataRow.commit();

            // Format amount column
            dataRow.getCell(4).numFmt = '#,##0.00';
        });

        // 5. COLLECTIBLE INCOME SHEET
        const collectibleSheet = workbook.addWorksheet('Collectible Income');
        collectibleSheet.columns = [
            { header: 'Company', key: 'company', width: 25 },
            { header: 'Coordinator', key: 'coordinator', width: 20 },
            { header: 'Date', key: 'date', width: 12 },
            { header: 'Income', key: 'income', width: 12 }
        ];

        // Style header cells only (not the entire row)
        const collectibleHeaderRow = collectibleSheet.getRow(1);
        collectibleHeaderRow.height = 25;
        for (let i = 1; i <= 4; i++) { // Columns A-D (Company, Coordinator, Date, Income)
            const cell = collectibleHeaderRow.getCell(i);
            cell.font = { bold: true, color: { argb: 'FFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '8B5CF6' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
        }

        // Add collectible income data
        console.log('Processing collectible income...');
        collectibles.forEach((item) => {
            collectibleSheet.addRow({
                company: item.companyName || 'N/A',
                coordinator: item.coordinatorName || 'N/A',
                date: item.dateConducted ? new Date(item.dateConducted).toLocaleDateString() : 'N/A',
                income: parseFloat(item.totalIncome || 0)
            });
        });
        console.log(`Added ${collectibles.length} collectible income records`);
        collectibleSheet.getColumn('income').numFmt = '#,##0.00';

        // 6. DEPARTMENTS SHEET
        const departmentsSheet = workbook.addWorksheet('Departments');
        departmentsSheet.columns = [
            { header: 'Department', key: 'department', width: 25 },
            { header: 'Name', key: 'name', width: 25 },
            { header: 'Test Quantity', key: 'testQuantity', width: 15 },
            { header: 'Date Created', key: 'dateCreated', width: 15 },
            { header: 'Status', key: 'status', width: 12 }
        ];

        // Style header cells only (not the entire row)
        const departmentsHeaderRow = departmentsSheet.getRow(1);
        departmentsHeaderRow.height = 25;
        for (let i = 1; i <= 5; i++) { // Columns A-E (Department, Name, Test Quantity, Date Created, Status)
            const cell = departmentsHeaderRow.getCell(i);
            cell.font = { bold: true, color: { argb: 'FFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '10B981' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
        }

        departments.forEach(dept => {
            const testCount = tests.filter(test => test.departmentId === dept.departmentId).length;

            departmentsSheet.addRow({
                department: dept.departmentName,
                name: dept.departmentName,
                testQuantity: testCount,
                dateCreated: dept.createdAt ? new Date(dept.createdAt).toLocaleDateString() : 'N/A',
                status: dept.status || 'active'
            });
        });

        // 7. TESTS SHEET
        const testsSheet = workbook.addWorksheet('Tests');
        testsSheet.columns = [
            { header: 'Test Name', key: 'testName', width: 30 },
            { header: 'Department', key: 'department', width: 25 },
            { header: 'Price', key: 'price', width: 12 },
            { header: 'Date Created', key: 'dateCreated', width: 15 },
            { header: 'Status', key: 'status', width: 12 }
        ];

        // Style header cells only (not the entire row)
        const testsHeaderRow = testsSheet.getRow(1);
        testsHeaderRow.height = 25;
        for (let i = 1; i <= 5; i++) { // Columns A-E (Test Name, Department, Price, Date Created, Status)
            const cell = testsHeaderRow.getCell(i);
            cell.font = { bold: true, color: { argb: 'FFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '6366F1' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
        }

        tests.forEach(test => {
            const dept = departments.find(d => d.departmentId === test.departmentId);

            testsSheet.addRow({
                testName: test.testName,
                department: dept?.departmentName || 'N/A',
                price: test.price || 0,
                dateCreated: test.dateCreated ? new Date(test.dateCreated).toLocaleDateString() : 'N/A',
                status: test.status || 'active'
            });
        });
        testsSheet.getColumn('price').numFmt = '#,##0.00';

        // 8. REFERRERS SHEET
        const referrersSheet = workbook.addWorksheet('Referrers');
        referrersSheet.columns = [
            { header: 'Doctor Name', key: 'doctorName', width: 25 },
            { header: 'Clinic Name', key: 'clinicName', width: 25 },
            { header: 'Address', key: 'address', width: 30 },
            { header: 'Birth Date', key: 'birthDate', width: 12 },
            { header: 'Date Created', key: 'dateCreated', width: 15 },
            { header: 'Status', key: 'status', width: 12 }
        ];

        // Style header cells only (not the entire row)
        const referrersHeaderRow = referrersSheet.getRow(1);
        referrersHeaderRow.height = 25;
        for (let i = 1; i <= 6; i++) { // Columns A-F (Doctor Name, Clinic Name, Address, Birth Date, Date Created, Status)
            const cell = referrersHeaderRow.getCell(i);
            cell.font = { bold: true, color: { argb: 'FFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EC4899' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
        }

        referrers.forEach(referrer => {
            referrersSheet.addRow({
                doctorName: `Dr. ${referrer.firstName || ''} ${referrer.lastName || ''}`.trim(),
                clinicName: referrer.clinicName || 'N/A',
                address: referrer.clinicAddress || 'N/A',
                birthDate: referrer.birthday ? new Date(referrer.birthday).toLocaleDateString() : 'N/A',
                dateCreated: referrer.createdAt ? new Date(referrer.createdAt).toLocaleDateString() : 'N/A',
                status: referrer.status || 'active'
            });
        });

        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();

        // Create and download file
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().toISOString().split('T')[0];
        link.download = `Purehealth_Full_Backup_${timestamp}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error('Error exporting backup:', error);
        throw error;
    }
};
