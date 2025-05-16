
export const isTestRefunded = (test) => {
  if (!test) return false;
  
  if (test.status) {
    const status = test.status.toLowerCase();
    if (status === 'refunded' || status === 'refund') {
      return true;
    }
  }
  
  if (test.isRefunded === true) {
    return true;
  }
  
  if (parseFloat(test.discountedPrice) === 0 && parseFloat(test.originalPrice) > 0) {
    return true;
  }
  
  for (const key in test) {
    if (key.toLowerCase().includes('refund') && test[key] === true) {
      return true;
    }
  }
  
  return false;
};

export const getRefundedTestsInfo = (transaction) => {
  if (!transaction?.originalTransaction?.TestDetails) return { count: 0, amount: 0 };
  
  let count = 0;
  let amount = 0;
  
  transaction.originalTransaction.TestDetails.forEach(test => {
    if (test.status === 'refunded') {
      count++;
      amount += parseFloat(test.originalPrice || test.discountedPrice) || 0;
    }
  });
  
  return { count, amount };
};

export const formatTransactionForDisplay = (transaction, departments = [], referrers = []) => {
  if (!transaction) return null;
  
  let referrerName = 'Out Patient';
  if (transaction.referrerId && Array.isArray(referrers)) {
    const referrer = referrers.find(ref => 
      ref && String(ref.referrerId) === String(transaction.referrerId)
    );
    if (referrer) {
      referrerName = referrer.lastName ? `Dr. ${referrer.lastName}` : 'Unknown';
    }
  }
  
  const departmentRevenues = {};
  
  if (Array.isArray(departments)) {
    departments.forEach((dept) => {
      if (dept && dept.departmentId) {
        departmentRevenues[dept.departmentId] = {
          name: dept.departmentName || 'Unknown',
          amount: 0,
          isActive: dept.status === 'active',
        };
      }
    });
  }
  
  if (transaction.TestDetails && Array.isArray(transaction.TestDetails) && transaction.TestDetails.length > 0) {
    transaction.TestDetails.forEach((test) => {
      if (test && test.departmentId && departmentRevenues[test.departmentId]) {
        departmentRevenues[test.departmentId].amount += parseFloat(test.discountedPrice) || 0;
      }
    });
  }
  
  let grossDeposit = 0;
  if (transaction.TestDetails && Array.isArray(transaction.TestDetails)) {
    grossDeposit = transaction.TestDetails
      .filter(test => test && test.status !== 'refunded')
      .reduce((sum, test) => {
        const testPrice = parseFloat(test.discountedPrice) || 0;
        const balanceAmount = parseFloat(test.balanceAmount) || 0;
        return sum + (testPrice - balanceAmount);
      }, 0);
  } else {
    grossDeposit = parseFloat(transaction.totalCashAmount || 0) + parseFloat(transaction.totalGCashAmount || 0);
  }
  
  return {
    id: transaction.mcNo || 'Unknown',
    name: `${transaction.firstName || ''} ${transaction.lastName || ''}`.trim() || 'Unknown',
    departmentRevenues,
    referrer: referrerName,
    referrerId: transaction.referrerId,
    grossDeposit: grossDeposit,
    status: transaction.status || 'active',
    originalTransaction: transaction,
    hasRefunds: transaction.TestDetails?.some(test => test && isTestRefunded(test)) || false,
    refundDate: transaction.TestDetails?.find(test => test && isTestRefunded(test))?.updatedAt || null
  };
};

export const calculateRefundTotal = (filteredTransactions) => {
  let totalRefundAmount = 0;
  let refundedTestCount = 0;
  
  filteredTransactions.forEach(transaction => {
    if (!transaction.originalTransaction?.TestDetails) return;
    
    transaction.originalTransaction.TestDetails.forEach(test => {
      if (isTestRefunded(test)) {
        refundedTestCount++;
        
        const refundAmount = parseFloat(test.originalPrice || test.discountedPrice) || 0;
        totalRefundAmount += refundAmount;
      }
    });
  });
  
  return {
    totalRefundAmount,
    refundedTestCount
  };
};
