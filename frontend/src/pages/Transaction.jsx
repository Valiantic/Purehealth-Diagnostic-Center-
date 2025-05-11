import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Income from '../assets/icons/income_logo.png';
import Expense from '../assets/icons/expense_logo.png';
import { Calendar, Download, Edit, X, MoreVertical, Save } from 'lucide-react';
import useAuth from '../hooks/useAuth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionAPI, departmentAPI, referrerAPI, revenueAPI } from '../services/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const noSpinnerStyle = { 
  WebkitAppearance: 'none',
  MozAppearance: 'textfield',
  margin: 0, 
  appearance: 'textfield' 
};

// Helper function to format date as DD-MMM-YYYY
const formatDate = (date) => {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

// Format date as MM/DD/YY
const formatShortDate = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  
  return `${month}/${day}/${year}`;
};

// Calculate age based on birthdate
const calculateAge = (birthdate) => {
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
const isTestRefunded = (test) => {
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

const Transaction = () => {
  // Use the custom auth hook - with isAuthenticating check
  const { user, isAuthenticating } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [openMenuId, setOpenMenuId] = useState(null);
  const [openExpenseMenuId, setOpenExpenseMenuId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Confirmation modal state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [transactionToCancel, setTransactionToCancel] = useState(null);
  
  // Transaction summary modal state
  const [isTransactionSummaryOpen, setIsTransactionSummaryOpen] = useState(false);
  const [selectedSummaryTransaction, setSelectedSummaryTransaction] = useState(null);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editedSummaryTransaction, setEditedSummaryTransaction] = useState(null);
  
  // Fix: Add proper state variables for MC# validation
  const [mcNoExists, setMcNoExists] = useState(false);
  const [isMcNoChecking, setIsMcNoChecking] = useState(false);
  
  // Add state for tracking potential refunds
  const [potentialRefundAmount, setPotentialRefundAmount] = useState(0);
  
  // Add state to track refund amounts
  const [refundAmounts, setRefundAmounts] = useState({});
  
  // Add state to track newly processed refunds that haven't been fetched from the backend yet
  const [pendingRefundAmount, setPendingRefundAmount] = useState(0);

  // Fix: Define idTypeOptions for the dropdown
  const idTypeOptions = [
    { value: 'Regular', label: 'Regular' },
    { value: 'Person with Disability', label: 'PWD' },
    { value: 'Senior Citizen', label: 'Senior Citizen' }
  ];
  
  // Reference to the date input elements
  const incomeDateInputRef = React.useRef(null);
  const expenseDateInputRef = React.useRef(null);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Format the date for display
  const formattedDate = formatDate(selectedDate);

  // Handle date change
  const handleDateChange = (e) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      setSelectedDate(newDate);
      setPendingRefundAmount(0);
      
      setTimeout(() => {
        queryClient.refetchQueries({
          queryKey: ['transactions', newDate],
          exact: true
        });
        queryClient.refetchQueries({
          queryKey: ['refunds', newDate],
          exact: true
        });
      }, 0);
    }
  };
  
  // Function to open the date picker
  const openDatePicker = (inputRef) => {
    if (inputRef && inputRef.current) {
      inputRef.current.showPicker();
    }
  };

  const handleNewExpenses = () => {
    navigate('/add-expenses');
  };

  const handleNewIncome = () => {
    navigate('/add-income');
  };

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

  // Close all menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null);
      setOpenExpenseMenuId(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Prevent menu close when clicking on the dropdown itself
  const handleDropdownClick = (e) => {
    e.stopPropagation();
  };

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

  // Fetch refunds data by department
  const {
    data: refundsData = { data: { departmentRefunds: [], totalRefund: 0 } },
    isLoading: isLoadingRefunds,
  } = useQuery({
    queryKey: ['refunds', selectedDate],
    queryFn: async () => {
      const response = await revenueAPI.getRefundsByDepartment({
        date: selectedDate.toISOString().split('T')[0]
      });
      return response.data;
    },
    staleTime: 30000,
  });

  // Extract data from query results
  const transactions = transactionsData?.data?.transactions || [];
  const departments = Array.isArray(departmentsData)
    ? departmentsData
    : Array.isArray(departmentsData.data)
    ? departmentsData.data
    : [];
  const referrers = referrersData?.data?.data || [];
  const departmentRefunds = refundsData?.data?.departmentRefunds || [];
  const totalRefund = refundsData?.data?.totalRefund || 0;


  // Process transactions to organize by departments and filter by date
  const processedTransactions = transactions
    .filter((transaction) => {
      // Check if transaction date matches selected date
      if (!transaction.createdAt) return true; // Include if no date (fallback)
      
      const transactionDate = new Date(transaction.createdAt);
      return (
        transactionDate.getDate() === selectedDate.getDate() &&
        transactionDate.getMonth() === selectedDate.getMonth() &&
        transactionDate.getFullYear() === selectedDate.getFullYear()
      );
    })
    .map((transaction) => {
      // Group test details by department
      const departmentRevenues = {};
      // Initialize department revenues to 0
      departments.forEach((dept) => {
        departmentRevenues[dept.departmentId] = {
          name: dept.departmentName,
          amount: 0,
          isActive: dept.status === 'active',
          refundAmount: 0 
        };
      });

      // Sum up revenue for each department - exclude refunded tests
      if (transaction.TestDetails && transaction.TestDetails.length > 0) {
        transaction.TestDetails.forEach((test) => {
          const deptId = test.departmentId;
          if (!departmentRevenues[deptId]) return;
          
          // Updated refund check using the helper function
          if (isTestRefunded(test)) {
            departmentRevenues[deptId].refundAmount += parseFloat(test.originalPrice || test.discountedPrice) || 0;
          } else {
            departmentRevenues[deptId].amount += parseFloat(test.discountedPrice) || 0;
          }
        });
      }
      
      let grossDeposit = 0;
      if (transaction.TestDetails && transaction.TestDetails.length > 0) {
        grossDeposit = transaction.TestDetails
          .filter(test => test.status !== 'refunded')
          .reduce((sum, test) => sum + (parseFloat(test.discountedPrice) || 0), 0);
      } else {
        grossDeposit = parseFloat(transaction.totalCashAmount) + parseFloat(transaction.totalGCashAmount);
      }
      
      // Find the referrer - simplified to show only last name
      let referrerName = 'Out Patient';
      
      if (transaction.referrerId) {
        // Normalize IDs for comparison by converting both to strings
        const transactionReferrerId = String(transaction.referrerId);
        const referrer = referrers.find(ref => String(ref.referrerId) === transactionReferrerId);
        
        if (referrer) {
          referrerName = referrer.lastName ? `Dr. ${referrer.lastName}` : 'Unknown';
        } else {
          // Shorter ID display for missing referrers
          referrerName = 'Out Patient';    
        }
      }

      return {
        id: transaction.mcNo,
        name: `${transaction.firstName} ${transaction.lastName}`,
        departmentRevenues,
        referrer: referrerName,
        grossDeposit: grossDeposit,
        status: transaction.status,
        originalTransaction: transaction,
        hasRefunds: transaction.TestDetails?.some(test => isTestRefunded(test)) || false,
        refundDate: transaction.TestDetails?.find(test => isTestRefunded(test))?.updatedAt || null
      };
    });

  // Filter transactions based on search term
  const filteredTransactions = processedTransactions.filter((transaction) => {
    return (
      transaction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Reset search when date changes
  useEffect(() => {
    setSearchTerm('');
  }, [selectedDate]);

  // Calculate department totals - separate active and cancelled transactions
  const departmentTotals = {};
 
  // Initialize department refund totals to 0
  const departmentRefundTotals = {};
  departments.forEach(dept => {
    departmentRefundTotals[dept.departmentId] = 0;
  });

  // Calculate refund total directly from the transactions visible in the table
  const calculateRefundTotal = () => {
    let totalRefundAmount = 0;
    let refundedTestCount = 0;
    
    // Process each transaction in the filtered list
    filteredTransactions.forEach(transaction => {
      if (!transaction.originalTransaction?.TestDetails) return;
      
      transaction.originalTransaction.TestDetails.forEach(test => {
        if (test.status === 'refunded') {
          refundedTestCount++;
          
          const refundAmount = parseFloat(test.originalPrice || test.discountedPrice) || 0;
          
          totalRefundAmount += refundAmount;
          
          const deptId = test.departmentId;
          if (deptId) {
            departmentRefundTotals[deptId] = (departmentRefundTotals[deptId] || 0) + refundAmount;
          }
        }
      });
    });
    
    return {
      totalRefundAmount,
      refundedTestCount
    };
  };

  // Get refund totals directly from the visible transactions
  const refundInfo = calculateRefundTotal();
  const totalRefundAmount = refundInfo.totalRefundAmount;
  const totalRefundedTests = refundInfo.refundedTestCount;

  // Include any pending refunds that haven't been saved yet
  const totalRefundsToDisplay = totalRefundAmount + (pendingRefundAmount || 0);

  // Process transaction-level data
  filteredTransactions.forEach((transaction) => {
    if (transaction.status === 'cancelled') {
      Object.entries(transaction.departmentRevenues).forEach(([deptId, data]) => {
        departmentTotals[deptId] = (departmentTotals[deptId] || 0) - data.amount;
      });
    } else {
      if (transaction.originalTransaction?.TestDetails) {
        transaction.originalTransaction.TestDetails.forEach(test => {
          const deptId = test.departmentId;
          if (test.status === 'refunded') {
          } else {
            departmentTotals[deptId] = (departmentTotals[deptId] || 0) + parseFloat(test.discountedPrice || 0);
          }
        });
      } else {
        Object.entries(transaction.departmentRevenues).forEach(([deptId, data]) => {
          departmentTotals[deptId] = (departmentTotals[deptId] || 0) + data.amount;
        });
      }
    }
  });

  // Check which departments have values in transactions
  const departmentsWithValues = departments.filter(dept => 
    departmentTotals[dept.departmentId] > 0 || departmentRefundTotals[dept.departmentId] > 0 || dept.status === 'active'
  );

  const totalGross = filteredTransactions.reduce((sum, transaction) => {
    if (transaction.status === 'cancelled') {
      return sum; 
    }

    let transactionGross = 0;
    
    if (transaction.originalTransaction?.TestDetails) {
      transaction.originalTransaction.TestDetails.forEach(test => {
        if (test.status !== 'refunded') {
          transactionGross += parseFloat(test.discountedPrice) || 0;
        }
      });
    } else {
      transactionGross = transaction.grossDeposit;
    }
    
    return sum + transactionGross;
  }, 0);

  // Add detailed refund information for the income summary box
  const refundDetails = {
    refundedTests: filteredTransactions.reduce((count, transaction) => {
      if (transaction.status !== 'cancelled' && transaction.originalTransaction?.TestDetails) {
        const refundedTestsCount = transaction.originalTransaction.TestDetails.filter(test => test.status === 'refunded').length;
        return count + refundedTestsCount;
      }
      return count;
    }, 0)
  };
  
  // Calculate total GCash - exclude refunded amounts
  const totalGCash = filteredTransactions.reduce((sum, transaction) => {
    if (transaction.status === 'cancelled') {
      return sum; // Skip cancelled transactions
    }
    
    // If we have test details, calculate based on active tests only
    let gCashAmount = 0;
    if (transaction.originalTransaction?.TestDetails) {
      transaction.originalTransaction.TestDetails.forEach(test => {
        if (test.status !== 'refunded') {
          gCashAmount += parseFloat(test.gCashAmount) || 0;
        }
      });
      return sum + gCashAmount;
    }
    
    // Fallback to stored GCash amount
    return sum + parseFloat(transaction.originalTransaction.totalGCashAmount || 0);
  }, 0);

  // Cancel transaction mutation
  const cancelTransactionMutation = useMutation({
    mutationFn: (transactionId) => {
      // Use the API function correctly
      return transactionAPI.updateTransactionStatus(
        transactionId,
        'cancelled',
        user.userId
      );
    },
    onSuccess: () => {
      // Invalidate and refetch transactions data with more specific options
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
      // Add toast notification here
      toast.error(`Failed to cancel transaction: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    }
  });

  // Handle cancel button click
  const handleCancelClick = (transaction) => {
    setTransactionToCancel(transaction);
    setIsConfirmModalOpen(true);
    setOpenMenuId(null); // Close the dropdown
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

  // Edit transaction state
  const [editingId, setEditingId] = useState(null);
  const [editedTransaction, setEditedTransaction] = useState(null);

  const handleEditChange = (e, field) => {
    setEditedTransaction({
      ...editedTransaction,
      [field]: e.target.value
    });
  };

  const handleCancelInlineEdit = () => {
    setEditingId(null);
    setEditedTransaction(null);
  };

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
  
  // Toggle edit mode for a transaction
  const handleEditClick = (transaction) => {
    openTransactionSummary(transaction);
    setOpenMenuId(null); // Close the dropdown
  };

  // Function to open transaction summary modal
  const openTransactionSummary = (transaction) => {
  
    const transactionId = transaction.originalTransaction.transactionId;
    
    setSelectedSummaryTransaction({...transaction, isLoading: true});
    setIsTransactionSummaryOpen(true);
    setOpenMenuId(null); // Close the dropdown
    
    // Use the API to get the latest transaction data
    transactionAPI.getTransactionById(transactionId)
      .then(response => {
        if (response && response.data && response.data.data) {
          queryClient.refetchQueries({
            queryKey: ['refunds', selectedDate],
            exact: true
          });
          
          const freshTransaction = formatTransactionForDisplay(response.data.data);
          setSelectedSummaryTransaction(freshTransaction);
        } else {
          console.error("Unexpected response format:", response);
          setSelectedSummaryTransaction({...transaction, isLoading: false});
          toast.error("Could not refresh transaction data");
        }
      })
      .catch(error => {
        console.error("Error fetching transaction details:", error);
        setSelectedSummaryTransaction({...transaction, isLoading: false});
        toast.error(`Error refreshing transaction data: ${error.message || "Unknown error"}`);
      });
  };

  const closeTransactionSummary = () => {
    setIsTransactionSummaryOpen(false);
    setIsEditingSummary(false);
    setEditedSummaryTransaction(null);
    setSelectedSummaryTransaction(null);
    setIsRefundMode(false);
    setSelectedRefunds({});
  };

  // Enter edit mode for transaction summary
  const handleEnterEditMode = () => {
    // Create a deep copy of the transaction for editing
    setEditedSummaryTransaction(JSON.parse(JSON.stringify(selectedSummaryTransaction)));
    setIsEditingSummary(true);
  };

  // Cancel edit for transaction summary
  const handleCancelEdit = () => {
    setIsEditingSummary(false);
    setEditedSummaryTransaction(null);
    setIsRefundMode(false);
    setSelectedRefunds({});
  };
  
  // Fix ID Type handling to properly set ID number to "XXXX-XXXX" when Regular is selected
  const handleSummaryInputChange = (e, field) => {
    // Special handling for ID Type
    if (field === 'idType') {
      const newIdType = e.target.value;
      
      // If idType is changed to "Regular", automatically set ID number to "XXXX-XXXX"
      if (newIdType === 'Regular') {
        setEditedSummaryTransaction({
          ...editedSummaryTransaction,
          originalTransaction: {
            ...editedSummaryTransaction.originalTransaction,
            idType: newIdType,
            idNumber: 'XXXX-XXXX' // Force set ID number when Regular is selected
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
            idNumber: '' // Clear the ID number
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

  // Fix MC# validation to properly handle transaction ID and API response
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

  // Add the missing validateTransaction function
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

  // Add state to track refund mode and tests selected for refund
  const [isRefundMode, setIsRefundMode] = useState(false);
  const [selectedRefunds, setSelectedRefunds] = useState({});

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
        
        const originalPrice = parseFloat(test.originalPrice) || 0;
        toast.info(`Test "${test.testName}" marked for refund (₱${originalPrice.toFixed(2)})`);
        
        setEditedSummaryTransaction(updatedTransaction);
      }
      
      setTimeout(() => recalculateTestTotals(), 0);
      
      return newSelections;
    });
  };

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
        discountedPrice: refundedPrice, // Set to 0 if refunded
        originalPrice: test.originalPrice, // Keep track of original price
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
      refundDate: new Date().toISOString() 
    };
    
    // Validate before saving
    if (!validateTransaction(transactionData)) {
      return;
    }
    
    // Submit the update
    saveEditedTransactionMutation.mutate(transactionData);
  };
  
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
        
        closeTransactionSummary();
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
  
  // Helper function to format transaction data from API response for display
  const formatTransactionForDisplay = (transaction) => {
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
      };
    });
    
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
  
  const handleSaveClick = (transaction) => {
  
    openTransactionSummary(transaction);
    setOpenMenuId(null);
  };

  useEffect(() => {
    const paymentRefunds = Object.values(refundAmounts).reduce((sum, amount) => {
      return sum + amount;
    }, 0);
    
    setPotentialRefundAmount(paymentRefunds);
  }, [refundAmounts]);

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
      // Only allow numeric input with up to 2 decimal places
      const numericRegex = /^\d+(\.\d{0,2})?$/;
      if (value && !numericRegex.test(value)) {
        return; // Reject non-numeric input
      }
      
      const originalPrice = parseFloat(testCopy.originalPrice) || 0;
      const discountedPrice = parseFloat(testCopy.discountedPrice) || 0;
      const numValue = parseFloat(value) || 0;
      const otherField = field === 'cashAmount' ? 'gCashAmount' : 'cashAmount';
      const otherValue = parseFloat(testCopy[otherField]) || 0;
      const totalPayment = numValue + otherValue;
      
      const discountPercentage = parseInt(testCopy.discountPercentage) || 0;
      if (discountPercentage === 0 && totalPayment > originalPrice) {
        toast.error(`Total payment cannot exceed original price of ₱${originalPrice.toFixed(2)} when no discount is applied`);
        return; 
      }
      
      // Set the new value directly (no automatic adjustment)
      testCopy[field] = value;
      
      // Calculate refund if payment exceeds price
      const refundId = `test-${testCopy.testDetailId}`;
      if (totalPayment > discountedPrice) {
        const refundAmount = totalPayment - discountedPrice;
        
        // Update refund tracking for this test
        setRefundAmounts(prev => ({
          ...prev,
          [refundId]: refundAmount
        }));
        
        // Show warning about refund
        toast.info(`Payment exceeds price by ₱${refundAmount.toFixed(2)} - excess will be recorded as refund`);
      } else {
        // Clear any previously tracked refund for this test
        setRefundAmounts(prev => {
          const newRefunds = {...prev};
          delete newRefunds[refundId];
          return newRefunds;
        });
      }
      
      // Update balance - always based on actual calculation
      testCopy.balanceAmount = Math.max(0, discountedPrice - totalPayment).toFixed(2);
    }
    else if (field === 'discountPercentage') {
      // Only allow integer percentages from 0-100
      if (value && !/^\d{0,3}$/.test(value)) {
        return; // Reject non-numeric input
      }
      
      const percentValue = parseInt(value) || 0;
      if (percentValue > 100) {
        toast.warning('Discount cannot exceed 100%');
        testCopy.discountPercentage = "100";
      } else {
        testCopy.discountPercentage = value;
      }
      
      // Calculate new discounted price
      const originalPrice = parseFloat(testCopy.originalPrice) || 0;
      const discountPercent = Math.min(100, parseInt(testCopy.discountPercentage) || 0);
      const newDiscountedPrice = originalPrice * (1 - discountPercent/100);
      testCopy.discountedPrice = newDiscountedPrice.toFixed(2);
      
      // Recalculate balance
      const cashAmount = parseFloat(testCopy.cashAmount || 0);
      const gCashAmount = parseFloat(testCopy.gCashAmount || 0);
      const totalPayment = cashAmount + gCashAmount;
      
      // Check for potential refund if price is now less than payment
      const refundId = `test-${testCopy.testDetailId}`;
      if (totalPayment > newDiscountedPrice) {
        const refundAmount = totalPayment - newDiscountedPrice;
        
        // Update refund tracking
        setRefundAmounts(prev => ({
          ...prev,
          [refundId]: refundAmount
        }));
        
        toast.info(`Payment now exceeds discounted price by ₱${refundAmount.toFixed(2)} - excess will be recorded as refund`);
      } else {
        // Clear any previously tracked refund
        setRefundAmounts(prev => {
          const newRefunds = {...prev};
          delete newRefunds[refundId];
          return newRefunds;
        });
      }
      
      testCopy.balanceAmount = Math.max(0, newDiscountedPrice - totalPayment).toFixed(2);
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

  // Page Rendering Security
  if (isAuthenticating) {
    return null;
  }

  if (!user) {
    return null;
  }

  // Loading state
  if (isLoadingTransactions || isLoadingDepartments || isLoadingReferrers || isLoadingRefunds) {
    return (
      <div className='flex flex-col md:flex-row min-h-screen bg-gray-100'>
        <div className="md:block md:w-64 flex-shrink-0">
          <Sidebar />
        </div>
        <div className="flex-grow p-4 flex items-center justify-center">
          <div className="text-green-800 font-semibold text-lg">Loading data...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (isTransactionsError) {
    return (
      <div className='flex flex-col md:flex-row min-h-screen bg-gray-100'>
        <div className="md:block md:w-64 flex-shrink-0">
          <Sidebar />
        </div>
        <div className="flex-grow p-4 flex items-center justify-center">
          <div className="text-red-500 font-semibold text-lg">
            Error loading transactions: {transactionsError?.message || 'Unknown error'}
          </div>
        </div>
      </div>
    );
  }

  // Right before the return of the main component, recalculate refund values to ensure they're up to date
  const directRefundCalculation = () => {
    let refundTotal = 0;
    let refundCount = 0;

    // Process each transaction in the filtered list
    filteredTransactions.forEach((transaction, index) => {
      
      // Check for refunded tests using the helper function
      const refundedTests = transaction.originalTransaction.TestDetails.filter(test => isTestRefunded(test));
  
      
      transaction.originalTransaction.TestDetails.forEach((test, testIndex) => {
        
        if (isTestRefunded(test)) {
          refundCount++;
          
          const refundValue = parseFloat(test.originalPrice || test.discountedPrice) || 0;
          
          refundTotal += refundValue;
        }
      });
    });
    
    return { 
      refundTotal, 
      refundCount 
    };
  };

  // Get the most up-to-date refund values right before rendering
  const finalRefundValues = directRefundCalculation();
  const finalRefundTotal = finalRefundValues.refundTotal;
  const finalRefundCount = finalRefundValues.refundCount;

  // Add this utility function at the component level
  const getRefundedTestsInfo = (transaction) => {
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

  return (
    <div className='flex flex-col md:flex-row min-h-screen bg-gray-100'>
      <div className="md:block md:w-64 flex-shrink-0">
        <Sidebar />
      </div>
      
      {/* Main content */}
      <div className="flex-grow p-2 md:p-4">
        {/* Income section */}
        <div className="bg-white rounded-lg shadow p-3 md:p-4 mb-4">
          {/* Income header */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-3 md:mb-4">
            <div className="flex items-center mb-3 md:mb-0">
              <h2 className="text-xl md:text-2xl font-bold text-green-800 flex items-center">
                Income
                <span className="ml-2">
                  <img src={Income} className="w-7 h-7 md:w-10 md:h-10" alt="Income Icon"/>
                </span>
              </h2>
            </div>
            
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 w-full md:w-auto">
              <div className="relative w-full md:w-auto">
                <input
                  type="text"
                  placeholder="Search Patient..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-2 border-green-800 focus:border-green-800 focus:outline-none rounded-lg px-2 py-1 md:px-4 md:py-2 w-full text-sm md:text-base"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" className="md:w-4 md:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 w-full md:w-auto">
                <div 
                  className="relative flex items-center border border-green-800 rounded-md bg-green-50 font-bold text-green-700 text-xs md:text-sm flex-1 md:flex-none cursor-pointer"
                  onClick={() => openDatePicker(incomeDateInputRef)}
                >
                  <input
                    ref={incomeDateInputRef}
                    type="date"
                    className="absolute opacity-0 w-full h-full cursor-pointer z-10"
                    onChange={handleDateChange}
                    value={selectedDate.toISOString().split('T')[0]}
                  />
                  <span className="px-1 md:px-2 py-1 flex-grow">
                    {formattedDate}
                  </span>
                  <Calendar 
                    className="mx-1 h-4 w-4 md:h-5 md:w-5 text-green-800" 
                    onClick={(e) => {
                      e.stopPropagation();
                      openDatePicker(incomeDateInputRef);
                    }}
                  />
                </div>
                    
                <button onClick={handleNewIncome} className="px-3 md:px-8 py-1 md:py-2 bg-green-800 text-white rounded-md text-sm md:text-base flex-1 md:flex-none md:w-32 hover:bg-green-600">
                  New
                </button>
              </div>
            </div>
          </div>
          
          {/* Table  */}
          <div className="relative">
            <div className="md:hidden text-sm text-gray-500 italic mb-2 flex items-center">
              <span>Swipe horizontally to view more</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            
            <div className="overflow-x-auto pb-2 relative">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-gray-500 font-medium">No income transactions found on this day</p>
                  <p className="text-sm text-gray-400 mt-1">Add a transaction or adjust your search criteria</p>
                </div>
              ) : (
                <div className="max-h-[70vh] overflow-y-auto">
                  <table className="min-w-full border-collapse text-sm md:text-base">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-green-800 text-white">
                        <th className="py-1 md:py-2 px-1 md:px-2 text-left border border-green-200 sticky left-0 bg-green-800 z-20">MC#</th>
                        <th className="py-1 md:py-2 px-1 md:px-2 text-left border border-green-200">Patient Name</th>
                        
                        {/* Department columns */}
                        {departmentsWithValues.map(dept => (
                          <th 
                            key={dept.departmentId} 
                            className={`py-1 md:py-2 px-1 md:px-2 text-center border border-green-200 ${dept.status !== 'active' ? 'bg-green-700' : ''}`}
                          >
                            {dept.departmentName}
                            {dept.status !== 'active' && <span className="ml-1 text-xs opacity-75">(archived)</span>}
                          </th>
                        ))}
                        
                        <th className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">Gross</th>
                        <th className="py-1 md:py-2 px-1 md:px-2 text-left border border-green-200 w-[80px] md:w-[120px]">Referrer</th>
                        <th className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((transaction) => (
                        <tr 
                          key={transaction.id} 
                          className={transaction.status === 'cancelled' 
                            ? 'bg-gray-100 text-gray-500' 
                            : getRefundedTestsInfo(transaction).count > 0 ? 'bg-red-50' : 'bg-white'
                          }
                        >
                          <td className="py-1 md:py-2 px-1 md:px-2 border border-green-200 sticky left-0 bg-inherit">
                            {editingId === transaction.id ? (
                              <input
                                type="text"
                                value={editedTransaction.id}
                                onChange={(e) => handleEditChange(e, 'id')}
                                className="w-full px-2 py-1 border border-green-600 rounded focus:outline-none focus:ring-1 focus:ring-green-600"
                              />
                            ) : (
                              <span className={transaction.status === 'cancelled' ? 'line-through' : ''}>
                                {transaction.id}
                                {getRefundedTestsInfo(transaction).count > 0 && (
                                  <span className="ml-1 text-xs text-red-600 font-medium">
                                    ({getRefundedTestsInfo(transaction).count} refunded: ₱{getRefundedTestsInfo(transaction).amount.toFixed(2)})
                                  </span>
                                )}
                              </span>
                            )}
                          </td>
                          <td className="py-1 md:py-2 px-1 md:px-2 border border-green-200">
                            {editingId === transaction.id ? (
                              <input
                                type="text"
                                value={editedTransaction.name}
                                onChange={(e) => handleEditChange(e, 'name')}
                                className="w-full px-2 py-1 border border-green-600 rounded focus:outline-none focus:ring-1 focus:ring-green-600"
                              />
                            ) : (
                              <span className={transaction.status === 'cancelled' ? 'line-through' : ''}>
                                {transaction.name}
                              </span>
                            )}
                          </td>
                          
                          {/* Department columns and amounts - fixes for rendering issues */}
                          {departmentsWithValues.map(dept => {
                            const deptData = transaction.departmentRevenues[dept.departmentId];
                            const isArchivedWithValue = dept.status !== 'active' && 
                                                      deptData && 
                                                      deptData.amount > 0;
                            const hasRefund = transaction.status !== 'cancelled' && deptData && deptData.refundAmount > 0;
                                
                            return (
                              <td 
                                key={dept.departmentId} 
                                className={`py-1 md:py-2 px-1 md:px-2 text-center border border-green-200 ${isArchivedWithValue ? 'bg-green-50' : ''} ${hasRefund ? 'relative' : ''}`}
                              >
                                {transaction.status === 'cancelled' 
                                  ? <span className="text-gray-500 text-xs">Cancelled</span> // Clear indication of cancelled transactions without labeling as refunded
                                  : (
                                      <>
                                        {deptData && deptData.amount > 0 ? (
                                          <span className={hasRefund ? 'relative' : ''}>
                                            {deptData.amount.toLocaleString(2)}
                                          </span>
                                        ) : ''}
                                        
                                      </>
                                    )
                                }
                              </td>
                            );
                          })}
                          
                          <td className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">
                            {transaction.status === 'cancelled' ? (
                              '' // Don't display gross amount for cancelled transactions
                            ) : (
                              transaction.grossDeposit.toLocaleString(2)
                            )}
                          </td>
                          <td className="py-0 md:py-1 px-1 md:px-2 border border-green-200 max-w-[80px] md:max-w-[120px]">
                            {editingId === transaction.id ? (
                              <select
                                value={editedTransaction.referrerId}
                                onChange={(e) => handleEditChange(e, 'referrerId')}
                                className="w-full px-1 py-1 border border-green-600 rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-600"
                              >
                                <option value="">Out Patient</option>
                                {referrers.map(ref => (
                                  <option key={ref.referrerId} value={ref.referrerId}>
                                    Dr. {ref.lastName}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div 
                                title={`Referrer: ${transaction.originalTransaction?.referrerId || 'None'}`} 
                                className={`truncate text-xs md:text-sm font-medium ${transaction.status === 'cancelled' ? 'text-gray-500' : ''}`}
                              >
                                {transaction.referrer} {/* Always display referrer, even for cancelled transactions */}
                              </div>
                            )}
                          </td>
                          <td className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">
                            {transaction.status !== 'cancelled' && (
                              <div className="relative flex justify-center">
                                {editingId === transaction.id ? (
                                  <div className="flex space-x-1">
                                    <button 
                                      className="text-green-600 hover:text-green-800 focus:outline-none"
                                      onClick={() => handleSaveClick(transaction)}
                                      disabled={saveTransactionMutation.isPending}
                                    >
                                      <Save size={16} className="md:w-5 md:h-5" />
                                    </button>
                                    <button  
                                      className="text-red-600 hover:text-red-800 focus:outline-none"
                                      onClick={handleCancelInlineEdit}
                                    >
                                      <X size={16} className="md:w-5 md:h-5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button 
                                    className="text-gray-600 hover:text-green-600 focus:outline-none"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleIncomeMenu(transaction.id);
                                    }}
                                  >
                                    <MoreVertical size={16} className="md:w-5 md:h-5" />
                                  </button>
                                )}
                                
                                {openMenuId === transaction.id && !editingId && (
                                  <div 
                                    className="absolute right-0 top-full mt-1 w-24 bg-white shadow-lg rounded-md border border-gray-200 z-20"
                                    onClick={handleDropdownClick}
                                  >
                                    <button 
                                      className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-blue-600"
                                      onClick={() => handleEditClick(transaction)}
                                    >
                                      <Edit size={14} className="mr-2" />
                                      Edit
                                    </button>
                                    <button
                                      className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-red-600"
                                      onClick={() => handleCancelClick(transaction)}
                                    >
                                      <X size={14} className="mr-2" />
                                      Cancel
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                            {transaction.status === 'cancelled' && (
                              <span className="text-red-500 text-xs md:text-sm font-medium">Cancelled</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      
                      {/* Totals row */}
                      <tr className="bg-green-100">
                        <td colSpan={2} className="py-1 md:py-2 px-1 md:px-2 font-bold border border-green-200 text-green-800 sticky left-0 bg-green-100">TOTAL:</td>
                        
                        {/* Department totals - include inactive departments with values */}
                        {departmentsWithValues.map(dept => {
                          // Calculate net revenue (total minus refunds)
                          const grossRevenue = departmentTotals[dept.departmentId] || 0;
                          const refundAmount = departmentRefundTotals[dept.departmentId] || 0;
                          const netRevenue = Math.max(0, grossRevenue);
                          
                          return (
                            <td 
                              key={dept.departmentId} 
                              className={`py-1 md:py-2 px-1 md:px-2 text-center border border-green-200 ${dept.status !== 'active' ? 'bg-green-50' : ''}`}
                            >
                              <div className="font-bold">
                                {netRevenue > 0 ? netRevenue.toLocaleString(2) : '0.00'}
                              </div>
                            </td>
                          );
                        })}
                          
                        <td className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">
                          {totalGross.toLocaleString(2)}
                        </td>
                        <td className="py-1 md:py-2 px-1 md:px-2 border border-green-200"></td>
                        <td className="py-1 md:py-2 px-1 md:px-2 border border-green-200"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Remove pagination controls and just show count */}
              <div className="flex justify-end mt-4 px-2">
                <div className="text-sm text-gray-600">
                  Showing {filteredTransactions.length} {filteredTransactions.length === 1 ? 'patient' : 'patients'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="mt-2 flex flex-col md:flex-row justify-between p-2">
            <div className="flex flex-wrap items-center mb-4 md:mb-0">
              {filteredTransactions.length > 0 && (
                <button className="bg-green-800 text-white px-4 md:px-6 py-2 rounded flex items-center mb-2 md:mb-0 text-sm md:text-base hover:bg-green-600">
                  Generate Report <Download className="ml-2 h-3 w-3 md:h-4 md:w-4" />
                </button>
              )}
            </div>
            
            {/* Summary Box */}
            <div className="mt-2 md:mt-0 border border-gray-300 w-full md:w-auto">
              <table className="border-collapse w-full md:w-auto text-sm md:text-base">
                <thead className='bg-yellow-500 text-gray-800 font-bold'>
                  <tr>
                    <th className="px-4 py-2 text-white" colSpan="2">INCOME SUMMARY</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="bg-blue-500 text-white font-medium py-1 px-2 md:px-4 border border-gray-300 text-center">
                      GCASH
                    </td>
                    <td className="bg-gray-100 text-green-800 font-medium py-1 px-4 md:px-8 border border-gray-300 text-right">
                      {totalGCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr>
                    <td className="bg-red-500 text-white font-medium py-1 px-2 md:px-4 border border-gray-300 text-center">
                      REFUND
                    </td>
                    <td className="bg-gray-100 text-red-600 font-medium py-1 px-4 md:px-8 border border-gray-300 text-right">
                      {(() => {
                        // Calculate refund total directly inside the render function
                        let refundTotal = 0;
                        let refundCount = 0;
                        
                        filteredTransactions.forEach(transaction => {
                          if (transaction?.originalTransaction?.TestDetails) {
                            transaction.originalTransaction.TestDetails.forEach(test => {
                              if (isTestRefunded(test)) {
                                refundCount++;
                                const amount = parseFloat(test.originalPrice || test.discountedPrice) || 0;
                                refundTotal += amount;
                              }
                            });
                          }
                        });
                        
                        return (
                          <>
                            {refundTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </>
                        );
                      })()}
                    </td>
                  </tr>
                  <tr>
                    <td className="bg-green-800 text-white font-medium py-1 px-2 md:px-4 border border-gray-300 text-center">
                      DEPOSIT
                    </td>
                    <td className="bg-gray-100 text-green-800 font-medium py-1 px-4 md:px-8 border border-gray-300 text-right">
                      {(() => {
                        // Calculate deposit directly: total gross - refunds - gcash
                        let refundTotal = 0;
                        
                        filteredTransactions.forEach(transaction => {
                          if (transaction?.originalTransaction?.TestDetails) {
                            transaction.originalTransaction.TestDetails.forEach(test => {
                              if (isTestRefunded(test)) {
                                const amount = parseFloat(test.originalPrice || test.discountedPrice) || 0;
                                refundTotal += amount;
                              }
                            });
                          }
                        });
                        
                        const depositAmount = Math.max(0, totalGross - refundTotal - totalGCash);
                        
                        return depositAmount.toLocaleString(undefined, { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        });
                      })()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Expenses section */}
        <div className="bg-white rounded-lg shadow p-3 md:p-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-3 md:mb-4">
            <div className="flex items-center mb-3 md:mb-0">
              <h2 className="text-xl md:text-2xl font-bold text-green-800 flex items-center">
                Expenses
                <span className="ml-2">
                  <img src={Expense} className="w-7 h-7 md:w-10 md:h-10" alt="Income Icon"/>
                </span>
              </h2>
            </div>
            
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 w-full md:w-auto">
              <div className="relative w-full md:w-auto">
                <input
                  type="text"
                  placeholder="Search Expenses..."
                  className="border-2 border-green-800 focus:border-green-800 focus:outline-none rounded-lg px-2 py-1 md:px-4 md:py-2 w-full text-sm md:text-base"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" className="md:w-4 md:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
              </div>
              
              <div className="flex space-x-2 w-full md:w-auto justify-between md:justify-start">
                <div 
                  className="relative flex items-center border border-green-800 rounded-md bg-green-50 font-bold text-green-700 text-xs md:text-sm flex-1 md:flex-none cursor-pointer"
                  onClick={() => openDatePicker(expenseDateInputRef)}
                >
                  <input
                    ref={expenseDateInputRef}
                    type="date"
                    className="absolute opacity-0 w-full h-full cursor-pointer z-10" 
                    onChange={handleDateChange}
                    value={selectedDate.toISOString().split('T')[0]}
                  />
                  <span className="px-1 md:px-2 py-1 flex-grow">
                    {formattedDate}
                  </span>
                  <Calendar 
                    className="mx-1 h-4 w-4 md:h-5 md:w-5 text-green-800" 
                    onClick={(e) => {
                      e.stopPropagation();
                      openDatePicker(expenseDateInputRef);
                    }}
                  />
                </div>
                    
                <button onClick={handleNewExpenses} className="px-3 md:px-8 py-1 md:py-2 bg-green-800 text-white rounded-md text-sm md:text-base flex-1 md:flex-none md:w-32 hover:bg-green-600">
                  New
                </button>
              </div>
            </div>
          </div>
          
          {/* Expenses table */}
          <div className="relative">
            <div className="md:hidden text-sm text-gray-500 italic mb-2 flex items-center">
              <span>Swipe horizontally to view more</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            
            <div className="overflow-x-auto pb-2 relative">
              {/* Placeholder for expenses - replace with actual expenses data check */}
              <div className="text-center py-8 bg-gray-50 rounded-md border border-gray-200">
                <p className="text-gray-500 font-medium">No expenses found on this day</p>
                <p className="text-sm text-gray-400 mt-1">Add expenses or adjust your search criteria</p>
              </div>
              
              <div className="flex justify-end mt-4 px-2">
                <div className="text-sm text-gray-600">
                  Showing 0 expenses
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Transaction Summary Modal  */}
      {isTransactionSummaryOpen && selectedSummaryTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded-md w-full max-w-3xl max-h-[90vh] md:max-h-[85vh] flex flex-col">
            <div className="bg-green-800 text-white p-3 md:p-4 flex justify-between items-center rounded-t-md sticky top-0 z-10">
              <h2 className="text-lg md:text-xl font-bold">
                {isEditingSummary ? 'Edit Transaction' : 'Transaction Summary'}
              </h2>
              <button
                onClick={closeTransactionSummary}
                className="text-white hover:text-gray-200 focus:outline-none"
              >
                <X size={20} className="md:w-6 md:h-6" />
              </button>
            </div>

            {selectedSummaryTransaction.isLoading ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-green-800 font-semibold">Loading transaction data...</div>
              </div>
            ) : (
              <>
                <div className="overflow-y-auto flex-1 scrollbar-hide"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch'
                  }}>
                  {isEditingSummary && isRefundMode && (
                    <div className="bg-red-50 p-3 border-l-4 border-red-500 mb-3">
                      <h3 className="text-red-700 font-bold">Refund Mode Active</h3>
                      <p className="text-red-600 text-sm">
                        Select tests to refund by checking the boxes in the Refund column. 
                        Selected tests will be marked as refunded and completely removed from revenue calculations.
                        The original price of the test will be added to the daily refund total.
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 border-b border-gray-200">
                    <div className="p-3 md:border-r border-gray-200">
                      <div className="grid grid-cols-3 gap-1">
                        <div className="font-bold text-green-800">First Name:</div>
                        <div className="col-span-2 text-green-700">
                          {isEditingSummary ? (
                            <input
                              type="text"
                              value={editedSummaryTransaction.originalTransaction.firstName}
                              onChange={(e) => handleSummaryInputChange(e, 'firstName')}
                              className="w-full px-2 py-1 border border-green-600 rounded focus:outline-none focus:ring-1 focus:ring-green-600"
                            />
                          ) : (
                            selectedSummaryTransaction.originalTransaction?.firstName || 'N/A'
                          )}
                        </div>

                        <div className="font-bold text-green-800">Last Name:</div>
                        <div className="col-span-2 text-green-700">
                          {isEditingSummary ? (
                            <input
                              type="text"
                              value={editedSummaryTransaction.originalTransaction.lastName}
                              onChange={(e) => handleSummaryInputChange(e, 'lastName')}
                              className="w-full px-2 py-1 border border-green-600 rounded focus:outline-none focus:ring-1 focus:ring-green-600"
                            />
                          ) : (
                            selectedSummaryTransaction.originalTransaction?.lastName || 'N/A'
                          )}
                        </div>
                        
                        <div className="font-bold text-green-800">Referrer:</div>
                        <div className="col-span-2 text-green-700">
                          {isEditingSummary ? (
                            <select
                              value={editedSummaryTransaction.originalTransaction.referrerId || ""}
                              onChange={(e) => handleSummaryInputChange(e, 'referrerId')}
                              className="w-full px-2 py-1 border border-green-600 rounded focus:outline-none focus:ring-1 focus:ring-green-600"
                            >
                              <option value="">Out Patient</option>
                              {referrers.map(ref => (
                                <option key={ref.referrerId} value={ref.referrerId}>
                                  Dr. {ref.lastName}
                                </option>
                              ))}
                            </select>
                          ) : (
                            selectedSummaryTransaction.referrer || 'Out Patient'
                          )}
                        </div>

                        <div className="font-bold text-green-800">MC #:</div>
                        <div className="col-span-2 text-green-700">
                          {isEditingSummary ? (
                            <div>
                              <input
                                type="text"
                                value={editedSummaryTransaction.id}
                                onChange={handleMcNoChange}
                                className={`w-full px-2 py-1 border ${mcNoExists ? 'border-red-500' : 'border-green-600'} rounded focus:outline-none focus:ring-1 ${mcNoExists ? 'focus:ring-red-500' : 'focus:ring-green-600'}`}
                              />
                              {isMcNoChecking && <span className="text-xs text-blue-500 mt-1">Checking...</span>}
                              {mcNoExists && <span className="text-xs text-red-500 mt-1">This MC# already exists in the database</span>}
                            </div>
                          ) : (
                            selectedSummaryTransaction.id
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-3">
                      <div className="grid grid-cols-3 gap-1">
                        <div className="font-bold text-green-800">Birth Date:</div>
                        <div className="col-span-2 text-green-700">
                          {isEditingSummary ? (
                            <div className="relative">
                              <input
                                type="date"
                                value={editedSummaryTransaction.originalTransaction.birthDate ? 
                                  new Date(editedSummaryTransaction.originalTransaction.birthDate).toISOString().split('T')[0] : ''}
                                onChange={(e) => handleSummaryInputChange(e, 'birthDate')}
                                className="w-full px-2 py-1 border border-green-600 rounded cursor-pointer focus:outline-none focus:ring-1 focus:ring-green-600"
                                onClick={(e) => e.target.showPicker()}
                              />
                            </div>
                          ) : (
                            <>
                              {selectedSummaryTransaction.originalTransaction?.birthDate
                                ? `${formatShortDate(selectedSummaryTransaction.originalTransaction.birthDate)}  (Age: ${calculateAge(selectedSummaryTransaction.originalTransaction.birthDate)})`
                                : 'N/A'}
                            </>
                          )}
                        </div>

                        <div className="font-bold text-green-800">Sex:</div>
                        <div className="col-span-2 text-green-700">
                          {isEditingSummary ? (
                            <select
                              value={editedSummaryTransaction.originalTransaction.sex || ""}
                              onChange={(e) => handleSummaryInputChange(e, 'sex')}
                              className="w-full px-2 py-1 border border-green-600 rounded focus:outline-none focus:ring-1 focus:ring-green-600"
                            >
                              <option value="">Select</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                            </select>
                          ) : (
                            selectedSummaryTransaction.originalTransaction?.sex || 'N/A'
                          )}
                        </div>

                        <div className="font-bold text-green-800">ID Type:</div>
                        <div className="col-span-2 text-green-700">
                          {isEditingSummary ? (
                            <select
                              value={editedSummaryTransaction.originalTransaction.idType || ''}
                              onChange={(e) => handleSummaryInputChange(e, 'idType')}
                              className="w-full px-2 py-1 border border-green-600 rounded focus:outline-none focus:ring-1 focus:ring-green-600"
                            >
                              {idTypeOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          ) : (
                            selectedSummaryTransaction.originalTransaction?.idType || 'Regular'
                          )}
                        </div>

                        <div className="font-bold text-green-800">ID #:</div>
                        <div className="col-span-2 text-green-700">
                          {isEditingSummary ? (
                            <input
                              type="text"
                              value={editedSummaryTransaction.originalTransaction.idNumber || ''}
                              onChange={(e) => handleSummaryInputChange(e, 'idNumber')}
                              className="w-full px-2 py-1 border border-green-600 rounded focus:outline-none focus:ring-1 focus:ring-green-600"
                              readOnly={editedSummaryTransaction.originalTransaction.idType === 'Regular'} 
                              disabled={editedSummaryTransaction.originalTransaction.idType === 'Regular'}
                            />
                          ) : (
                            selectedSummaryTransaction.originalTransaction?.idNumber || 'N/A'
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-sm">
                      <thead className="bg-gray-100 sticky top-0 z-10">
                        <tr>
                          <th className="p-1 md:p-2 text-left border-b border-gray-200 font-bold text-green-800">Test Name</th>
                          <th className="p-1 md:p-2 text-left border-b border-gray-200 font-bold text-green-800">Original Price</th>
                          <th className="p-1 md:p-2 text-left border-b border-gray-200 font-bold text-green-800">Disc. %</th>
                          <th className="p-1 md:p-2 text-left border-b border-gray-200 font-bold text-green-800">Price</th>
                          <th className="p-1 md:p-2 text-left border-b border-gray-200 font-bold text-green-800">Cash</th>
                          <th className="p-1 md:p-2 text-left border-b border-gray-200 font-bold text-green-800">GCash</th>
                          <th className="p-1 md:p-2 text-left border-b border-gray-200 font-bold text-green-800">Balance</th>
                          {isEditingSummary && isRefundMode && (
                            <th className="p-1 md:p-2 text-center border-b border-gray-200 font-bold text-red-600">Refund</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {(isEditingSummary 
                          ? editedSummaryTransaction?.originalTransaction?.TestDetails 
                          : selectedSummaryTransaction?.originalTransaction?.TestDetails)
                          ?.map((test, index) => (
                          <tr key={index} 
                              className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} ${test.status === 'refunded' && !isEditingSummary ? "bg-red-50" : ""}`}>
                            <td className="p-1 md:p-2 border-b border-gray-200">
                              <div className="text-xs md:text-sm">
                                {test.testName}
                                {test.status === 'refunded' && 
                                  <span className="ml-1 text-xs text-red-500 font-medium">(Refunded)</span>}
                              </div>
                            </td>
                            <td className="p-1 md:p-2 border-b border-gray-200">
                              <div className={`text-xs md:text-sm font-medium ${test.status === 'refunded' && !isEditingSummary ? "text-red-500" : ""}`}>
                                {parseFloat(test.originalPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </td>
                            <td className="p-1 md:p-2 border-b border-gray-200">
                              {isEditingSummary ? (
                                <input
                                  type="text" 
                                  inputMode="numeric" 
                                  pattern="[0-9]*" 
                                  value={test.discountPercentage || ''}
                                  onChange={(e) => handleTestDetailChange(index, 'discountPercentage', e.target.value)}
                                  style={noSpinnerStyle}
                                  className="w-full px-2 py-1 border border-green-600 rounded focus:outline-none focus:ring-1 focus:ring-green-600 text-xs md:text-sm"
                                  placeholder="0"
                                  disabled={test.status === 'refunded' || selectedRefunds[test.testDetailId]}
                                />
                              ) : (
                                <div className={`text-xs md:text-sm ${test.status === 'refunded' ? "text-red-500" : ""}`}>
                                  {`${test.discountPercentage}%`}
                                </div>
                              )}
                            </td>
                            <td className="p-1 md:p-2 border-b border-gray-200">
                              <div className={`text-xs md:text-sm font-medium ${test.status === 'refunded' && !isEditingSummary ? "text-red-500 line-through" : ""}`}>
                                {parseFloat(test.discountedPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                {test.status === 'refunded' && <span className="ml-1 text-red-500">→ 0.00</span>}
                              </div>
                            </td>
                            <td className="p-1 md:p-2 border-b border-gray-200">
                              {isEditingSummary ? (
                                <input
                                  type="text" 
                                  inputMode="decimal" 
                                  value={test.cashAmount || ''}
                                  onChange={(e) => handleTestDetailChange(index, 'cashAmount', e.target.value)}
                                  onKeyPress={(e) => {
                                    // Allow only numbers and decimal point
                                    const regex = /^[0-9.]*$/;
                                    if (!regex.test(e.key)) {
                                      e.preventDefault();
                                    }
                                  }}
                                  style={{...noSpinnerStyle, caretColor: 'auto'}}
                                  className="w-full px-2 py-1 border border-green-600 rounded focus:outline-none focus:ring-1 focus:ring-green-600 text-xs md:text-sm"
                                  placeholder="0.00"
                                  disabled={test.status === 'refunded' || selectedRefunds[test.testDetailId]}
                                />
                              ) : (
                                <div className={`text-xs md:text-sm ${test.status === 'refunded' ? "text-red-500 line-through" : ""}`}>
                                  {parseFloat(test.cashAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                              )}
                            </td>
                            <td className="p-1 md:p-2 border-b border-gray-200">
                              {isEditingSummary ? (
                                <input
                                  type="text" 
                                  inputMode="decimal" 
                                  value={test.gCashAmount || ''}
                                  onChange={(e) => handleTestDetailChange(index, 'gCashAmount', e.target.value)}
                                  onKeyPress={(e) => {
                                    // Allow only numbers and decimal point
                                    const regex = /^[0-9.]*$/;
                                    if (!regex.test(e.key)) {
                                      e.preventDefault();
                                    }
                                  }}
                                  style={{...noSpinnerStyle, caretColor: 'auto'}}
                                  className="w-full px-2 py-1 border border-green-600 rounded focus:outline-none focus:ring-1 focus:ring-green-600 text-xs md:text-sm"
                                  placeholder="0.00"
                                  disabled={test.status === 'refunded' || selectedRefunds[test.testDetailId]}
                                />
                              ) : (
                                <div className={`text-xs md:text-sm ${test.status === 'refunded' ? "text-red-500 line-through" : ""}`}>
                                  {parseFloat(test.gCashAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                              )}
                            </td>
                            <td className="p-1 md:p-2 border-b border-gray-200">
                              {isEditingSummary ? (
                                <input
                                  type="text" 
                                  inputMode="decimal" 
                                  value={test.balanceAmount || ''}
                                  onChange={(e) => handleTestDetailChange(index, 'balanceAmount', e.target.value)}
                                  className="w-full px-2 py-1 border border-green-600 rounded focus:outline-none focus:ring-1 focus:ring-green-600 text-xs md:text-sm"
                                  placeholder="0.00"
                                  disabled={test.status === 'refunded' || selectedRefunds[test.testDetailId]}
                                />
                              ) : (
                                <div className={`text-xs md:text-sm ${test.status === 'refunded' ? "text-red-500 line-through" : ""}`}>
                                  {parseFloat(test.balanceAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                              )}
                            </td>
                            {isEditingSummary && isRefundMode && (
                              <td className="p-1 md:p-2 border-b border-gray-200 text-center">
                                <input
                                  type="checkbox"
                                  checked={!!selectedRefunds[test.testDetailId] || test.status === 'refunded'}
                                  onChange={() => handleRefundSelection(test.testDetailId)}
                                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                  disabled={test.status === 'refunded'}
                                />
                                {(!!selectedRefunds[test.testDetailId] || test.status === 'refunded') && (
                                  <div className="text-xs text-red-600 mt-1 font-medium">
                                    {test.status === 'refunded' ? 'Already refunded' : 'Will be refunded'}
                                  </div>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                      
                      {/* Total row - protect against undefined TestDetails */}
                      {(isEditingSummary 
                        ? editedSummaryTransaction?.originalTransaction?.TestDetails?.length 
                        : selectedSummaryTransaction?.originalTransaction?.TestDetails?.length) > 0 && (
                        <tfoot>
                          <tr className="bg-green-100 font-bold">
                            <td className="p-2 border-b border-gray-200 text-green-800" colSpan={4}>TOTAL</td>
                            <td className="p-2 border-b border-gray-200 text-green-800">
                              {(() => {
                                // Calculate cash total excluding refunded tests
                                let cashTotal = 0;
                                const testDetails = isEditingSummary
                                  ? editedSummaryTransaction?.originalTransaction?.TestDetails
                                  : selectedSummaryTransaction?.originalTransaction?.TestDetails;
                                  
                                if (testDetails) {
                                  testDetails.forEach(test => {
                                    if (isEditingSummary || test.status !== 'refunded') {
                                      cashTotal += parseFloat(test.cashAmount || 0);
                                    }
                                  });
                                }
                                
                                return cashTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                              })()}
                            </td>
                            <td className="p-2 border-b border-gray-200 text-green-800">
                              {(() => {
                                // Calculate GCash total excluding refunded tests
                                let gCashTotal = 0;
                                const testDetails = isEditingSummary
                                  ? editedSummaryTransaction?.originalTransaction?.TestDetails
                                  : selectedSummaryTransaction?.originalTransaction?.TestDetails;
                                
                                if (testDetails) {
                                  testDetails.forEach(test => {
                                    if (isEditingSummary || test.status !== 'refunded') {
                                      gCashTotal += parseFloat(test.gCashAmount || 0);
                                    }
                                  });
                                }
                                
                                return gCashTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                              })()}
                            </td>
                            <td className="p-2 border-b border-gray-200 text-green-800">
                              {(() => {
                                // Calculate balance total excluding refunded tests
                                let balanceTotal = 0;
                                const testDetails = isEditingSummary
                                  ? editedSummaryTransaction?.originalTransaction?.TestDetails
                                  : selectedSummaryTransaction?.originalTransaction?.TestDetails;
                                
                                if (testDetails) {
                                  testDetails.forEach(test => {
                                    if (isEditingSummary || test.status !== 'refunded') {
                                      balanceTotal += parseFloat(test.balanceAmount || 0);
                                    }
                                  });
                                }
                                
                                return balanceTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                              })()}
                            </td>
                            {isEditingSummary && isRefundMode && (
                              <td className="p-2 border-b border-gray-200 text-red-600">
                                {Object.keys(selectedRefunds).length} item(s)
                              </td>
                            )}
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
                
                <div className="flex justify-end gap-4 p-4 border-t border-gray-200 sticky bottom-0 bg-white">
                  {isEditingSummary ? (
                    <>
                      <button
                        className="bg-gray-500 text-white px-8 py-2 rounded hover:bg-gray-600 focus:outline-none"
                        onClick={handleCancelEdit}
                        disabled={saveEditedTransactionMutation.isPending}
                      >
                        Cancel
                      </button>
                      {isRefundMode ? (
                        <button
                          className="bg-blue-600 text-white px-8 py-2 rounded hover:bg-blue-700 focus:outline-none"
                          onClick={toggleRefundMode}
                          disabled={saveEditedTransactionMutation.isPending}
                        >
                          Exit Refund Mode
                        </button>
                      ) : (
                        <button
                          className="bg-red-600 text-white px-8 py-2 rounded hover:bg-red-700 focus:outline-none"
                          onClick={toggleRefundMode}
                          disabled={saveEditedTransactionMutation.isPending}
                        >
                          Refund
                        </button>
                      )}
                      <button
                        className="bg-green-800 text-white px-8 py-2 rounded hover:bg-green-700 focus:outline-none"
                        onClick={handleSaveEdit}
                        disabled={saveEditedTransactionMutation.isPending}
                      >
                        {saveEditedTransactionMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="bg-green-800 text-white px-8 py-2 rounded hover:bg-green-700 focus:outline-none"
                        onClick={handleEnterEditMode}
                      >
                        Edit
                      </button>
                      <button
                        className="bg-green-800 text-white px-8 py-2 rounded hover:bg-green-700 focus:outline-none"
                      >
                        Export
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold text-red-600 mb-4">Confirm Cancellation</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to cancel this transaction? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
                onClick={() => setIsConfirmModalOpen(false)}
              >
                No, Keep It
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={confirmCancellation}
                disabled={cancelTransactionMutation.isPending}
              >
                {cancelTransactionMutation.isPending ? 'Cancelling...' : 'Yes, Cancel It'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add ToastContainer near the top of the component */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop

        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default Transaction;
