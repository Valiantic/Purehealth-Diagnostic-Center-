export const handleDecimalKeyPress = (e) => {
    // Prevent multiple decimal points
    if (e.key === '.' && e.target.value.includes('.')) {
      e.preventDefault();
      return;
    }
    // Allow only digits and a single decimal point
    if (!/[\d.]/.test(e.key)) {
      e.preventDefault();
    }
  };

export const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) {
      return '₱0.00';
    }
    
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

