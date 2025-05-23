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

