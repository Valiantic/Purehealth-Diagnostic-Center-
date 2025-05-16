import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { transactionAPI, departmentAPI, referrerAPI, revenueAPI } from '../services/api';
import { isTestRefunded } from '../utils/transactionUtils';
import { formatTransactionForDisplay } from '../utils/transactionHelpers';

const useTransactionData = (selectedDate, searchTerm) => {
  const [pendingRefundAmount, setPendingRefundAmount] = useState(0);
  const queryClient = useQueryClient();

  // Fetch transactions data
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

  // Fetch departments data
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

  // Fetch referrers data
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

  // Track all refunds for the selected date
  const {
    data: refundsData,
    isLoading: isLoadingRefunds,
  } = useQuery({
    queryKey: ['refunds', selectedDate],
    queryFn: async () => {
      const response = await revenueAPI.getRefundStatistics({
        date: selectedDate.toISOString().split('T')[0] 
      });
      return response.data;
    },
    staleTime: 30000,
  });

  // Extract transactions from the data
  const rawTransactions = transactionsData?.data?.transactions || [];
  const departments = departmentsData?.data || [];
  const referrers = referrersData?.data?.data || [];

  // Format transactions for display
  const formattedTransactions = useMemo(() => {
    return rawTransactions.map(transaction => 
      formatTransactionForDisplay(transaction, referrers, departments)
    );
  }, [rawTransactions, referrers, departments]);

  // Filter transactions by search term if provided
  const filteredTransactions = useMemo(() => {
    if (!searchTerm) return formattedTransactions;
    
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return formattedTransactions.filter(transaction => 
      transaction.id.toLowerCase().includes(lowerCaseSearchTerm) ||
      transaction.name.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [formattedTransactions, searchTerm]);

  // Get only departments that have values in any transaction
  const departmentsWithValues = useMemo(() => {
    const usedDepartmentIds = new Set();
    
    filteredTransactions.forEach(transaction => {
      Object.entries(transaction.departmentRevenues).forEach(([deptId, deptData]) => {
        if (deptData.amount > 0) {
          usedDepartmentIds.add(deptId);
        }
      });
    });
    
    return departments.filter(dept => usedDepartmentIds.has(dept.departmentId.toString()));
  }, [filteredTransactions, departments]);

  // Calculate total gross income
  const totalGross = useMemo(() => {
    let total = 0;
    filteredTransactions.forEach(transaction => {
      if (transaction.status !== 'cancelled') {
        total += transaction.grossDeposit;
      }
    });
    return total;
  }, [filteredTransactions]);

  // Calculate total GCash
  const totalGCash = useMemo(() => {
    let total = 0;
    filteredTransactions.forEach(transaction => {
      if (transaction.status !== 'cancelled') {
        total += parseFloat(transaction.originalTransaction.totalGCashAmount) || 0;
      }
    });
    return total;
  }, [filteredTransactions]);

  // Calculate department totals
  const departmentTotals = useMemo(() => {
    const totals = {};
    
    departments.forEach(dept => {
      totals[dept.departmentId] = 0;
    });
    
    filteredTransactions.forEach(transaction => {
      if (transaction.status !== 'cancelled') {
        Object.entries(transaction.departmentRevenues).forEach(([deptId, deptData]) => {
          if (totals[deptId] !== undefined) {
            totals[deptId] += deptData.amount;
          }
        });
      }
    });
    
    return totals;
  }, [filteredTransactions, departments]);

  // Calculate department refund totals
  const departmentRefundTotals = useMemo(() => {
    const totals = {};
    
    departments.forEach(dept => {
      totals[dept.departmentId] = 0;
    });
    
    filteredTransactions.forEach(transaction => {
      if (transaction.status !== 'cancelled' && transaction.originalTransaction?.TestDetails) {
        transaction.originalTransaction.TestDetails.forEach(test => {
          if (isTestRefunded(test) && totals[test.departmentId] !== undefined) {
            const amount = parseFloat(test.originalPrice || test.discountedPrice) || 0;
            totals[test.departmentId] += amount;
          }
        });
      }
    });
    
    return totals;
  }, [filteredTransactions, departments]);

  // Calculate total refund amount
  const totalRefundAmount = useMemo(() => {
    let total = 0;
    
    filteredTransactions.forEach(transaction => {
      if (transaction.status !== 'cancelled' && transaction.originalTransaction?.TestDetails) {
        transaction.originalTransaction.TestDetails.forEach(test => {
          if (isTestRefunded(test)) {
            const amount = parseFloat(test.originalPrice || test.discountedPrice) || 0;
            total += amount;
          }
        });
      }
    });
    
    return total + pendingRefundAmount;
  }, [filteredTransactions, pendingRefundAmount]);

  // Count total refunded tests
  const totalRefundedTests = useMemo(() => {
    let count = 0;
    
    filteredTransactions.forEach(transaction => {
      if (transaction.status !== 'cancelled' && transaction.originalTransaction?.TestDetails) {
        transaction.originalTransaction.TestDetails.forEach(test => {
          if (isTestRefunded(test)) {
            count++;
          }
        });
      }
    });
    
    return count;
  }, [filteredTransactions]);

  // Calculate refund total directly
  const calculateRefundTotal = () => {
    let refundTotal = 0;
    let refundCount = 0;

    // Process each transaction
    filteredTransactions.forEach(transaction => {
      if (transaction.originalTransaction?.TestDetails) {
        transaction.originalTransaction.TestDetails.forEach(test => {
          if (isTestRefunded(test)) {
            refundCount++;
            const refundValue = parseFloat(test.originalPrice || test.discountedPrice) || 0;
            refundTotal += refundValue;
          }
        });
      }
    });
    
    return { 
      refundTotal, 
      refundCount 
    };
  };

  return {
    filteredTransactions,
    departments,
    departmentsWithValues,
    referrers,
    totalGross,
    totalGCash,
    departmentTotals,
    departmentRefundTotals,
    totalRefundAmount,
    totalRefundedTests,
    isLoadingTransactions,
    isLoadingDepartments,
    isLoadingReferrers,
    isLoadingRefunds,
    isError: isTransactionsError,
    error: transactionsError,
    pendingRefundAmount,
    setPendingRefundAmount,
    calculateRefundTotal
  };
};

export default useTransactionData;
