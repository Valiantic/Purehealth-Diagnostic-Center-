
export const isTestRefunded = (test) => {
  if (!test) return false;
  
  // Primary check: explicit status
  if (test.status) {
    const status = test.status.toLowerCase();
    if (status === 'refunded' || status === 'refund') {
      return true;
    }
  }
  
  // Secondary check: explicit isRefunded flag
  if (test.isRefunded === true) {
    return true;
  }
  
  // Tertiary check: discounted price is 0 but original price exists (common refund indicator)
  if (parseFloat(test.discountedPrice) === 0 && parseFloat(test.originalPrice) > 0) {
    return true;
  }
  
  // Additional check: any refund-related property set to true
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
      
      // Calculate proper refund amount based on discounts
      let refundAmount;
      
      // Check if this is a PWD or Senior Citizen transaction
      const idType = (transaction.originalTransaction?.idType || '').trim().toLowerCase();
      const isSpecialDiscount = idType === 'person with disability' || idType === 'senior citizen';
      
      if (isSpecialDiscount) {
        // For PWD/Senior Citizens, always calculate with 20% discount
        if (test.discountedPrice && parseFloat(test.discountedPrice) > 0) {
          refundAmount = parseFloat(test.discountedPrice);
        } else {
          // Calculate 20% discount from original price
          const originalPrice = parseFloat(test.originalPrice || 0);
          refundAmount = originalPrice * 0.8;
        }
      } else if (test.discountPercentage && parseFloat(test.discountPercentage) > 0) {
        // For regular discount, calculate based on percentage
        const originalPrice = parseFloat(test.originalPrice || 0);
        const discountPercent = parseFloat(test.discountPercentage);
        refundAmount = originalPrice * (1 - discountPercent/100);
      } else {
        // Default fallback
        refundAmount = parseFloat(test.discountedPrice || test.originalPrice) || 0;
      }
      
      amount += refundAmount;
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
        // Always use discountedPrice which includes any discounts (including PWD/Senior 20%)
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
    // Skip refunded tests from cancelled transactions
    if (transaction.status === 'cancelled') return;
    
    if (!transaction.originalTransaction?.TestDetails) return;
    
    transaction.originalTransaction.TestDetails.forEach(test => {
      if (isTestRefunded(test)) {
        refundedTestCount++;
        
        // Calculate refund amount based on what was actually paid (discounted price)
        // This ensures we capture the full refund amount regardless of payment method (cash/GCash)
        let refundAmount;
        
        // First check if this is a PWD or Senior Citizen transaction
        const idType = (transaction.originalTransaction?.idType || '').trim().toLowerCase();
        const isSpecialDiscount = idType === 'person with disability' || idType === 'senior citizen';
        
        if (isSpecialDiscount) {
          // For PWD/Senior Citizens, use discounted price which already includes 20% discount
          if (test.discountedPrice && parseFloat(test.discountedPrice) > 0) {
            refundAmount = parseFloat(test.discountedPrice);
          } else {
            // Calculate 20% discounted price from original price as fallback
            const originalPrice = parseFloat(test.originalPrice || 0);
            refundAmount = originalPrice * 0.8; // Apply 20% discount
          }
        } else if (test.discountPercentage && parseFloat(test.discountPercentage) > 0) {
          // For tests with custom discount percentages, calculate based on that
          const originalPrice = parseFloat(test.originalPrice || 0);
          const discountPercent = parseFloat(test.discountPercentage);
          refundAmount = originalPrice * (1 - discountPercent/100);
        } else {
          // For regular tests, use discounted price (which is the actual amount paid)
          // This covers both cash and GCash payments equally
          refundAmount = parseFloat(test.discountedPrice || test.originalPrice) || 0;
        }
        
        // Alternative calculation: if we have payment information, use the sum of all payments
        // This ensures we capture the actual refund amount for tests paid with any combination of cash/GCash
        const cashAmount = parseFloat(test.cashAmount || 0);
        const gCashAmount = parseFloat(test.gCashAmount || 0);
        const totalPaid = cashAmount + gCashAmount;
        
        // Use the higher of calculated refund amount or total paid amount
        // This ensures we don't miss any refunds, especially for GCash payments
        if (totalPaid > 0 && totalPaid > refundAmount) {
          refundAmount = totalPaid;
        }
        
        totalRefundAmount += refundAmount;
      }
    });
  });
  
  return {
    totalRefundAmount,
    refundedTestCount
  };
};
