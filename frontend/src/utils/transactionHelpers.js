import { toast } from 'react-toastify';
import { transactionAPI } from '../services/api';

// Format transaction data from API response for display
export const formatTransactionForDisplay = (transaction, referrers, departments) => {
  if (!transaction) return null;
  
  // Find referrer name
  let referrerName = 'Out Patient';
  if (transaction.referrerId) {
    const referrer = referrers.find(ref => 
      String(ref.referrerId) === String(transaction.referrerId)
    );
    if (referrer) {
      referrerName = referrer.lastName ? `Dr. ${referrer.lastName}` : 'Unknown';
    }
  }
  
  // Group test details by department
  const departmentRevenues = {};
  departments.forEach((dept) => {
    departmentRevenues[dept.departmentId] = {
      name: dept.departmentName,
      amount: 0,
      isActive: dept.status === 'active',
      refundAmount: 0
    };
  });
  
  // Sum up revenue for each department
  if (transaction.TestDetails && transaction.TestDetails.length > 0) {
    transaction.TestDetails.forEach((test) => {
      if (departmentRevenues[test.departmentId]) {
        if (test.status === 'refunded') {
          departmentRevenues[test.departmentId].refundAmount += parseFloat(test.originalPrice || test.discountedPrice) || 0;
        } else {
          departmentRevenues[test.departmentId].amount += parseFloat(test.discountedPrice) || 0;
        }
      }
    });
  }
  
  return {
    id: transaction.mcNo,
    name: `${transaction.firstName} ${transaction.lastName}`,
    departmentRevenues,
    referrer: referrerName,
    grossDeposit: parseFloat(transaction.totalCashAmount) + parseFloat(transaction.totalGCashAmount),
    status: transaction.status,
    originalTransaction: transaction
  };
};

// Validate transaction data before saving
export const validateTransaction = (data) => {
  // Check required fields
  const requiredFields = [
    { field: 'mcNo', label: 'MC#' },
    { field: 'firstName', label: 'First Name' },
    { field: 'lastName', label: 'Last Name' }
  ];
  
  const errors = [];
  
  for (const field of requiredFields) {
    if (!data[field.field]) {
      errors.push(`${field.label} is required`);
    }
  }
  
  // Validate test details
  if (data.TestDetails && data.TestDetails.length > 0) {
    data.TestDetails.forEach((test, index) => {
      if (!test.testName) {
        errors.push(`Test #${index + 1} requires a name`);
      }
      if (parseFloat(test.discountedPrice) <= 0) {
        errors.push(`Test #${index + 1} must have a price greater than 0`);
      }
    });
  } else {
    errors.push('At least one test is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Check if MC# exists in the database
export const checkMcNoExists = async (mcNo) => {
  try {
    const response = await transactionAPI.checkMcNoExists(mcNo);
    return response.data.exists;
  } catch (error) {
    console.error('Error checking MC#:', error);
    toast.error('Failed to check if MC# exists.');
    return false;
  }
};

// Recalculate totals after test changes
export const recalculateTestTotals = (transaction, selectedRefunds = {}) => {
  if (!transaction || !transaction.originalTransaction) return transaction;
  
  const updatedTransaction = {...transaction};
  
  let totalCash = 0;
  let totalGCash = 0;
  let totalBalance = 0;
  
  updatedTransaction.originalTransaction.TestDetails.forEach(test => {
    // Skip tests that are refunded or selected for refund
    if (test.status !== 'refunded' && !selectedRefunds[test.testDetailId]) {
      totalCash += parseFloat(test.cashAmount || 0);
      totalGCash += parseFloat(test.gCashAmount || 0);
      totalBalance += parseFloat(test.balanceAmount || 0);
    }
  });
  
  // Update totals in the transaction
  updatedTransaction.originalTransaction.totalCashAmount = totalCash.toFixed(2);
  updatedTransaction.originalTransaction.totalGCashAmount = totalGCash.toFixed(2);
  updatedTransaction.originalTransaction.totalBalanceAmount = totalBalance.toFixed(2);
  
  return updatedTransaction;
};

// Calculate refunds directly for immediate UI feedback
export const directRefundCalculation = (transactions) => {
  let refundTotal = 0;
  let refundCount = 0;

  // Process each transaction
  transactions.forEach(transaction => {
    if (transaction.originalTransaction?.TestDetails) {
      transaction.originalTransaction.TestDetails.forEach(test => {
        if (test.status === 'refunded') {
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
