import { useQuery, useQueryClient } from '@tanstack/react-query';
import { transactionAPI, departmentAPI, referrerAPI, revenueAPI, expenseAPI } from '../../services/api';
import { isTestRefunded } from '../../utils/transactionUtils';

/**
 * Custom hook to handle data fetching and basic processing for the Transaction page
 */
export const useTransactionData = (selectedDate, expenseDate) => {
  const queryClient = useQueryClient();
  
  // Transactions data query
  const {
    data: transactionsData = { data: { transactions: [], count: 0 } },
    isLoading: isLoadingTransactions,
    isError: isTransactionsError,
    error: transactionsError,
  } = useQuery({
    queryKey: ['transactions', selectedDate],
    queryFn: async () => {
      const response = await transactionAPI.getAllTransactions({
        page: 1,
        limit: 50,
        date: selectedDate.toISOString().split('T')[0] 
      });
      return response.data;
    },
    staleTime: 30000,
  });

  // Departments data query
  const {
    data: departmentsData = { data: [] },
    isLoading: isLoadingDepartments,
  } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await departmentAPI.getAllDepartments(true);
      return response.data;
    },
    staleTime: 60000,
  });

  // Referrers data query
  const {
    data: referrersData = { data: { data: [] } },
    isLoading: isLoadingReferrers,
  } = useQuery({
    queryKey: ['referrers'],
    queryFn: async () => {
      const response = await referrerAPI.getAllReferrers(true);
      return response;
    },
    staleTime: 60000,
  });

  // Refunds data query - only enabled when there are transactions
  const {
    data: refundsData = { data: { departmentRefunds: [], totalRefund: 0 } },
    isLoading: isLoadingRefunds,
  } = useQuery({
    queryKey: ['refunds', selectedDate],
    queryFn: async () => {
      try {
        const response = await revenueAPI.getRefundsByDepartment({
          date: selectedDate.toISOString().split('T')[0]
        });
        return response.data;
      } catch (error) {
        console.error('Error fetching refunds:', error);
        // Return empty data structure instead of throwing error
        return {
          data: {
            departmentRefunds: [],
            totalRefund: 0,
            departmentCancellations: [],
            totalCancelled: 0,
            refundDetails: {
              deptRevenueTotalRefund: 0,
              rawTotalRefund: 0,
              metadataRefundTotal: 0,
              totalTestRefunds: 0
            }
          }
        };
      }
    },
    staleTime: 30000,
    enabled: true, // Always enabled but with error handling
    retry: 1, // Only retry once
    retryDelay: 500, // Wait 500ms before retry
  });

  // Expenses data query
  const {
    data: expensesData = { data: [] },
    isLoading: isLoadingExpenses,
    isError: isExpensesError,
    error: expensesError,
  } = useQuery({
    queryKey: ['expenses', expenseDate],
    queryFn: async () => {
      try {
        const dateStr = expenseDate.toISOString().split('T')[0];
        const response = await expenseAPI.getExpenses({ date: dateStr });
        return response;
      } catch (error) {
        console.error('Error fetching expenses:', error);
        throw error;
      }
    },
    staleTime: 0, 
    refetchOnWindowFocus: false, 
    refetchOnMount: true, 
  });

  // Process raw data into more usable formats
  const transactions = (() => {
    if (Array.isArray(transactionsData)) return transactionsData;
    if (transactionsData?.data?.transactions) return transactionsData.data.transactions;
    if (transactionsData?.transactions) return transactionsData.transactions;
    if (Array.isArray(transactionsData?.data)) return transactionsData.data;
    return [];
  })();

  const departments = (() => {
    if (Array.isArray(departmentsData)) return departmentsData;
    if (Array.isArray(departmentsData?.data)) return departmentsData.data;
    if (departmentsData?.departments && Array.isArray(departmentsData.departments)) return departmentsData.departments;
    return [];
  })();

  const referrers = referrersData?.data?.data || [];
  const departmentRefunds = refundsData?.data?.departmentRefunds || [];

  // Process expenses data
  const expenses = (() => {
    let rawExpenses = [];
    
    if (Array.isArray(expensesData)) {
      rawExpenses = expensesData;
    } else if (expensesData?.data && Array.isArray(expensesData.data)) {
      rawExpenses = expensesData.data;
    } else if (expensesData?.data?.data && Array.isArray(expensesData.data.data)) {
      rawExpenses = expensesData.data.data;
    } else if (expensesData?.expenses && Array.isArray(expensesData.expenses)) {
      rawExpenses = expensesData.expenses;
    } else {
      console.warn('Could not find expenses array in response:', expensesData);
      rawExpenses = [];
    }
    
    const year = expenseDate.getFullYear();
    const month = String(expenseDate.getMonth() + 1).padStart(2, '0'); 
    const day = String(expenseDate.getDate()).padStart(2, '0');
    const selectedDateStr = `${year}-${month}-${day}`;
        
    const filteredByDate = rawExpenses.filter(expense => {
      if (!expense) return false;
      
      const expenseDateStr = expense.createdAt || expense.date || expense.expenseDate;
      if (!expenseDateStr) return false;
      
      try {
        const expDate = new Date(expenseDateStr);
        const expYear = expDate.getFullYear();
        const expMonth = String(expDate.getMonth() + 1).padStart(2, '0');
        const expDay = String(expDate.getDate()).padStart(2, '0');
        
        const expDateStr = `${expYear}-${expMonth}-${expDay}`;
        
        return expDateStr === selectedDateStr;
      } catch (e) {
        console.error('Error comparing dates:', e);
        return false;
      }
    });
    
    return filteredByDate;
  })();

  // Create department totals objects
  const departmentTotals = {};
  const departmentBalanceTotals = {}; 
  const departmentRefundTotals = {};

  if (departments && departments.length > 0) {
    departments.forEach(dept => {
      if (dept && dept.departmentId) {
        departmentRefundTotals[dept.departmentId] = 0;
        departmentBalanceTotals[dept.departmentId] = 0;
        departmentTotals[dept.departmentId] = 0;
      }
    });
  }

  const processTransactions = (transactions, departments, referrers, searchTerm) => {
    // Process transactions into the format needed for display
    const processedTransactions = transactions
      .filter((transaction) => {
        if (!transaction.createdAt) return true; 
        
        const transactionDate = new Date(transaction.createdAt);
        return (
          transactionDate.getDate() === selectedDate.getDate() &&
          transactionDate.getMonth() === selectedDate.getMonth() &&
          transactionDate.getFullYear() === selectedDate.getFullYear()
        );
      })
      .map((transaction) => {
        const departmentRevenues = {};
        departments.forEach((dept) => {
          departmentRevenues[dept.departmentId] = {
            name: dept.departmentName,
            amount: 0,
            isActive: dept.status === 'active',
            refundAmount: 0,
            balanceAmount: 0 
          };
        });

        if (transaction.TestDetails && transaction.TestDetails.length > 0) {
          transaction.TestDetails.forEach((test) => {
            const deptId = test.departmentId;
            if (!departmentRevenues[deptId]) return;
            
            if (isTestRefunded(test)) {
              departmentRevenues[deptId].refundAmount += parseFloat(test.originalPrice || test.discountedPrice) || 0;
            } else {
              const testPrice = parseFloat(test.discountedPrice) || 0;
              const balanceAmount = parseFloat(test.balanceAmount) || 0;
              
              departmentRevenues[deptId].balanceAmount += balanceAmount;
              
              departmentRevenues[deptId].amount += (testPrice - balanceAmount);
            }
          });
        }
        
        let grossDeposit = 0;
        // Use the transaction's totalAmount which includes PWD/Senior discount, minus total balance
        if (transaction.totalAmount !== undefined && transaction.totalAmount !== null) {
          const totalAmount = parseFloat(transaction.totalAmount) || 0;
          const totalBalance = parseFloat(transaction.totalBalanceAmount) || 0;
          grossDeposit = totalAmount - totalBalance;
        } else if (transaction.TestDetails && transaction.TestDetails.length > 0) {
          // Fallback: calculate from test details for older transactions
          grossDeposit = transaction.TestDetails
            .filter(test => test.status !== 'refunded')
            .reduce((sum, test) => {
              const testPrice = parseFloat(test.discountedPrice) || 0;
              const balanceAmount = parseFloat(test.balanceAmount) || 0;
              return sum + (testPrice - balanceAmount);
            }, 0);
        } else {
          grossDeposit = parseFloat(transaction.totalCashAmount) + parseFloat(transaction.totalGCashAmount);
        }
        let referrerName = 'Out Patient';
        
        if (transaction.referrerId) {
          const transactionReferrerId = String(transaction.referrerId);
          const referrer = referrers.find(ref => String(ref.referrerId) === transactionReferrerId);
          
          if (referrer) {
            referrerName = referrer.lastName ? `Dr. ${referrer.lastName}` : 'Unknown';
          } else {
            referrerName = 'Out Patient';    
          }
        }

        return {
          id: transaction.mcNo,
          name: `${transaction.firstName} ${transaction.lastName}`,
          departmentRevenues,
          referrer: referrerName,
          referrerId: transaction.referrerId,
          grossDeposit: grossDeposit,
          status: transaction.status,
          originalTransaction: transaction,
          hasRefunds: transaction.TestDetails?.some(test => isTestRefunded(test)) || false,
          refundDate: transaction.TestDetails?.find(test => isTestRefunded(test))?.updatedAt || null
        };
      });

    // Filter by search term if provided
    const filteredTransactions = searchTerm ? 
      processedTransactions.filter((transaction) => {
        return (
          transaction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }) : processedTransactions;

    return filteredTransactions;
  };

  // Calculate department totals from transactions
  const calculateDepartmentTotals = (filteredTransactions) => {
    // Reset totals
    Object.keys(departmentTotals).forEach(key => {
      departmentTotals[key] = 0;
      departmentBalanceTotals[key] = 0;
    });
    
    filteredTransactions.forEach((transaction) => {
      // Only process non-cancelled transactions for totals
      if (transaction.status !== 'cancelled') {
        // Use the departmentRevenues amounts that were already calculated correctly in processTransactions
        Object.entries(transaction.departmentRevenues).forEach(([deptId, data]) => {
          departmentTotals[deptId] = (departmentTotals[deptId] || 0) + data.amount;
          departmentBalanceTotals[deptId] = (departmentBalanceTotals[deptId] || 0) + (data.balanceAmount || 0);
        });
      }
    });

    return {
      departmentTotals,
      departmentBalanceTotals,
      departmentRefundTotals
    };
  };

  // Get departments that have values
  const getDepartmentsWithValues = () => {
    return departments.filter(dept => 
      departmentTotals[dept.departmentId] > 0 || departmentRefundTotals[dept.departmentId] > 0 || dept.status === 'active'
    );
  };

  // Calculate total values
  const calculateTotalValues = (filteredTransactions) => {

    const totalGross = filteredTransactions.reduce((sum, transaction) => {
      if (transaction.status === 'cancelled') {
        return sum;
      }

      // Use the transaction's totalAmount which includes PWD/Senior discount, minus total balance
      if (transaction.originalTransaction?.totalAmount !== undefined && transaction.originalTransaction?.totalAmount !== null) {
        const totalAmount = parseFloat(transaction.originalTransaction.totalAmount) || 0;
        const totalBalance = parseFloat(transaction.originalTransaction.totalBalanceAmount) || 0;
        return sum + (totalAmount - totalBalance);
      }

      // Fallback: Use grossDeposit if available
      if (typeof transaction.grossDeposit === 'number') {
        return sum + transaction.grossDeposit;
      }

      // Last resort: calculate from test details (for older transactions)
      if (transaction.originalTransaction?.TestDetails?.length > 0) {
        let transactionTotal = transaction.originalTransaction.TestDetails
          .filter(test => test.status !== 'cancelled' && test.status !== 'refunded')
          .reduce((testSum, test) => {
            const price = parseFloat(test.discountedPrice || 0);
            const balance = parseFloat(test.balanceAmount || 0);
            return testSum + (price - balance);
          }, 0);
        return sum + transactionTotal;
      }
      
      return sum + parseFloat(transaction.originalTransaction?.totalAmount || 0);
    }, 0);

    const totalGCash = filteredTransactions.reduce((sum, transaction) => {
      if (transaction.status === 'cancelled') {
        return sum;
      }

      if (transaction.originalTransaction?.TestDetails?.length > 0) {
        const gCashTotal = transaction.originalTransaction.TestDetails
          .filter(test => test.status !== 'cancelled' && test.status !== 'refunded')
          .reduce((testSum, test) => {
            // Always use the actual recorded gCashAmount which should reflect any discount
            const gCashAmount = parseFloat(test.gCashAmount || 0);
            return testSum + gCashAmount;
          }, 0);
        
        return sum + gCashTotal;
      }
      
      return sum + parseFloat(transaction.originalTransaction?.totalGCashAmount || 0);
    }, 0);

    return { totalGross, totalGCash };
  };

  // Filter expenses by search term
  const filterExpenses = (expenses, searchTerm) => {
    if (!searchTerm) return expenses;
    
    return expenses.filter((expense) => {
      if (!expense) return false;
      
      const name = String(expense.name || '').toLowerCase();
      const purpose = String(expense.purpose || expense.expensePurpose || expense.description || '').toLowerCase();
      const department = String(expense.departmentName || 
                       (expense.department?.departmentName) || 
                       (expense.Department?.departmentName) || '').toLowerCase();
      const amount = String(expense.amount || expense.expenseAmount || 0);
      
      let itemsMatch = false;
      if (expense.ExpenseItems && Array.isArray(expense.ExpenseItems)) {
        itemsMatch = expense.ExpenseItems.some(item => {
          const itemPurpose = String(item.purpose || item.description || '').toLowerCase();
          const itemAmount = String(item.amount || 0);
          
          return itemPurpose.includes(searchTerm.toLowerCase()) || 
                 itemAmount.includes(searchTerm);
        });
      }
      
      const searchLower = searchTerm.toLowerCase();
      
      return searchLower === '' || 
             name.includes(searchLower) || 
             purpose.includes(searchLower) || 
             department.includes(searchLower) ||
             amount.includes(searchTerm) ||
             itemsMatch;
    });
  };

  // Calculate total expense
  const calculateTotalExpense = (filteredExpenses) => {
    return filteredExpenses.reduce((sum, expense) => {
      if (expense.ExpenseItems && Array.isArray(expense.ExpenseItems) && expense.ExpenseItems.length > 0) {
        const itemsTotal = expense.ExpenseItems.reduce((itemSum, item) => {
          const itemAmount = parseFloat(item.amount || 0);
          return itemSum + (isNaN(itemAmount) ? 0 : itemAmount);
        }, 0);
        return sum + itemsTotal;
      } else {
        const amount = parseFloat(expense.amount || expense.expenseAmount || 0);
        return sum + (isNaN(amount) ? 0 : amount);
      }
    }, 0);
  };

  // Refetch functions
  const refetchTransactionData = () => {
    queryClient.refetchQueries({
      queryKey: ['transactions', selectedDate],
      exact: true
    });
    queryClient.refetchQueries({
      queryKey: ['refunds', selectedDate],
      exact: true
    });
  };

  const refetchExpenseData = (date) => {
    const dateToUse = date || expenseDate;
    
    let dateStr;
    try {
      if (dateToUse instanceof Date && !isNaN(dateToUse.getTime())) {
        dateStr = dateToUse.toISOString().split('T')[0];
      } else {
        dateStr = new Date().toISOString().split('T')[0];
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      dateStr = new Date().toISOString().split('T')[0];
    }
        
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    
    return queryClient.fetchQuery({
      queryKey: ['expenses', dateToUse],
      queryFn: () => expenseAPI.getExpenses({ date: dateStr })
    });
  };

  return {
    // Raw data
    transactions,
    departments,
    referrers,
    departmentRefunds,
    expenses,
    
    // Loading states
    isLoading: isLoadingTransactions || isLoadingDepartments || isLoadingReferrers || isLoadingRefunds || isLoadingExpenses,
    isLoadingTransactions,
    isLoadingExpenses,
    
    // Error states
    isTransactionsError,
    transactionsError,
    isExpensesError,
    expensesError,
    
    // Data processing functions
    processTransactions,
    calculateDepartmentTotals,
    getDepartmentsWithValues,
    calculateTotalValues,
    filterExpenses,
    calculateTotalExpense,
    
    // Refetch functions
    refetchTransactionData,
    refetchExpenseData,
    
    // Department totals
    departmentTotals,
    departmentBalanceTotals,
    departmentRefundTotals
  };
};
