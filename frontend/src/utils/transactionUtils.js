/**
 * Transaction utility functions for formatting and calculation
 */

// Helper function to format date as DD-MMM-YYYY
export const formatDate = (date) => {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

// Format date as MM/DD/YY
export const formatShortDate = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  
  return `${month}/${day}/${year}`;
};

// Calculate age based on birthdate
export const calculateAge = (birthdate) => {
  if (!birthdate) return '';
  
  const birthDate = new Date(birthdate);
  if (isNaN(birthDate.getTime())) return '';
  
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // Adjust age if birthday hasn't occurred yet this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// Helper function to check if a test is refunded
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

// Get refunded tests information for a transaction
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

// Format transaction data from API response for display
export const formatTransactionForDisplay = (transaction, referrers, departments) => {
  if (!transaction) return null;
  
  // Find referrer name
  let referrerName = 'Out Patient';
  if (transaction.referrerId && referrers) {
    const referrer = referrers.find(ref => 
      String(ref.referrerId) === String(transaction.referrerId)
    );
    if (referrer) {
      referrerName = referrer.lastName ? `Dr. ${referrer.lastName}` : 'Unknown';
    }
  }
  
  // Group test details by department
  const departmentRevenues = {};
  if (departments) {
    departments.forEach((dept) => {
      departmentRevenues[dept.departmentId] = {
        name: dept.departmentName,
        amount: 0,
        isActive: dept.status === 'active',
      };
    });
  }
  
  // Sum up revenue for each department
  if (transaction.TestDetails && transaction.TestDetails.length > 0) {
    transaction.TestDetails.forEach((test) => {
      if (departmentRevenues[test.departmentId]) {
        departmentRevenues[test.departmentId].amount += parseFloat(test.discountedPrice) || 0;
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

// Remove spinner style from number inputs
export const noSpinnerStyle = { 
  WebkitAppearance: 'none',
  MozAppearance: 'textfield',
  margin: 0, 
  appearance: 'textfield' 
};

// ID Type options for dropdown
export const idTypeOptions = [
  { value: 'Regular', label: 'Regular' },
  { value: 'Person with Disability', label: 'PWD' },
  { value: 'Senior Citizen', label: 'Senior Citizen' }
];
