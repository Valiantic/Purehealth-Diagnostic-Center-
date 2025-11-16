import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import { Download } from 'lucide-react';
import useAuth from '../hooks/auth/useAuth';
import useProtectedAction from '../hooks/auth/useProtectedAction';
import WebAuthModal from '../components/auth/WebAuthModal';
import Loading from '../components/transaction/Loading';
import { useQueryClient } from '@tanstack/react-query';
import { ToastContainer, toast } from 'react-toastify';
import { calculateRefundTotal } from '../utils/transactionUtils';
import DateSelector from '../components/transaction/DateSelector';
import IncomeTable from '../components/transaction/IncomeTable';
import ConfirmationModal from '../components/transaction/ConfirmationModal';
import TransactionSummaryModal from '../components/transaction/TransactionSummaryModal';
import { useTransactionManagement } from '../hooks/transaction/useTransactionManagement';
import { useTransactionData } from '../hooks/transaction/useTransactionData';
import { exportIncomeToExcel } from '../utils/incomeExcelExporter';
import { settingsAPI } from '../services/api';
import { useQuery } from '@tanstack/react-query';

const NewTransaction = () => {
  const { user, isAuthenticating } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expenseDate, setExpenseDate] = useState(new Date()); 
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingRefundAmount, setPendingRefundAmount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // WebAuthn protected actions hook
  const {
    executeProtectedAction,
    isModalOpen,
    isAuthenticating: isWebAuthnAuthenticating,
    error: webAuthnError,
    pendingAction,
    executeAuthentication,
    cancelAuthentication,
    clearError
  } = useProtectedAction();
  
  // Fetch discount categories
  const {
    data: discountCategoriesData
  } = useQuery({
    queryKey: ['discountCategories'],
    queryFn: async () => {
      const response = await settingsAPI.getAllDiscountCategories();
      return response;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Get active discount categories
  const discountCategories = discountCategoriesData?.data?.categories?.filter(cat => cat.status === 'active') || [];
  
  // Build idTypeOptions dynamically
  const idTypeOptions = [
    { value: 'Regular', label: 'Regular' },
    ...(discountCategories.map(cat => ({ value: cat.categoryName, label: cat.categoryName })))
  ];
  
  const incomeDateInputRef = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Use our custom hook to handle data fetching and processing
  const {
    transactions,
    departments,
    referrers,
    expenses,
    isLoading,
    isTransactionsError,
    transactionsError,
    isExpensesError,
    expensesError,
    processTransactions,
    calculateDepartmentTotals,
    getDepartmentsWithValues,
    calculateTotalValues,
    filterExpenses,
    calculateTotalExpense,
    refetchTransactionData,
    refetchExpenseData,
    departmentTotals,
    departmentBalanceTotals,
    departmentRefundTotals
  } = useTransactionData(selectedDate, expenseDate);

  // Use the existing transaction management hook
  const {
    openMenuId,
    isConfirmModalOpen,
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
    toggleIncomeMenu,
    handleDropdownClick,
    handleCancelClick,
    closeConfirmModal, 
    confirmCancellation,
    handleEditChange,
    handleCancelInlineEdit,
    handleEditClick,
    closeTransactionSummary,
    handleEnterEditMode,
    handleCancelEdit,
    handleSummaryInputChange,
    handleMcNoChange,
    handleRefundSelection,
    handleSaveEdit,
    toggleRefundMode,
    handleTestDetailChange,
    handleSaveClick,
    clearRefundAmounts,
    mutations,
    refundAmounts
  } = useTransactionManagement(user, selectedDate, departments, referrers, discountCategories);

  // Protected refund mode handler
  const protectedToggleRefundMode = useCallback(async () => {
    const protectedAction = () => {
      toggleRefundMode();
    };
    
    const executeAction = executeProtectedAction(protectedAction, {
      message: 'Please authenticate to access refund mode'
    });
    
    await executeAction();
  }, [toggleRefundMode, executeProtectedAction]);

  // Process and filter transactions
  const processedTransactions = processTransactions(transactions, departments, referrers);
  const filteredTransactions = processedTransactions.filter((transaction) => {
    return (
      transaction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Calculate department totals with filtered transactions
  const calculatedTotals = calculateDepartmentTotals(filteredTransactions);
  const departmentsWithValues = getDepartmentsWithValues();
  const { totalGross, totalGCash } = calculateTotalValues(filteredTransactions);

  // Calculate refund total
  const refundInfo = calculateRefundTotal(filteredTransactions);
  const totalRefundAmount = refundInfo.totalRefundAmount;
  const exceededRefunds = Object.values(refundAmounts || {}).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const totalRefundsToDisplay = totalRefundAmount + exceededRefunds + (pendingRefundAmount || 0);

  // Calculate deposit (On-hand cash)
  const depositAmount = Math.max(0, totalGross - totalRefundsToDisplay - totalGCash);

  // Calculate total amount
  const totalAmount = totalGross;

  const handleDateChange = (e) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      setSelectedDate(newDate);
      setPendingRefundAmount(0);
      setTimeout(() => refetchTransactionData(), 0);
    }
  };

  const handleNewIncome = () => navigate('/add-transaction');

  // Handle Excel export
  const handleGenerateReport = async () => {
    try {
      await exportIncomeToExcel(
        filteredTransactions,
        departmentsWithValues,
        calculatedTotals.departmentTotals,
        totalGross,
        totalGCash,
        totalRefundsToDisplay,
        selectedDate
      );
      toast.success('Income report exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export income report. Please try again.');
    }
  };

  useEffect(() => {
    setSearchTerm('');
    setCurrentPage(1);
  }, [selectedDate]);

  // Close menu when clicking outside
  useEffect(() => {
    if (openMenuId === null) return;

    const handleClickOutside = (event) => {
      // Close menu if clicking outside
      toggleIncomeMenu(openMenuId);
    };

    // Small delay to prevent immediate closing when menu opens
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openMenuId]);

  if (isAuthenticating) {
    return null;
  }

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className='flex flex-col md:flex-row min-h-screen bg-gray-100'>
        <div className="md:block md:w-64 flex-shrink-0">
          <Sidebar />
        </div>
        <div className="flex-grow p-4 flex items-center justify-center">
          <Loading message="Loading data hang in there..." height={200} />
        </div>
      </div>
    );
  }

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

  if (isExpensesError) {
    return (
      <div className='flex flex-col md:flex-row min-h-screen bg-gray-100'>
        <div className="md:block md:w-64 flex-shrink-0">
          <Sidebar />
        </div>
        <div className="flex-grow p-4 flex items-center justify-center">
          <div className="text-red-500 font-semibold text-lg">
            Error loading expenses: {expensesError?.message || 'Unknown error'}
          </div>
        </div>
      </div>
    );
  }

  const rowHandlers = {
    handleEditClick,
    handleCancelClick,
    handleEditChange,
    handleSaveClick,
    handleCancelInlineEdit,
    toggleIncomeMenu,
    handleDropdownClick
  };

  const summaryHandlers = {
    handleSummaryInputChange,
    handleMcNoChange,
    handleTestDetailChange,
    handleSaveEdit,
    handleCancelEdit,
    handleEnterEditMode,
    toggleRefundMode: protectedToggleRefundMode,
    handleRefundSelection,
    clearRefundAmounts,
    refundAmounts
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is less than or equal to maxVisiblePages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(
          <button
            key={i}
            onClick={() => handlePageChange(i)}
            className={`px-3 py-1 rounded text-sm md:text-base ${
              currentPage === i
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {i}
          </button>
        );
      }
    } else {
      // Show first page
      pageNumbers.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className={`px-3 py-1 rounded text-sm md:text-base ${
            currentPage === 1
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          1
        </button>
      );

      // Show dots if current page is far from start
      if (currentPage > 3) {
        pageNumbers.push(
          <span key="dots-start" className="text-gray-500">...</span>
        );
      }

      // Show pages around current page
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(
          <button
            key={i}
            onClick={() => handlePageChange(i)}
            className={`px-3 py-1 rounded text-sm md:text-base ${
              currentPage === i
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {i}
          </button>
        );
      }

      // Show dots if current page is far from end
      if (currentPage < totalPages - 2) {
        pageNumbers.push(
          <span key="dots-end" className="text-gray-500">...</span>
        );
      }

      // Show last page
      pageNumbers.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className={`px-3 py-1 rounded text-sm md:text-base ${
            currentPage === totalPages
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {totalPages}
        </button>
      );
    }

    return pageNumbers;
  };

  return (
    <div className='flex flex-col md:flex-row min-h-screen bg-gray-100'>
      <div className="md:block md:w-64 flex-shrink-0">
        <Sidebar />
      </div>
      
      {/* Main content */}
      <div className="flex-grow p-2 md:p-4">
        {/* Header with title and date */}
        <div className="bg-white rounded-lg shadow p-3 md:p-6 mb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3 md:mb-0">Transactions</h1>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600 text-sm md:text-base">Showing data for:</span>
              <DateSelector 
                date={selectedDate}
                onDateChange={handleDateChange}
                inputRef={incomeDateInputRef}
              />
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {/* On-hand Card */}
            <div className="bg-purple-600 rounded-lg p-4 md:p-6 text-white shadow-md">
              <div className="flex items-center justify-between mb-2">
                <div className="bg-white bg-opacity-20 rounded-full p-2">
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-xs md:text-sm opacity-90 mb-1">On-hand</div>
              <div className="text-xl md:text-2xl font-bold">₱ {depositAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>

            {/* GCash Card */}
            <div className="bg-blue-500 rounded-lg p-4 md:p-6 text-white shadow-md">
              <div className="flex items-center justify-between mb-2">
                <div className="bg-white bg-opacity-20 rounded-full p-2">
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
              </div>
              <div className="text-xs md:text-sm opacity-90 mb-1">GCash</div>
              <div className="text-xl md:text-2xl font-bold">₱ {totalGCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>

            {/* Refund Card */}
            <div className="bg-orange-500 rounded-lg p-4 md:p-6 text-white shadow-md">
              <div className="flex items-center justify-between mb-2">
                <div className="bg-white bg-opacity-20 rounded-full p-2">
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                  </svg>
                </div>
              </div>
              <div className="text-xs md:text-sm opacity-90 mb-1">Refund</div>
              <div className="text-xl md:text-2xl font-bold">₱ {totalRefundsToDisplay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>

            {/* Total Card */}
            <div className="bg-green-600 rounded-lg p-4 md:p-6 text-white shadow-md">
              <div className="flex items-center justify-between mb-2">
                <div className="bg-white bg-opacity-20 rounded-full p-2">
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-xs md:text-sm opacity-90 mb-1">Total</div>
              <div className="text-xl md:text-2xl font-bold">₱ {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>
        </div>

        {/* Transactions Table Section */}
        <div className="bg-white rounded-lg shadow p-3 md:p-4">
          {/* Search and Add Button */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-3 md:mb-4">
            <div className="relative w-full md:w-96 mb-3 md:mb-0">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-2 border-gray-300 focus:border-green-600 focus:outline-none rounded-lg px-4 py-2 w-full text-sm md:text-base pr-10"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
            </div>
            
            <button 
              onClick={handleNewIncome} 
              className="px-6 md:px-8 py-2 bg-green-600 text-white rounded-md text-sm md:text-base hover:bg-green-700 transition-colors w-full md:w-auto"
            >
              Add New
            </button>
          </div>
          
          {/* Income Table */}
          <IncomeTable
            filteredTransactions={currentTransactions}
            departmentsWithValues={departmentsWithValues}
            departmentTotals={calculatedTotals.departmentTotals}
            totalGross={totalGross}
            editingId={editingId}
            editedTransaction={editedTransaction}
            openMenuId={openMenuId}
            referrers={referrers}
            handlers={rowHandlers}
          />
          
          {/* Generate Report Button */}
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {filteredTransactions.length > 0 ? (
                <>Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredTransactions.length)} of {filteredTransactions.length} transactions</>
              ) : (
                <>No transactions found</>
              )}
            </div>
            {filteredTransactions.length > 0 && (
              <button 
                onClick={handleGenerateReport}
                className="bg-green-600 text-white px-4 md:px-6 py-2 rounded-md flex items-center text-sm md:text-base hover:bg-green-700 transition-colors"
              >
                <Download className="mr-2 h-4 w-4" />
                Generate Report
              </button>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-4">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded text-sm md:text-base ${
                  currentPage === 1
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                Prev
              </button>
              
              {renderPageNumbers()}
              
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded text-sm md:text-base ${
                  currentPage === totalPages
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Transaction Summary Modal */}
      {isTransactionSummaryOpen && selectedSummaryTransaction && (
        <TransactionSummaryModal
          isOpen={isTransactionSummaryOpen}
          onClose={closeTransactionSummary}
          transaction={selectedSummaryTransaction}
          isEditingSummary={isEditingSummary}
          editedTransaction={editedSummaryTransaction}
          isLoading={selectedSummaryTransaction.isLoading}
          isRefundMode={isRefundMode}
          selectedRefunds={selectedRefunds}
          referrers={referrers}
          idTypeOptions={idTypeOptions}
          discountCategories={discountCategories}
          mcNoExists={mcNoExists}
          isMcNoChecking={isMcNoChecking}
          mutations={mutations}
          handlers={summaryHandlers}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={closeConfirmModal} 
        onConfirm={confirmCancellation}
        isPending={mutations?.cancelTransaction?.isPending}
      />

      {/* WebAuthn Authentication Modal */}
      <WebAuthModal
        isOpen={isModalOpen}
        isAuthenticating={isWebAuthnAuthenticating}
        error={webAuthnError}
        message={pendingAction?.message}
        onAuthenticate={executeAuthentication}
        onCancel={cancelAuthentication}
        onClearError={clearError}
      />

      {/* ToastContainer for notifications */}
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

export default NewTransaction;
