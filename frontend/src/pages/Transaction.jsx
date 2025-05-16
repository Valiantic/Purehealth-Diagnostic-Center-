import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useQueryClient } from '@tanstack/react-query';
import { transactionAPI } from '../services/api';
import ConfirmationModal from '../components/modals/ConfirmationModal';
import TransactionSummaryModal from '../components/modals/TransactionSummaryModal';
import { formatDate, isTestRefunded, getRefundedTestsInfo } from '../utils/transactionUtils';
import { Calendar } from 'lucide-react';
import Income from '../assets/icons/income_logo.png';

// Import custom hooks
import useAuth from '../hooks/useAuth';
import useTransactionData from '../hooks/useTransactionData';
import useTransactionMutations from '../hooks/useTransactionMutations';

// Import utility functions
import { 
  formatTransactionForDisplay, 
  validateTransaction, 
  checkMcNoExists,
  recalculateTestTotals,
  directRefundCalculation
} from '../utils/transactionHelpers';

// Import reusable components
import TransactionHeader from '../components/transactions/TransactionHeader';
import TransactionTableRow from '../components/transactions/TransactionTableRow';
import TransactionSummarySection from '../components/transactions/TransactionSummarySection';
import ExpenseHeader from '../components/transactions/ExpenseHeader';

const Transaction = () => {
  // Auth hook
  const { user, isAuthenticating } = useAuth();
  
  // State for UI
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
  
  // MC# validation state
  const [mcNoExists, setMcNoExists] = useState(false);
  const [isMcNoChecking, setIsMcNoChecking] = useState(false);
  
  // Refund tracking state
  const [potentialRefundAmount, setPotentialRefundAmount] = useState(0);
  const [refundAmounts, setRefundAmounts] = useState({});
  
  // Edit transaction state
  const [editingId, setEditingId] = useState(null);
  const [editedTransaction, setEditedTransaction] = useState(null);
  
  // Refund mode state
  const [isRefundMode, setIsRefundMode] = useState(false);
  const [selectedRefunds, setSelectedRefunds] = useState({});
  
  // ID Type options for dropdowns
  const idTypeOptions = [
    { value: 'Regular', label: 'Regular' },
    { value: 'Person with Disability', label: 'PWD' },
    { value: 'Senior Citizen', label: 'Senior Citizen' }
  ];
  
  // References for date pickers
  const incomeDateInputRef = React.useRef(null);
  const expenseDateInputRef = React.useRef(null);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Use custom hook for transaction data
  const {
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
    isLoading: isLoadingTransactions,
    isError: isTransactionsError,
    error: transactionsError,
    pendingRefundAmount,
    setPendingRefundAmount,
    calculateRefundTotal,
    isLoadingDepartments,
    isLoadingReferrers,
    isLoadingRefunds
  } = useTransactionData(selectedDate, searchTerm);
  
  // Use custom hook for transaction mutations
  const {
    cancelTransactionMutation,
    saveTransactionMutation,
    saveEditedTransactionMutation
  } = useTransactionMutations(
    user?.userId, 
    selectedDate,
    (hasRefunds) => {
      // Callback to run after successful save
      if (hasRefunds) {
        // Calculate new refund total from selected refunds
        const newRefundTotal = Object.keys(selectedRefunds).reduce((total, testDetailId) => {
          const test = editedSummaryTransaction.originalTransaction.TestDetails.find(
            t => t.testDetailId === testDetailId && t.status !== 'refunded'
          );
          if (test) {
            total += parseFloat(test.originalPrice || test.discountedPrice) || 0;
          }
          return total;
        }, 0);
        
        // Update pending refund amount for immediate UI feedback
        if (newRefundTotal > 0) {
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
      }
      
      // Reset editing state
      setIsEditingSummary(false);
      setEditedSummaryTransaction(null);
      setSelectedRefunds({});
      closeTransactionSummary();
    }
  );
  
  // Format the date for display
  const formattedDate = formatDate(selectedDate);

  // Handle date change
  const handleDateChange = (e) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      setSelectedDate(newDate);
      setPendingRefundAmount(0);
    }
  };
  
  // Function to open the date picker
  const openDatePicker = (inputRef) => {
    if (inputRef && inputRef.current) {
      inputRef.current.showPicker();
    }
  };

  // Navigation handlers
  const handleNewExpenses = () => navigate('/add-expenses');
  const handleNewIncome = () => navigate('/add-income');

  // Toggle dropdown menu for income rows
  const toggleIncomeMenu = (id) => {
    setOpenMenuId((prevId) => (prevId === id ? null : id));
    if (openExpenseMenuId) setOpenExpenseMenuId(null);
  };

  // Toggle dropdown menu for expense rows
  const toggleExpenseMenu = (id) => {
    setOpenExpenseMenuId((prevId) => (prevId === id ? null : id));
    if (openMenuId) setOpenMenuId(null);
  };

  // Reset search when date changes
  useEffect(() => {
    setSearchTerm('');
  }, [selectedDate]);

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

  // Handle opening the transaction summary
  const handleViewSummary = async (transaction) => {
    // Set loading state
    setSelectedSummaryTransaction({
      ...transaction,
      isLoading: true
    });
    
    setIsTransactionSummaryOpen(true);
    
    try {
      // Fetch the full transaction details 
      const response = await transactionAPI.getTransactionById(transaction.originalTransaction.transactionId);
      const fullTransaction = response.data.data;
      
      // Format the full transaction for display
      const formattedTransaction = formatTransactionForDisplay(fullTransaction, referrers, departments);
      
      // Update with complete data
      setSelectedSummaryTransaction(formattedTransaction);
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      toast.error('Failed to load transaction details.');
      closeTransactionSummary();
    }
  };

  // Close the transaction summary modal
  const closeTransactionSummary = () => {
    setIsTransactionSummaryOpen(false);
    setSelectedSummaryTransaction(null);
    setIsEditingSummary(false);
    setEditedSummaryTransaction(null);
    setMcNoExists(false);
    setIsMcNoChecking(false);
    setIsRefundMode(false);
    setSelectedRefunds({});
  };

  // Handle entering edit mode for transaction
  const handleEnterEditMode = () => {
    setIsEditingSummary(true);
    setEditedSummaryTransaction({...selectedSummaryTransaction});
  };

  // Handle cancel edit for transaction summary
  const handleCancelEdit = () => {
    setIsEditingSummary(false);
    setEditedSummaryTransaction(null);
    setMcNoExists(false);
    setIsRefundMode(false);
    setSelectedRefunds({});
  };

  // Handle saving edited transaction
  const handleSaveEdit = () => {
    if (!editedSummaryTransaction) return;
    
    try {
      const validation = validateTransaction(editedSummaryTransaction.originalTransaction);
      if (!validation.isValid) {
        toast.error(validation.errors[0]);
        return;
      }
      
      const hasRefunds = Object.keys(selectedRefunds).length > 0;
      const saveData = {
        ...editedSummaryTransaction.originalTransaction,
        userId: user?.userId,
        updatedFields: {
          // Fields that have been edited
          mcNo: editedSummaryTransaction.id,
          firstName: editedSummaryTransaction.name.split(' ')[0] || '',
          lastName: editedSummaryTransaction.name.split(' ').slice(1).join(' ') || '',
          // Add other fields that might have changed
        }
      };
      
      // If in refund mode, prepare refund data
      if (hasRefunds) {
        saveData.refundTestDetailIds = Object.keys(selectedRefunds);
      }
            
      saveEditedTransactionMutation.mutate({
        transactionId: editedSummaryTransaction.originalTransaction.transactionId,
        ...saveData
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries(['transactions']);
          onSuccessCallback(hasRefunds);
        }
      });
      
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast.error('Failed to save changes: ' + (error.message || 'Unknown error'));
    }
  };

  // Handle MC# change and check for duplicates
  const handleMcNoChange = async (e) => {
    const newMcNo = e.target.value;
    
    // Update the edited transaction
    setEditedSummaryTransaction(prev => ({
      ...prev,
      id: newMcNo,
      originalTransaction: {
        ...prev.originalTransaction,
        mcNo: newMcNo
      }
    }));
    
    // Check if the MC# already exists (but not the current one)
    if (newMcNo && newMcNo !== selectedSummaryTransaction.id) {
      setIsMcNoChecking(true);
      
      try {
        const exists = await checkMcNoExists(newMcNo);
        setMcNoExists(exists);
      } catch (error) {
        console.error('Error checking MC#:', error);
      } finally {
        setIsMcNoChecking(false);
      }
    } else {
      setMcNoExists(false);
    }
  };

  // Handle input change in the transaction summary
  const handleSummaryInputChange = (e, field) => {
    const { value } = e.target;
    
    setEditedSummaryTransaction(prev => {
      if (!prev) return null;
      
      // For name field, update both display name and original fields
      if (field === 'name') {
        const nameParts = value.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        return {
          ...prev,
          name: value,
          originalTransaction: {
            ...prev.originalTransaction,
            firstName,
            lastName
          }
        };
      }
      
      // For other fields, update in original transaction
      return {
        ...prev,
        originalTransaction: {
          ...prev.originalTransaction,
          [field]: value
        }
      };
    });
  };

  // Handle changes to test details
  const handleTestDetailChange = (testDetailId, field, value) => {
    if (!editedSummaryTransaction) return;
    
    const updatedTransaction = {...editedSummaryTransaction};
    const index = updatedTransaction.originalTransaction.TestDetails.findIndex(
      test => test.testDetailId === testDetailId
    );
    
    if (index === -1) return;
    
    // Create a copy of the test detail to modify
    const testCopy = {...updatedTransaction.originalTransaction.TestDetails[index]};
    const originalPrice = parseFloat(testCopy.originalPrice || testCopy.discountedPrice) || 0;
    
    // Special handling for payment fields
    if (field === 'cashAmount' || field === 'gCashAmount') {
      const fieldValue = parseFloat(value) || 0;
      testCopy[field] = fieldValue.toFixed(2);
      
      // Calculate total payment from cash and gcash
      const otherField = field === 'cashAmount' ? 'gCashAmount' : 'cashAmount';
      const otherValue = parseFloat(testCopy[otherField]) || 0;
      const totalPayment = fieldValue + otherValue;
      
      // If this is a refund, track the amount
      const refundId = testCopy.testDetailId;
      
      if (isRefundMode && selectedRefunds[refundId]) {
        // Track refund amount for this test
        setRefundAmounts(prev => ({
          ...prev,
          [refundId]: totalPayment
        }));
        
        // Update potential refund total
        const totalRefundAmount = Object.values(refundAmounts).reduce((sum, amount) => sum + amount, 0);
        setPotentialRefundAmount(totalRefundAmount);
      } else {
        // Clear any previously tracked refund
        setRefundAmounts(prev => {
          const newRefunds = {...prev};
          delete newRefunds[refundId];
          return newRefunds;
        });
      }
      
      // Update balance - deducting from the original price
      testCopy.balanceAmount = Math.max(0, originalPrice - totalPayment).toFixed(2);
    }
    else {
      // For other fields, just set the value
      testCopy[field] = value;
    }
    
    // Update the test in the array
    updatedTransaction.originalTransaction.TestDetails[index] = testCopy;
    
    // Calculate new totals
    setTimeout(() => {
      const updated = recalculateTestTotals(updatedTransaction, selectedRefunds);
      setEditedSummaryTransaction(updated);
    }, 0);
  };

  // Toggle refund mode
  const toggleRefundMode = () => {
    setIsRefundMode(!isRefundMode);
    
    // Clear selections when turning off refund mode
    if (isRefundMode) {
      setSelectedRefunds({});
      setPotentialRefundAmount(0);
    }
  };

  // Handle selection of tests for refund
  const handleRefundSelection = (testDetailId) => {
    setSelectedRefunds(prev => {
      const newSelections = {...prev};
      
      if (newSelections[testDetailId]) {
        // If already selected, deselect it
        delete newSelections[testDetailId];
      } else {
        // Otherwise select it
        newSelections[testDetailId] = true;
      }
      
      return newSelections;
    });
    
    // Recalculate test totals with the updated selections
    if (editedSummaryTransaction) {
      setTimeout(() => {
        const updated = recalculateTestTotals(editedSummaryTransaction, 
          // Use updated selections
          selectedRefunds[testDetailId] ? {...selectedRefunds, [testDetailId]: false} : {...selectedRefunds, [testDetailId]: true}
        );
        setEditedSummaryTransaction(updated);
      }, 0);
    }
  };

  // Handle cancellation confirmation
  const handleConfirmCancel = (transaction) => {
    setTransactionToCancel(transaction);
    setIsConfirmModalOpen(true);
  };

  // Confirm cancellation and call API
  const confirmCancellation = () => {
    if (!transactionToCancel) return;
    
    cancelTransactionMutation.mutate(
      transactionToCancel.originalTransaction.transactionId,
      {
        onSuccess: () => {
          setIsConfirmModalOpen(false);
          setTransactionToCancel(null);
          toast.success('Transaction cancelled successfully.');
        }
      }
    );
  };

  // Handle edit click for inline editing
  const handleEditClick = (transaction) => {
    setEditingId(transaction.id);
    setEditedTransaction({...transaction});
  };

  // Handle cancel click for inline editing
  const handleCancelInlineEdit = () => {
    setEditingId(null);
    setEditedTransaction(null);
  };

  // Handle save click for inline editing
  const handleSaveClick = () => {
    if (!editedTransaction) return;
    
    const nameParts = editedTransaction.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    const updatedTransaction = {
      ...editedTransaction.originalTransaction,
      mcNo: editedTransaction.id,
      firstName,
      lastName,
      userId: user?.userId
    };
    
    saveTransactionMutation.mutate(
      {
        transactionId: updatedTransaction.transactionId,
        ...updatedTransaction
      },
      {
        onSuccess: () => {
          setEditingId(null);
          setEditedTransaction(null);
          toast.success('Changes saved successfully.');
        }
      }
    );
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

  return (
    <div className='flex flex-col md:flex-row min-h-screen bg-gray-100'>
      <div className="md:block md:w-64 flex-shrink-0">
        <Sidebar />
      </div>
      
      {/* Main content */}
      <div className="flex-grow p-2 md:p-4">
        {/* Income section */}
        <div className="bg-white rounded-lg shadow p-3 md:p-4 mb-4">
          {/* Income header using the component */}
          <TransactionHeader
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            formattedDate={formattedDate}
            incomeDateInputRef={incomeDateInputRef}
            handleDateChange={handleDateChange}
            selectedDate={selectedDate}
            openDatePicker={openDatePicker}
            handleNewIncome={handleNewIncome}
          />
          
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
                        <TransactionTableRow
                          key={transaction.id}
                          transaction={transaction}
                          departmentsWithValues={departmentsWithValues}
                          editingId={editingId}
                          editedTransaction={editedTransaction}
                          openMenuId={openMenuId}
                          referrers={referrers}
                          handleEditClick={handleEditClick}
                          handleCancelClick={handleConfirmCancel}
                          handleSaveClick={handleSaveClick}
                          handleEditChange={(e, field) => {
                            const value = e.target.value;
                            setEditedTransaction(prev => ({
                              ...prev,
                              [field]: value
                            }));
                          }}
                          handleCancelInlineEdit={handleCancelInlineEdit}
                          toggleIncomeMenu={toggleIncomeMenu}
                          handleDropdownClick={handleDropdownClick}
                          handleViewSummary={handleViewSummary}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>          {/* Department Summary & Totals */}
          <TransactionSummarySection 
            filteredTransactions={filteredTransactions}
            totalGCash={totalGCash}
            departmentTotals={departmentTotals}
            departmentsWithValues={departmentsWithValues}
          />
        </div>

        {/* Expenses section */}
        <div className="bg-white rounded-lg shadow p-3 md:p-4">
          {/* Expense header using the component */}
          <ExpenseHeader
            formattedDate={formattedDate}
            expenseDateInputRef={expenseDateInputRef}
            handleDateChange={handleDateChange}
            selectedDate={selectedDate}
            openDatePicker={openDatePicker}
            handleNewExpenses={handleNewExpenses}
          />
          
          {/* Expense content would go here */}
          <div className="text-center py-8 bg-gray-50 rounded-md border border-gray-200">
            <p className="text-gray-500 font-medium">Expenses section is part of a separate component</p>
            <p className="text-sm text-gray-400 mt-1">This should be implemented in a separate file</p>
          </div>
        </div>
      </div>

      {/* Transaction Summary Modal using our component */}
      <TransactionSummaryModal
        isOpen={isTransactionSummaryOpen}
        transaction={selectedSummaryTransaction}
        isLoading={selectedSummaryTransaction?.isLoading}
        isEditing={isEditingSummary}
        editedTransaction={editedSummaryTransaction}
        referrers={referrers}
        mcNoExists={mcNoExists}
        isMcNoChecking={isMcNoChecking}
        isRefundMode={isRefundMode}
        selectedRefunds={selectedRefunds}
        onClose={closeTransactionSummary}
        onEdit={handleEnterEditMode}
        onSave={handleSaveEdit}
        onCancelEdit={handleCancelEdit}
        onToggleRefundMode={toggleRefundMode}
        onMcNoChange={handleMcNoChange}
        onInputChange={handleSummaryInputChange}
        onTestDetailChange={handleTestDetailChange}
        onRefundSelection={handleRefundSelection}
        isSaving={saveEditedTransactionMutation.isPending}
      />

      {/* Confirmation Modal using our component */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        title="Confirm Cancellation"
        message="Are you sure you want to cancel this transaction? This action cannot be undone."
        confirmButtonText="Yes, Cancel It"
        cancelButtonText="No, Keep It"
        onConfirm={confirmCancellation}
        onCancel={() => setIsConfirmModalOpen(false)}
        isProcessing={cancelTransactionMutation.isPending}
      />

      {/* Toast notifications */}
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
