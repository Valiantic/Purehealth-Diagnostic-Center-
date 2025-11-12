import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { formatTransactionForDisplay } from '../../utils/transactionUtils';

/**
 * Custom hook to manage transaction-related state and actions.
 */

export const useTransactionManagement = (user, selectedDate, departments, referrers, discountCategories = []) => {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [openExpenseMenuId, setOpenExpenseMenuId] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [transactionToCancel, setTransactionToCancel] = useState(null);
  const [isTransactionSummaryOpen, setIsTransactionSummaryOpen] = useState(false);
  const [selectedSummaryTransaction, setSelectedSummaryTransaction] = useState(null);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editedSummaryTransaction, setEditedSummaryTransaction] = useState(null);
  const [mcNoExists, setMcNoExists] = useState(false);
  const [isMcNoChecking, setIsMcNoChecking] = useState(false);
  const [isRefundMode, setIsRefundMode] = useState(false);
  const [selectedRefunds, setSelectedRefunds] = useState({});
  const [potentialRefundAmount, setPotentialRefundAmount] = useState(0);
  const [refundAmounts, setRefundAmounts] = useState({});
  const [pendingRefundAmount, setPendingRefundAmount] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [editedTransaction, setEditedTransaction] = useState(null);
  
  const queryClient = useQueryClient();

  useEffect(() => {
    const paymentRefunds = Object.values(refundAmounts).reduce((sum, amount) => {
      return sum + amount;
    }, 0);
    
    setPotentialRefundAmount(paymentRefunds);
  }, [refundAmounts]);

  // Toggle dropdown menu for income rows
  const toggleIncomeMenu = (id) => {
    setOpenMenuId((prevId) => (prevId === id ? null : id));
    // Close expense menu if open
    if (openExpenseMenuId) setOpenExpenseMenuId(null);
  };

  // Toggle dropdown menu for expense rows
  const toggleExpenseMenu = (id) => {
    setOpenExpenseMenuId((prevId) => (prevId === id ? null : id));
    // Close income menu if open
    if (openMenuId) setOpenMenuId(null);
  };

  // Prevent menu close when clicking on the dropdown itself
  const handleDropdownClick = (e) => {
    e.stopPropagation();
  };

  // Cancel transaction mutation
  const cancelTransactionMutation = useMutation({
    mutationFn: (transactionId) => {
      return transactionAPI.updateTransactionStatus(
        transactionId,
        'cancelled',
        user.userId
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['transactions'],
        exact: false,
        refetchType: 'all'
      });
      setIsConfirmModalOpen(false);
      setTransactionToCancel(null);
    },
    onError: (error) => {
      console.error('Failed to cancel transaction:', error);
      toast.error(`Failed to cancel transaction: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    }
  });

  // Handle cancel button click
  const handleCancelClick = (transaction) => {
    setTransactionToCancel(transaction);
    setIsConfirmModalOpen(true);
    setOpenMenuId(null); // Close the dropdown
  };

  // Explicitly close the confirmation modal
  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setTransactionToCancel(null);
  };

  // Confirm cancellation
  const confirmCancellation = () => {
    if (!transactionToCancel) {
      toast.error('No transaction selected for cancellation');
      return;
    }
    
    const transactionId = transactionToCancel.originalTransaction?.transactionId;
    
    if (!transactionId) {
      toast.error('Invalid transaction ID');
      setIsConfirmModalOpen(false);
      return;
    }
    
    if (!user?.userId) {
      toast.error('User ID is missing - please try logging in again');
      setIsConfirmModalOpen(false);
      return;
    }
    
    cancelTransactionMutation.mutate(transactionId);
  };

  // Handle edit changes
  const handleEditChange = (e, field) => {
    setEditedTransaction({
      ...editedTransaction,
      [field]: e.target.value
    });
  };

  // Cancel inline editing
  const handleCancelInlineEdit = () => {
    setEditingId(null);
    setEditedTransaction(null);
  };

  // Save transaction mutation
  const saveTransactionMutation = useMutation({
    mutationFn: (data) => {
      return transactionAPI.updateTransaction(data.transactionId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setEditingId(null);
      setEditedTransaction(null);
      toast.success('Transaction updated successfully');
    },
    onError: (error) => {
      console.error('Failed to save transaction:', error);
      toast.error('Failed to save changes: ' + (error.message || 'Unknown error'));
    }
  });
  
  // Function to handle saving edited transaction
  const handleSaveClick = (transaction) => {
    openTransactionSummary(transaction, true);
    setOpenMenuId(null);
  };
  
  // Toggle edit mode for a transaction
  const handleEditClick = (transaction) => {
    openTransactionSummary(transaction, true);
    setOpenMenuId(null); // Close the dropdown
  };

  // Function to open transaction summary modal
  const openTransactionSummary = (transaction, enableEditMode = false) => {
    const transactionId = transaction.originalTransaction.transactionId;
    
    const preservedInfo = {
      referrer: transaction.referrer,
      referrerId: transaction.referrerId || transaction.originalTransaction?.referrerId
    };
    
    setSelectedSummaryTransaction({...transaction, isLoading: true});
    setIsTransactionSummaryOpen(true);
    setOpenMenuId(null); 
    
    // Store current referrers for use in case API call fails
    const currentReferrers = referrers || [];
    
    // Use the API to get the latest transaction data
    transactionAPI.getTransactionById(transactionId)
      .then(response => {
        if (response && response.data && response.data.data) {
          queryClient.refetchQueries({
            queryKey: ['refunds', selectedDate],
            exact: true
          });
          
          const freshTransaction = formatTransactionForDisplay(response.data.data, departments, currentReferrers);
          
          // Restore excess refunds from metadata if they exist
          if (response.data.data.metadata) {
            try {
              const metadata = typeof response.data.data.metadata === 'string' 
                ? JSON.parse(response.data.data.metadata) 
                : response.data.data.metadata;
              
              if (metadata.excessRefunds && typeof metadata.excessRefunds === 'object') {
                setRefundAmounts(metadata.excessRefunds);
              }
            } catch (error) {
              console.warn('Failed to parse transaction metadata:', error);
            }
          }
          
          if (!freshTransaction.referrer || freshTransaction.referrer === 'Unknown' || freshTransaction.referrer === 'Out Patient') {
            freshTransaction.referrer = preservedInfo.referrer;
          }
          
          setSelectedSummaryTransaction(freshTransaction);
          if (enableEditMode) {
            setTimeout(() => {
              setEditedSummaryTransaction(JSON.parse(JSON.stringify(freshTransaction)));
              setIsEditingSummary(true);
            }, 0);
          }
        } else {
          console.error("Unexpected response format:", response);
          // Use existing transaction with preserved referrer information
          setSelectedSummaryTransaction({
            ...transaction, 
            isLoading: false,
            referrer: preservedInfo.referrer
          });
          
          if (enableEditMode) {
            setTimeout(() => {
              setEditedSummaryTransaction(JSON.parse(JSON.stringify({
                ...transaction, 
                isLoading: false,
                referrer: preservedInfo.referrer
              })));
              setIsEditingSummary(true);
            }, 0);
          }
          
          toast.warning("Could not refresh transaction data. Using cached data instead.");
        }
      })
      .catch(error => {
        console.error("Error fetching transaction details:", error);
        // Use existing transaction with preserved referrer information
        setSelectedSummaryTransaction({
          ...transaction, 
          isLoading: false,
          referrer: preservedInfo.referrer
        });
        
        if (enableEditMode) {
          setTimeout(() => {
            setEditedSummaryTransaction(JSON.parse(JSON.stringify({
              ...transaction, 
              isLoading: false,
              referrer: preservedInfo.referrer
            })));
            setIsEditingSummary(true);
          }, 0);
        }
        
        toast.warning("Could not refresh transaction data. Using cached data instead.");
      });
  };
  
  const closeTransactionSummary = () => {
    setIsTransactionSummaryOpen(false);
    setIsEditingSummary(false);
    setEditedSummaryTransaction(null);
    setSelectedSummaryTransaction(null);
    setIsRefundMode(false);
    setSelectedRefunds({});
    setRefundAmounts({}); // Clear excess refund amounts
  };

  // Enter edit mode for transaction summary
  const handleEnterEditMode = () => {
    // Create a deep copy of the transaction for editing
    const editedTx = JSON.parse(JSON.stringify(selectedSummaryTransaction));
    
    // Auto-set 20% discount for PWD or Senior Citizen if not already set
    const idType = (editedTx?.originalTransaction?.idType || '').trim().toLowerCase();
    if (idType === 'person with disability' || idType === 'senior citizen') {
      if (editedTx?.originalTransaction?.TestDetails) {
        editedTx.originalTransaction.TestDetails.forEach(test => {
          // Only set discount if it's not already set or is 0
          if (!test.discountPercentage || test.discountPercentage === '0' || test.discountPercentage === 0) {
            test.discountPercentage = '20';
            // Recalculate discounted price
            const originalPrice = parseFloat(test.originalPrice) || 0;
            test.discountedPrice = (originalPrice * 0.8).toFixed(2);
          }
        });
      }
    }
    
    setEditedSummaryTransaction(editedTx);
    setIsEditingSummary(true);
  };

  // Cancel edit for transaction summary
  const handleCancelEdit = () => {
    setIsEditingSummary(false);
    setEditedSummaryTransaction(null);
    setIsRefundMode(false);
    setSelectedRefunds({});
    setRefundAmounts({}); // Clear excess refund amounts
  };

  // Handle changes to summary fields
  const handleSummaryInputChange = (e, field) => {
    if (field === 'birthDate') {
      const selectedDate = new Date(e.target.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate > today) {
        return; 
      }
    }
    // Special handling for ID Type
    if (field === 'idType') {
      const newIdType = e.target.value;
      
      // Get the new discount percentage
      const selectedCategory = discountCategories.find(cat => cat.categoryName === newIdType);
      const newDiscountPercentage = selectedCategory ? parseFloat(selectedCategory.percentage) : 0;
      
      // Recalculate all test prices with the new discount
      const updatedTestDetails = editedSummaryTransaction.originalTransaction.TestDetails.map(test => {
        const originalPrice = parseFloat(test.originalPrice) || 0;
        // Apply the new transaction-level discount to the original price
        const discountedPrice = originalPrice * (1 - newDiscountPercentage / 100);
        
        return {
          ...test,
          discountedPrice: discountedPrice
        };
      });
      
      // If idType is changed to "Regular", automatically set ID number to "XXXX-XXXX"
      if (newIdType === 'Regular') {
        setEditedSummaryTransaction({
          ...editedSummaryTransaction,
          originalTransaction: {
            ...editedSummaryTransaction.originalTransaction,
            idType: newIdType,
            idNumber: 'XXXX-XXXX', // Force set ID number when Regular is selected
            TestDetails: updatedTestDetails
          }
        });
        return;
      }
      // If it's changed to something else, clear the ID number to force user input
      else {
        setEditedSummaryTransaction({
          ...editedSummaryTransaction,
          originalTransaction: {
            ...editedSummaryTransaction.originalTransaction,
            idType: newIdType,
            idNumber: '', // Clear the ID number
            TestDetails: updatedTestDetails
          }
        });
        return;
      }
    }
    
    // Normal handling for other fields
    setEditedSummaryTransaction({
      ...editedSummaryTransaction,
      originalTransaction: {
        ...editedSummaryTransaction.originalTransaction,
        [field]: e.target.value
      }
    });
  };

  // Handle MC# validation
  const handleMcNoChange = (e) => {
    const newMcNo = e.target.value;

    // Always update state immediately
    setEditedSummaryTransaction((prev) => ({
      ...prev,
      id: newMcNo,
    }));

    // Skip validation if empty or unchanged
    if (!newMcNo || newMcNo === selectedSummaryTransaction.id) {
      setMcNoExists(false);
      setIsMcNoChecking(false);
      return;
    }

    // Start checking
    setIsMcNoChecking(true);

    // Debounce API calls
    clearTimeout(window.mcNoValidationTimer);
    window.mcNoValidationTimer = setTimeout(async () => {
      try {
        // Get transaction ID directly from selectedSummaryTransaction
        const transactionId = selectedSummaryTransaction?.originalTransaction?.transactionId;

        if (!transactionId) {
          console.error("Missing transaction ID:", selectedSummaryTransaction);
          toast.error("Could not validate MC# - missing transaction ID");
          setMcNoExists(false);
          return;
        }

        const response = await transactionAPI.checkMcNoExists(newMcNo, transactionId);

        if (response && typeof response.exists === "boolean") {
          setMcNoExists(response.exists);
          if (response.exists) {
            toast.error("This MC# is already in use by another transaction");
          }
        } else {
          console.error("Invalid response format:", response);
          setMcNoExists(false);
        }
      } catch (error) {
        console.error("MC# validation error:", error);
        toast.error(`Error validating MC#: ${error.message || "Unknown error"}`);
        setMcNoExists(false);
      } finally {
        setIsMcNoChecking(false);
      }
    }, 500);
  };

  // Toggle refund mode
  const toggleRefundMode = () => {
    if (isRefundMode) {
      setSelectedRefunds({});
    } else {
      const refundedTests = {};
      editedSummaryTransaction?.originalTransaction?.TestDetails?.forEach(test => {
        if (test.status === 'refunded') {
          refundedTests[test.testDetailId] = true;
        }
      });
      setSelectedRefunds(refundedTests);
    }
    setIsRefundMode(!isRefundMode);
  };

  // Handle refund selection
  const handleRefundSelection = (testDetailId) => {
    const testIndex = editedSummaryTransaction.originalTransaction.TestDetails.findIndex(
      test => test.testDetailId === testDetailId
    );
    
    if (testIndex === -1) {
      console.error("Test not found for refund selection:", testDetailId);
      return;
    }
    
    const test = editedSummaryTransaction.originalTransaction.TestDetails[testIndex];
    
    if (test.status === 'refunded') {
      return;
    }
    
    setSelectedRefunds(prev => {
      const newSelections = { ...prev };
      
      if (newSelections[testDetailId]) {
        delete newSelections[testDetailId];
        
        const updatedTransaction = {
          ...editedSummaryTransaction,
          originalTransaction: {
            ...editedSummaryTransaction.originalTransaction,
            TestDetails: [...editedSummaryTransaction.originalTransaction.TestDetails]
          }
        };
        
        const originalPrice = parseFloat(test.originalPrice) || 0;
        const discountPercent = parseInt(test.discountPercentage) || 0;
        const calculatedPrice = originalPrice * (1 - discountPercent/100);
        
        updatedTransaction.originalTransaction.TestDetails[testIndex] = {
          ...test,
          discountedPrice: calculatedPrice.toFixed(2)
        };
        
        setEditedSummaryTransaction(updatedTransaction);
        
      } else {
        newSelections[testDetailId] = true;
        
        const updatedTransaction = {
          ...editedSummaryTransaction,
          originalTransaction: {
            ...editedSummaryTransaction.originalTransaction,
            TestDetails: [...editedSummaryTransaction.originalTransaction.TestDetails]
          }
        };
        
        updatedTransaction.originalTransaction.TestDetails[testIndex] = {
          ...test,
          discountedPrice: "0.00"  
        };
        
        const discountedPrice = parseFloat(test.discountedPrice) || 0;
        toast.info(`Test "${test.testName}" marked for refund (₱${discountedPrice.toFixed(2)})`);
        
        setEditedSummaryTransaction(updatedTransaction);
      }
      
      setTimeout(() => recalculateTestTotals(), 0);
      
      return newSelections;
    });
  };

  // Recalculate test totals after changes
  const recalculateTestTotals = () => {
    if (!editedSummaryTransaction?.originalTransaction?.TestDetails) return;
    
    const updatedTransaction = {
      ...editedSummaryTransaction,
      originalTransaction: {
        ...editedSummaryTransaction.originalTransaction
      }
    };
    
    let totalCash = 0;
    let totalGCash = 0;
    let totalBalance = 0;
    
    updatedTransaction.originalTransaction.TestDetails.forEach(test => {
      if (test.status !== 'refunded' && !selectedRefunds[test.testDetailId]) {
        totalCash += parseFloat(test.cashAmount || 0);
        totalGCash += parseFloat(test.gCashAmount || 0);
        totalBalance += parseFloat(test.balanceAmount || 0);
      }
    });
    
    updatedTransaction.originalTransaction.totalCashAmount = totalCash.toFixed(2);
    updatedTransaction.originalTransaction.totalGCashAmount = totalGCash.toFixed(2);
    updatedTransaction.originalTransaction.totalBalanceAmount = totalBalance.toFixed(2);
    
    // Update state
    setEditedSummaryTransaction(updatedTransaction);
  };

  // Create an improved handleTestDetailChange that restricts input and handles refunds
  const handleTestDetailChange = (index, field, value) => {
    const test = editedSummaryTransaction?.originalTransaction?.TestDetails[index];
    if (test?.status === 'refunded' || selectedRefunds[test?.testDetailId]) {
      toast.info('Cannot edit a test that is refunded or marked for refund');
      return;
    }
    
    // Create a shallow copy first
    const updatedTransaction = {
      ...editedSummaryTransaction,
      originalTransaction: {
        ...editedSummaryTransaction.originalTransaction,
        TestDetails: [...editedSummaryTransaction.originalTransaction.TestDetails]
      }
    };
    
    // Create a copy of the test we're modifying
    const testCopy = {...updatedTransaction.originalTransaction.TestDetails[index]};
    
    // Ensure proper numeric input handling
    if (field === 'cashAmount' || field === 'gCashAmount') {
      const numericRegex = /^\d+(\.\d{0,2})?$/;
      if (value && !numericRegex.test(value)) {
        return; 
      }
      
      // Get the current discounted price - calculate it if needed
      const originalPrice = parseFloat(testCopy.originalPrice) || 0;
      let discountedPrice;
      
      // Calculate discounted price based on percentage or use stored value
      const idType = (editedSummaryTransaction?.originalTransaction?.idType || '').trim().toLowerCase();
      const isSpecialDiscount = idType === 'person with disability' || idType === 'senior citizen';
      
      if (isSpecialDiscount) {
        // Apply 20% discount for PWD/Senior Citizen
        const discountPercent = parseFloat(testCopy.discountPercentage || 20);
        discountedPrice = originalPrice * (1 - discountPercent/100);
      } else {
        // Apply regular discount if any
        const discountPercent = parseFloat(testCopy.discountPercentage || 0);
        discountedPrice = originalPrice * (1 - discountPercent/100);
      }
      
      // Store calculated discounted price
      testCopy.discountedPrice = discountedPrice.toFixed(2);
      
      // Get current payment values
      const numValue = parseFloat(value) || 0;
      const otherField = field === 'cashAmount' ? 'gCashAmount' : 'cashAmount';
      const otherValue = parseFloat(testCopy[otherField]) || 0;
      
      // Enforce limits based on field - cap at discounted price
      if (field === 'cashAmount') {
        // For cash payments, limit to the discounted price
        if (numValue > discountedPrice) {
          testCopy[field] = discountedPrice.toFixed(2);
        } else {
          testCopy[field] = value;
        }
      } else {
        // For GCash payments, limit to remaining amount after cash payment
        const cashAmount = parseFloat(testCopy.cashAmount || 0);
        const remainingAmount = Math.max(0, discountedPrice - cashAmount);
        
        if (numValue > remainingAmount) {
          testCopy[field] = remainingAmount.toFixed(2);
        } else {
          testCopy[field] = value;
        }
      }
      
      // Recalculate total payment after adjustments
      const updatedCashAmount = parseFloat(testCopy.cashAmount || 0);
      const updatedGCashAmount = parseFloat(testCopy.gCashAmount || 0);
      const totalPayment = updatedCashAmount + updatedGCashAmount;
      
      // Clear any refund tracking since payments are now capped at discounted price
      const refundId = `test-${testCopy.testDetailId}`;
      setRefundAmounts(prev => {
        const newRefunds = {...prev};
        delete newRefunds[refundId];
        return newRefunds;
      });
      
      // Update balance - always based on actual calculation
      const newBalanceAmount = Math.max(0, discountedPrice - totalPayment).toFixed(2);
      testCopy.balanceAmount = newBalanceAmount;
    }
    else if (field === 'discountPercentage') {
      // Allow empty value for clearing the field
      if (value === '') {
        testCopy.discountPercentage = '';
        // Reset to original price when no discount
        const originalPrice = parseFloat(testCopy.originalPrice) || 0;
        testCopy.discountedPrice = originalPrice.toFixed(2);
      } else {
        // Only allow numeric input (0-9) and ensure it's a valid percentage
        if (!/^\d{1,2}$|^100$/.test(value)) {
          return; // Reject invalid input
        }
        
        const percentValue = parseInt(value) || 0;
        if (percentValue > 100) {
          toast.warning('Discount cannot exceed 100%');
          return;
        }
        
        testCopy.discountPercentage = value;
      }
      
      // Calculate new discounted price
      const originalPrice = parseFloat(testCopy.originalPrice) || 0;
      const discountPercent = Math.min(100, parseInt(testCopy.discountPercentage) || 0);
      const newDiscountedPrice = originalPrice * (1 - discountPercent/100);
      testCopy.discountedPrice = newDiscountedPrice.toFixed(2);
      
      // Get current payment amounts
      const currentCashAmount = parseFloat(testCopy.cashAmount || 0);
      const currentGCashAmount = parseFloat(testCopy.gCashAmount || 0);
      const totalPayment = currentCashAmount + currentGCashAmount;
      
      // If discounted price is lower than total payments, cap the payments
      if (totalPayment > newDiscountedPrice) {
        // Clear any refund tracking for this test
        const refundId = `test-${testCopy.testDetailId}`;
        setRefundAmounts(prev => {
          const newRefunds = {...prev};
          delete newRefunds[refundId];
          return newRefunds;
        });
        
        // Cap payments to match discounted price
        if (totalPayment > 0) {
          // Maintain the ratio between cash and GCash payments
          const cashRatio = currentCashAmount / totalPayment;
          const gCashRatio = currentGCashAmount / totalPayment;
          
          const newCashAmount = newDiscountedPrice * cashRatio;
          const newGCashAmount = newDiscountedPrice * gCashRatio;
          
          testCopy.cashAmount = newCashAmount.toFixed(2);
          testCopy.gCashAmount = newGCashAmount.toFixed(2);
          
          // Balance should be 0 since payments now match discounted price
          testCopy.balanceAmount = "0.00";
        } else {
          // If no payments were made, just set balance to discounted price
          testCopy.balanceAmount = newDiscountedPrice.toFixed(2);
        }
      } else {
        // No overpayment, just recalculate balance normally
        const refundId = `test-${testCopy.testDetailId}`;
        setRefundAmounts(prev => {
          const newRefunds = {...prev};
          delete newRefunds[refundId];
          return newRefunds;
        });
        
        testCopy.balanceAmount = Math.max(0, newDiscountedPrice - totalPayment).toFixed(2);
      }
    }
    else if (field === 'discountedPrice') {
      // Allow direct editing of discounted price
      const newDiscountedPrice = parseFloat(value) || 0;
      const originalPrice = parseFloat(testCopy.originalPrice) || 0;
      
      // Validate that discounted price doesn't exceed original price
      if (newDiscountedPrice > originalPrice) {
        toast.warning('Discounted price cannot exceed original price');
        return;
      }
      
      testCopy.discountedPrice = value;
      
      // Recalculate discount percentage
      if (originalPrice > 0) {
        const discountPercent = Math.round(((originalPrice - newDiscountedPrice) / originalPrice) * 100);
        testCopy.discountPercentage = Math.max(0, Math.min(100, discountPercent)).toString();
      }
      
      // Get current payment amounts
      const currentCashAmount = parseFloat(testCopy.cashAmount || 0);
      const currentGCashAmount = parseFloat(testCopy.gCashAmount || 0);
      const totalPayment = currentCashAmount + currentGCashAmount;
      
      // Clear any refund tracking for this test
      const refundId = `test-${testCopy.testDetailId}`;
      setRefundAmounts(prev => {
        const newRefunds = {...prev};
        delete newRefunds[refundId];
        return newRefunds;
      });
      
      // If payments exceed new discounted price, cap them
      if (totalPayment > newDiscountedPrice) {
        // Adjust cash and GCash proportionally to match discounted price
        if (totalPayment > 0) {
          const cashRatio = currentCashAmount / totalPayment;
          const gCashRatio = currentGCashAmount / totalPayment;
          
          const newCashAmount = newDiscountedPrice * cashRatio;
          const newGCashAmount = newDiscountedPrice * gCashRatio;
          
          testCopy.cashAmount = newCashAmount.toFixed(2);
          testCopy.gCashAmount = newGCashAmount.toFixed(2);
        }
        
        testCopy.balanceAmount = "0.00";
      } else {
        testCopy.balanceAmount = Math.max(0, newDiscountedPrice - totalPayment).toFixed(2);
      }
    }
    else if (field === 'cashAmount' || field === 'gCashAmount') {
      // Handle payment field changes with refund calculation
      const newValue = parseFloat(value) || 0;
      testCopy[field] = value;
      
      const cashAmount = field === 'cashAmount' ? newValue : parseFloat(testCopy.cashAmount || 0);
      const gCashAmount = field === 'gCashAmount' ? newValue : parseFloat(testCopy.gCashAmount || 0);
      const totalPayment = cashAmount + gCashAmount;
      const discountedPrice = parseFloat(testCopy.discountedPrice) || 0;
      
      const refundId = `test-${testCopy.testDetailId}`;
      if (totalPayment > discountedPrice) {
        const refundAmount = totalPayment - discountedPrice;
        setRefundAmounts(prev => ({
          ...prev,
          [refundId]: refundAmount
        }));
        testCopy.balanceAmount = "0.00";
      } else {
        setRefundAmounts(prev => {
          const newRefunds = {...prev};
          delete newRefunds[refundId];
          return newRefunds;
        });
        testCopy.balanceAmount = Math.max(0, discountedPrice - totalPayment).toFixed(2);
      }
    }
    else {
      // For other fields, just set the value
      testCopy[field] = value;
    }
    
    // Update the test in the array
    updatedTransaction.originalTransaction.TestDetails[index] = testCopy;
    
    // Calculate new totals
    let totalCash = 0;
    let totalGCash = 0;
    let totalBalance = 0;
    
    updatedTransaction.originalTransaction.TestDetails.forEach(test => {
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
    
    // Update state with the new values
    setEditedSummaryTransaction(updatedTransaction);
  };

  // Save edited transaction
  const saveEditedTransactionMutation = useMutation({
    mutationFn: (data) => {
      return transactionAPI.updateTransaction(data.transactionId, data);
    },
    onSuccess: (response) => {
      // Check if response contains the expected structure
      if (response && response.data) {
        // Show success toast
        toast.success('Transaction updated successfully');
        
        const hasRefunds = Object.keys(selectedRefunds).length > 0;
        
        queryClient.invalidateQueries({
          queryKey: ['transactions'],
          exact: false,
          refetchType: 'all'
        });
        
        queryClient.invalidateQueries({
          queryKey: ['refunds'],
          exact: false,
          refetchType: 'all'
        });
        
        queryClient.invalidateQueries({
          queryKey: ['department-revenue'],
          exact: false,
          refetchType: 'all'
        });
        
        // Invalidate expenses queries to refresh expense modal data after referrer changes
        queryClient.invalidateQueries({
          queryKey: ['expenses'],
          exact: false,
          refetchType: 'all'
        });
        
        if (hasRefunds) {
          const newRefundTotal = Object.keys(selectedRefunds).reduce((total, testDetailId) => {
            const test = editedSummaryTransaction.originalTransaction.TestDetails.find(
              t => t.testDetailId === testDetailId && t.status !== 'refunded'
            );
            if (test) {
              total += parseFloat(test.originalPrice || test.discountedPrice) || 0;
            }
            return total;
          }, 0);
          
          if (newRefundTotal > 0) {
            // Only track pending refunds for the current date
            const today = new Date();
            const isCurrentDateSelected = (
              selectedDate.getDate() === today.getDate() &&
              selectedDate.getMonth() === today.getMonth() &&
              selectedDate.getFullYear() === today.getFullYear()
            );
            
            if (isCurrentDateSelected) {
              setPendingRefundAmount(prev => prev + newRefundTotal);
            }
          }
          
          // Clear pending refund amount after refetch completes
          setTimeout(() => {
            Promise.all([
              queryClient.refetchQueries({
                queryKey: ['transactions', selectedDate],
                active: true,
                exact: true
              }),
              queryClient.refetchQueries({
                queryKey: ['refunds', selectedDate],
                active: true,
                exact: true
              })
            ]).then(() => {
              setPendingRefundAmount(0);
            });
          }, 1000); 
        }
        
        setIsEditingSummary(false);
        setEditedSummaryTransaction(null);
        setSelectedRefunds({});
        setIsTransactionSummaryOpen(false);
      } else {
        console.error('Unexpected response format:', response);
        toast.error('Failed to save changes: Unexpected response format');
      }
    },
    onError: (error) => {
      console.error('Failed to save transaction:', error);
      toast.error('Failed to save changes: ' + (error.message || 'Unknown error'));
    }
  });

  // Validate and prepare transaction data before saving
  const handleSaveEdit = () => {
    if (!editedSummaryTransaction) {
      toast.error("No changes to save");
      return;
    }
    
    // Don't save if MC# validation failed
    if (mcNoExists) {
      toast.error('MC# already exists in another transaction');
      return;
    }
    
    // Get transaction ID directly from the source
    const transactionId = selectedSummaryTransaction?.originalTransaction?.transactionId;
    if (!transactionId) {
      toast.error("Missing transaction ID - cannot save changes");
      console.error("Missing transaction ID in:", selectedSummaryTransaction);
      return;
    }
    
    // Prepare test details data for saving - critical for updating tests!
    const testDetails = editedSummaryTransaction.originalTransaction.TestDetails.map(test => {
      const wasRefunded = test.status === 'refunded';
      const isNewlySelected = !!selectedRefunds[test.testDetailId];
      const shouldBeRefunded = wasRefunded || isNewlySelected;
      
      const refundedPrice = shouldBeRefunded ? "0.00" : test.discountedPrice;
      
      return {
        testDetailId: test.testDetailId,
        discountPercentage: test.discountPercentage,
        discountedPrice: refundedPrice,
        originalPrice: test.originalPrice, 
        cashAmount: test.cashAmount || "0.00",
        gCashAmount: test.gCashAmount || "0.00",
        balanceAmount: test.balanceAmount || "0.00",
        isRefunded: shouldBeRefunded, 
        status: shouldBeRefunded ? 'refunded' : 'active',
        departmentId: test.departmentId 
      };
    });
    
    const isProcessingRefunds = Object.keys(selectedRefunds).length > 0;
    
    const departmentRefunds = {};
    if (isProcessingRefunds) {
      testDetails.forEach(test => {
        if (test.status === 'refunded' && selectedRefunds[test.testDetailId]) {
          const deptId = test.departmentId;
          if (!departmentRefunds[deptId]) {
            departmentRefunds[deptId] = 0;
          }
          departmentRefunds[deptId] += parseFloat(test.originalPrice) || 0;
        }
      });
    }
    
    // Calculate totalAmount (total paid = cash + gcash from non-refunded tests)
    let totalAmount = 0;
    editedSummaryTransaction.originalTransaction.TestDetails.forEach(test => {
      if (test.status !== 'refunded' && !selectedRefunds[test.testDetailId]) {
        totalAmount += (parseFloat(test.cashAmount) || 0) + (parseFloat(test.gCashAmount) || 0);
      }
    });
    
    // Calculate totalDiscountAmount based on discount type
    // Get discount percentage from discountCategories
    const idType = editedSummaryTransaction.originalTransaction.idType || 'Regular';
    const discountCategory = discountCategories.find(cat => cat.categoryName === idType);
    const discountPercentage = discountCategory ? parseFloat(discountCategory.percentage) : 0;
    
    // Apply discount: totalAmount × (1 - discount% / 100)
    const totalDiscountAmount = discountPercentage > 0
      ? totalAmount * (1 - discountPercentage / 100)
      : totalAmount;
    
    // Prepare data with guaranteed transaction ID and including test details
    const transactionData = {
      transactionId: transactionId,
      mcNo: editedSummaryTransaction.id,
      firstName: editedSummaryTransaction.originalTransaction.firstName,
      lastName: editedSummaryTransaction.originalTransaction.lastName,
      referrerId: editedSummaryTransaction.originalTransaction.referrerId,
      birthDate: editedSummaryTransaction.originalTransaction.birthDate || null,
      sex: editedSummaryTransaction.originalTransaction.sex || null,
      idType: editedSummaryTransaction.originalTransaction.idType || 'Regular',
      idNumber: editedSummaryTransaction.originalTransaction.idNumber || 'XXXX-XXXX',
      userId: user.userId,
      testDetails: testDetails,
      isRefundProcessing: isProcessingRefunds, 
      departmentRefunds: departmentRefunds, 
      refundDate: new Date().toISOString(),
      excessRefunds: refundAmounts || {},
      totalAmount: totalAmount,
      totalDiscountAmount: totalDiscountAmount
    };
    
    // Validate before saving
    if (!validateTransaction(transactionData)) {
      return;
    }
    
    // Submit the update
    saveEditedTransactionMutation.mutate(transactionData);
  };

  // Validate transaction data before saving
  const validateTransaction = (data) => {
    // Check required fields
    if (!data.firstName || !data.lastName) {
      toast.error('Patient name is required');
      return false;
    }
    
    // Check if MC# is empty
    if (!data.mcNo) {
      toast.error('MC# is required');
      return false;
    }
    
    // Check if ID Type is not Regular but ID Number is empty
    if (data.idType && data.idType !== 'Regular' && (!data.idNumber || data.idNumber === 'XXXX-XXXX')) {
      toast.error('ID Number is required when ID Type is not Regular');
      return false;
    }
    
    // Make sure we have a transactionId
    if (!data.transactionId) {
      toast.error('Transaction ID is required for updating');
      console.error('Missing transaction ID:', data);
      return false;
    }
    
    return true;
  };

  const clearRefundAmounts = () => {
    setRefundAmounts({});
  };

  return {
    // State
    openMenuId,
    openExpenseMenuId,
    isConfirmModalOpen,
    transactionToCancel,
    isTransactionSummaryOpen,
    selectedSummaryTransaction,
    isEditingSummary,
    editedSummaryTransaction,
    mcNoExists,
    isMcNoChecking,
    isRefundMode,
    selectedRefunds,
    editingId,
    editedTransaction,
    pendingRefundAmount,
    refundAmounts,

    // Handlers
    toggleIncomeMenu,
    toggleExpenseMenu,
    handleDropdownClick,
    handleCancelClick,
    closeConfirmModal, 
    confirmCancellation,
    handleEditChange,
    handleCancelInlineEdit,
    handleSaveClick,
    handleEditClick,
    openTransactionSummary,
    closeTransactionSummary,
    handleEnterEditMode,
    handleCancelEdit,
    handleSummaryInputChange,
    handleMcNoChange,
    toggleRefundMode,
    handleRefundSelection,
    handleTestDetailChange,
    handleSaveEdit,
    clearRefundAmounts,

    // Mutations
    mutations: {
      cancelTransaction: cancelTransactionMutation,
      saveTransaction: saveTransactionMutation,
      saveEditedTransaction: saveEditedTransactionMutation
    }
  };
};

export default useTransactionManagement;
