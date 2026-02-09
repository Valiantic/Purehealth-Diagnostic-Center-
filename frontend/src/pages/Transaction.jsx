import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import { Download, CalendarRange, X } from 'lucide-react';
import useAuth from '../hooks/auth/useAuth';
import usePermissions from '../hooks/auth/usePermissions';
import useProtectedAction from '../hooks/auth/useProtectedAction';
import WebAuthModal from '../components/auth/WebAuthModal';
import AdminVerificationModal from '../components/AdminVerificationModal';
import Loading from '../components/transaction/Loading';
import { useQueryClient } from '@tanstack/react-query';
import { ToastContainer, toast } from 'react-toastify';
import { calculateRefundTotal } from '../utils/transactionUtils';
import DateSelector from '../components/transaction/DateSelector';
import IncomeTable from '../components/transaction/IncomeTable';
import ConfirmationModal from '../components/transaction/ConfirmationModal';
import TransactionSummaryModal from '../components/transaction/TransactionSummaryModal';
import DailyIncomeBreakdownModal from '../components/transaction/DailyIncomeBreakdownModal';
import { useTransactionManagement } from '../hooks/transaction/useTransactionManagement';
import { useTransactionData } from '../hooks/transaction/useTransactionData';
import { exportIncomeToExcel } from '../utils/incomeExcelExporter';
import { settingsAPI, transactionAPI, userAPI } from '../services/api';
import { useQuery } from '@tanstack/react-query';

const NewTransaction = () => {
  const { user, isAuthenticating } = useAuth();
  const { hasPermission } = usePermissions();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingRefundAmount, setPendingRefundAmount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showAdminVerifyModal, setShowAdminVerifyModal] = useState(false);
  const [pendingRefundModeToggle, setPendingRefundModeToggle] = useState(false);
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);
  const [breakdownData, setBreakdownData] = useState(null);

  // Date range state
  const [dateRange, setDateRange] = useState(null); // { startDate: Date, endDate: Date } or null
  const [showDateRangePanel, setShowDateRangePanel] = useState(false);
  const [rangeStartInput, setRangeStartInput] = useState('');
  const [rangeEndInput, setRangeEndInput] = useState('');
  const dateRangePanelRef = useRef(null);

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
  // Fetch admin user for report
  const { data: adminUser } = useQuery({
    queryKey: ['adminUser'],
    queryFn: async () => {
      try {
        const response = await userAPI.getAllUsers();
        // Handle different response structures: {users: []} or {data: []} or []. 
        const users = response.data?.users || response.data?.data || (Array.isArray(response.data) ? response.data : []);
        return users.find(u => u.role === 'admin');
      } catch (err) {
        console.error('Error fetching admin user:', err);
        return null;
      }
    },
    staleTime: Infinity
  });

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
  } = useTransactionData(selectedDate, expenseDate, discountCategories, dateRange);

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

  // Admin-verified save edit handler - admin already verified when entering refund mode
  const handleAdminVerifiedSaveEdit = useCallback(() => {
    // Admin verification happens when entering refund mode, so just save directly
    handleSaveEdit();
  }, [handleSaveEdit]);

  const handleAdminVerified = useCallback((verified, adminUser) => {
    if (verified && pendingRefundModeToggle) {
      // Admin verified - toggle refund mode
      toggleRefundMode();
      setPendingRefundModeToggle(false);
    }
    setShowAdminVerifyModal(false);
  }, [pendingRefundModeToggle, toggleRefundMode]);

  // Protected toggle refund mode - requires admin verification for everyone
  const protectedToggleRefundMode = useCallback(async () => {
    // If admin is logged in, trigger WebAuthn directly
    if (user?.role === 'admin') {
      try {
        // Step 1: Get authentication options for the admin
        const apiClient = (await import('../services/api')).default;
        const optionsResponse = await apiClient.post('/webauthn/authentication/options', {
          email: user.email
        });

        if (!optionsResponse.data.success) {
          toast.error('Failed to generate authentication options');
          return;
        }

        const { options, userId } = optionsResponse.data;

        // Step 2: Trigger WebAuthn authentication
        const { startAuthentication } = await import('@simplewebauthn/browser');
        const authResponse = await startAuthentication(options);

        // Step 3: Verify the WebAuthn response
        const verifyResponse = await apiClient.post('/webauthn/authentication/verify', {
          userId: userId,
          response: authResponse
        });

        if (!verifyResponse.data.success) {
          toast.error('Authentication failed');
          return;
        }

        // Step 4: Verify admin role
        const roleVerifyResponse = await apiClient.post('/users/verify-admin', {
          userId: userId
        });

        if (roleVerifyResponse.data.success && roleVerifyResponse.data.isAdmin) {
          // Admin verified - toggle refund mode
          toggleRefundMode();
        } else {
          toast.error('Admin privileges required');
        }
      } catch (error) {
        console.error('Admin verification error:', error);

        // Handle cancellation or timeout specifically
        if (error.name === 'NotAllowedError' || error.message.includes('timed out') || error.message.includes('not allowed')) {
          toast.error('Verification cancelled');
        } else {
          toast.error(error.message || 'Failed to verify admin credentials');
        }
      }
    } else {
      // Receptionist - show modal for admin verification
      setPendingRefundModeToggle(true);
      setShowAdminVerifyModal(true);
    }
  }, [user, toggleRefundMode]);

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
      setDateRange(null); // Clear range when single date is selected
      setPendingRefundAmount(0);
      setTimeout(() => refetchTransactionData(), 0);
    }
  };

  // Date Range helpers
  const formatDateForInput = (d) => {
    if (!d) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const applyDateRange = (start, end) => {
    if (start && end && start <= end) {
      setDateRange({ startDate: start, endDate: end });
      setExpenseDate(end); // Set expense date to end of range
      setShowDateRangePanel(false);
      setPendingRefundAmount(0);
      setCurrentPage(1);
    }
  };

  const handleApplyCustomRange = () => {
    if (rangeStartInput && rangeEndInput) {
      const start = new Date(rangeStartInput + 'T00:00:00');
      const end = new Date(rangeEndInput + 'T00:00:00');
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        applyDateRange(start, end);
      }
    }
  };

  const handlePresetRange = (preset) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let start, end;

    switch (preset) {
      case 'today':
        start = new Date(today);
        end = new Date(today);
        break;
      case 'yesterday': {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        start = yesterday;
        end = yesterday;
        break;
      }
      case 'last7':
        start = new Date(today);
        start.setDate(start.getDate() - 6);
        end = new Date(today);
        break;
      case 'last30':
        start = new Date(today);
        start.setDate(start.getDate() - 29);
        end = new Date(today);
        break;
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today);
        break;
      case 'lastMonth': {
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0); // Last day of prev month
        break;
      }
      default:
        return;
    }

    setRangeStartInput(formatDateForInput(start));
    setRangeEndInput(formatDateForInput(end));
    applyDateRange(start, end);
  };

  const clearDateRange = () => {
    setDateRange(null);
    setRangeStartInput('');
    setRangeEndInput('');
    setShowDateRangePanel(false);
    // Refetch with single date mode
    setTimeout(() => refetchTransactionData(), 0);
  };

  // Close date range panel when clicking outside
  useEffect(() => {
    if (!showDateRangePanel) return;
    const handleClickOutside = (e) => {
      if (dateRangePanelRef.current && !dateRangePanelRef.current.contains(e.target)) {
        setShowDateRangePanel(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDateRangePanel]);

  const handleNewIncome = () => navigate('/add-transaction');

  // Handle Generate Report (Open Breakdown Modal)
  const handleGenerateReport = async () => {
    try {
      // Calculate yesterday
      const yesterday = new Date(selectedDate);
      yesterday.setDate(yesterday.getDate() - 1);

      const year = yesterday.getFullYear();
      const month = String(yesterday.getMonth() + 1).padStart(2, '0');
      const day = String(yesterday.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      // Fetch yesterday's data
      const response = await transactionAPI.getAllTransactions({
        page: 1,
        limit: 5000,
        date: dateString
      });

      const yesterdayTransactions = response.data?.data?.transactions || [];

      // Calculate yesterday's department totals and test totals
      const yesterdayDepartmentTotals = {};
      const yesterdayTestTotals = {};
      let yesterdayGCashTotal = 0;

      yesterdayTransactions.forEach(txn => {
        if (txn.status !== 'cancelled' && txn.TestDetails) {
          txn.TestDetails.forEach(test => {
            if (test.status !== 'refunded') {
              const deptId = test.departmentId;
              const testName = test.testName || 'Unknown Test';
              // Amount logic: discountedPrice - balanceAmount
              const testPrice = parseFloat(test.discountedPrice) || 0;
              const balanceAmount = parseFloat(test.balanceAmount) || 0;
              const amount = testPrice - balanceAmount;

              yesterdayDepartmentTotals[deptId] = (yesterdayDepartmentTotals[deptId] || 0) + amount;
              yesterdayTestTotals[testName] = (yesterdayTestTotals[testName] || 0) + amount;

              yesterdayGCashTotal += parseFloat(test.gCashAmount || 0);
            }
          });
        }
      });

      // Calculate today's test totals
      const todayTestTotals = {};
      filteredTransactions.forEach(txn => {
        if (txn.status !== 'cancelled' && txn.originalTransaction?.TestDetails) {
          txn.originalTransaction.TestDetails.forEach(test => {
            if (test.status !== 'refunded') {
              const testName = test.testName || 'Unknown Test';
              const testPrice = parseFloat(test.discountedPrice) || 0;
              const balanceAmount = parseFloat(test.balanceAmount) || 0;
              const amount = testPrice - balanceAmount;
              todayTestTotals[testName] = (todayTestTotals[testName] || 0) + amount;
            }
          });
        }
      });

      // Build test revenues array from combined test names
      const allTestNames = [...new Set([...Object.keys(yesterdayTestTotals), ...Object.keys(todayTestTotals)])];
      const testRevenues = allTestNames.map(testName => ({
        testName,
        yesterday: yesterdayTestTotals[testName] || 0,
        today: todayTestTotals[testName] || 0
      })).sort((a, b) => a.testName.localeCompare(b.testName));

      // Prepare data for modal
      const departmentRevenues = departments
        .filter(dept => dept.status === 'active' || departmentTotals[dept.departmentId] > 0)
        .map(dept => ({
          departmentName: dept.departmentName,
          yesterday: yesterdayDepartmentTotals[dept.departmentId] || 0,
          today: departmentTotals[dept.departmentId] || 0
        }));

      // Transactions list
      const transactionsList = filteredTransactions.map(txn => {
        const deptAmounts = {};
        Object.values(txn.departmentRevenues).forEach(deptRev => {
          if (deptRev.amount > 0) {
            deptAmounts[deptRev.name] = deptRev.amount;
          }
        });

        return {
          mcNo: txn.id,
          firstName: txn.originalTransaction.firstName,
          lastName: txn.originalTransaction.lastName,
          departmentAmounts: deptAmounts,
          totalAmount: txn.grossDeposit,
          referrerName: txn.referrer
        };
      });

      setBreakdownData({
        departmentRevenues,
        testRevenues,
        transactions: transactionsList,
        additionalIncome: { yesterday: 0, today: 0 },
        gcashIncome: { yesterday: yesterdayGCashTotal, today: totalGCash }
      });

      setIsBreakdownModalOpen(true);

    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report data');
    }
  };

  useEffect(() => {
    setSearchTerm('');
    setCurrentPage(1);
  }, [selectedDate, dateRange]);

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
    handleSaveEdit: handleAdminVerifiedSaveEdit,
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
            className={`px-3 py-1 rounded text-sm md:text-base ${currentPage === i
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
          className={`px-3 py-1 rounded text-sm md:text-base ${currentPage === 1
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
            className={`px-3 py-1 rounded text-sm md:text-base ${currentPage === i
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
          className={`px-3 py-1 rounded text-sm md:text-base ${currentPage === totalPages
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
            <div className="flex items-center space-x-2 relative">
              {dateRange ? (
                /* Date Range Active Badge */
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 text-sm md:text-base">Showing data for:</span>
                  <div className="flex items-center bg-green-50 border border-green-600 rounded-md px-3 py-1.5 text-green-700 font-bold text-xs md:text-sm">
                    <CalendarRange className="h-4 w-4 mr-2 text-green-800" />
                    <span>
                      {dateRange.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' — '}
                      {dateRange.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <button
                      onClick={clearDateRange}
                      className="ml-2 text-green-600 hover:text-red-500 transition-colors"
                      title="Clear date range"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Normal single-date picker */
                <>
                  <span className="text-gray-600 text-sm md:text-base">Showing data for:</span>
                  <DateSelector
                    date={selectedDate}
                    onDateChange={handleDateChange}
                    inputRef={incomeDateInputRef}
                  />
                </>
              )}

              {/* Date Range Toggle Button */}
              <button
                onClick={() => {
                  setShowDateRangePanel(!showDateRangePanel);
                  if (!showDateRangePanel) {
                    // Pre-fill inputs from current range or today
                    setRangeStartInput(dateRange ? formatDateForInput(dateRange.startDate) : formatDateForInput(selectedDate));
                    setRangeEndInput(dateRange ? formatDateForInput(dateRange.endDate) : formatDateForInput(selectedDate));
                  }
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs md:text-sm font-semibold transition-colors border ${
                  showDateRangePanel || dateRange
                    ? 'bg-green-600 text-white border-green-600 hover:bg-green-700'
                    : 'bg-white text-green-700 border-green-600 hover:bg-green-50'
                }`}
                title="Select date range"
              >
                <CalendarRange className="h-4 w-4" />
                <span className="hidden md:inline">Date Range</span>
              </button>

              {/* Date Range Dropdown Panel */}
              {showDateRangePanel && (
                <div
                  ref={dateRangePanelRef}
                  className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 w-80"
                >
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Select Date Range</h3>

                  {/* Preset Buttons */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { label: 'Today', value: 'today' },
                      { label: 'Yesterday', value: 'yesterday' },
                      { label: 'Last 7 Days', value: 'last7' },
                      { label: 'Last 30 Days', value: 'last30' },
                      { label: 'This Month', value: 'thisMonth' },
                      { label: 'Last Month', value: 'lastMonth' },
                    ].map(preset => (
                      <button
                        key={preset.value}
                        onClick={() => handlePresetRange(preset.value)}
                        className="px-2 py-1.5 text-xs font-medium rounded-md border border-green-200 text-green-700 hover:bg-green-50 hover:border-green-400 transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Range Inputs */}
                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">Custom Range</p>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">Start</label>
                        <input
                          type="date"
                          value={rangeStartInput}
                          onChange={(e) => setRangeStartInput(e.target.value)}
                          max={formatDateForInput(new Date())}
                          className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                        />
                      </div>
                      <span className="text-gray-400 mt-5">→</span>
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">End</label>
                        <input
                          type="date"
                          value={rangeEndInput}
                          onChange={(e) => setRangeEndInput(e.target.value)}
                          max={formatDateForInput(new Date())}
                          className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleApplyCustomRange}
                      disabled={!rangeStartInput || !rangeEndInput || rangeStartInput > rangeEndInput}
                      className="w-full py-2 bg-green-600 text-white rounded-md text-sm font-bold hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Apply Range
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {/* On-hand Card */}
            <div className="bg-yellow-500 rounded-lg p-4 md:p-6 text-white shadow-md">
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

            {hasPermission('transactions.create') && (
              <button
                onClick={handleNewIncome}
                className="px-6 md:px-8 py-2 bg-green-600 text-white rounded-md text-sm md:text-base hover:bg-green-700 transition-colors w-full md:w-auto"
              >
                Add New
              </button>
            )}
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
            permissions={{
              canEdit: hasPermission('transactions.edit'),
              canCancel: hasPermission('transactions.cancel')
            }}
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
            {filteredTransactions.length > 0 && hasPermission('transactions.export') && (
              <button
                onClick={handleGenerateReport}
                className="bg-green-600 text-white px-4 md:px-6 py-2 rounded-md flex items-center text-sm md:text-base hover:bg-green-700 transition-colors"
              >
                Show Breakdown
              </button>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded text-sm md:text-base ${currentPage === 1
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
                className={`px-3 py-1 rounded text-sm md:text-base ${currentPage === totalPages
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
          permissions={{
            canEdit: hasPermission('transactions.edit'),
            canRefund: hasPermission('transactions.refund'),
            canExport: hasPermission('transactions.export')
          }}
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

      {/* Admin Verification Modal for Refunds */}
      <AdminVerificationModal
        isOpen={showAdminVerifyModal}
        onClose={() => {
          setShowAdminVerifyModal(false);
          setPendingRefundSave(null);
        }}
        onVerify={handleAdminVerified}
        currentUser={user}
        actionDescription="process refunds"
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
      <DailyIncomeBreakdownModal
        isOpen={isBreakdownModalOpen}
        onClose={() => setIsBreakdownModalOpen(false)}
        breakdownData={breakdownData}
        selectedDate={selectedDate}
        user={user}
        adminUser={adminUser}
      />
    </div>
  );
};

export default NewTransaction;
