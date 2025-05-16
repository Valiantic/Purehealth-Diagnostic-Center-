import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Income from '../assets/icons/income_logo.png';
import Expense from '../assets/icons/expense_logo.png';
import { Download } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { transactionAPI, departmentAPI, referrerAPI, revenueAPI } from '../services/api';
import Loading from '../components/Loading';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { calculateRefundTotal, isTestRefunded, getRefundedTestsInfo } from '../utils/transactionUtils';
import DateSelector from '../components/transaction/DateSelector';
import TransactionRow from '../components/transaction/IncomeTable';
import ConfirmationModal from '../components/transaction/ConfirmationModal';
import TransactionSummaryModal from '../components/transaction/TransactionSummaryModal';
import { useTransactionManagement } from '../hooks/useTransactionManagement';

const Transaction = () => {
  const { user, isAuthenticating } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingRefundAmount, setPendingRefundAmount] = useState(0);
  
  const idTypeOptions = [
    { value: 'Regular', label: 'Regular' },
    { value: 'Person with Disability', label: 'PWD' },
    { value: 'Senior Citizen', label: 'Senior Citizen' }
  ];
  
  const incomeDateInputRef = useRef(null);
  const expenseDateInputRef = useRef(null);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
    toggleExpenseMenu,
    handleDropdownClick,
    handleCancelClick,
    closeConfirmModal, // Use the new function
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
    mutations
  } = useTransactionManagement(user, selectedDate);


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
  
  const handleNewExpenses = () => {
    navigate('/add-expenses');
  };

  const handleNewIncome = () => {
    navigate('/add-income');
  };

  useEffect(() => {
    const handleClickOutside = () => {
      toggleIncomeMenu(null);
      toggleExpenseMenu(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setSearchTerm('');
  }, [selectedDate]);

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

  // Process transactions to organize by departments and filter by date
  const processedTransactions = transactions
    .filter((transaction) => {
      if (!transaction.createdAt) return true; // Include if no date (fallback)
      
      const transactionDate = new Date(transaction.createdAt);
      return (
        transactionDate.getDate() === selectedDate.getDate() &&
        transactionDate.getMonth() === selectedDate.getMonth() &&
        transactionDate.getFullYear() === selectedDate.getFullYear()
      );
    })
    .map((transaction) => {
      const departmentRevenues = {};
      departments.forEach((dept) => {
        departmentRevenues[dept.departmentId] = {
          name: dept.departmentName,
          amount: 0,
          isActive: dept.status === 'active',
          refundAmount: 0,
          balanceAmount: 0 
        };
      });

      // Sum up revenue for each department - exclude refunded tests
      if (transaction.TestDetails && transaction.TestDetails.length > 0) {
        transaction.TestDetails.forEach((test) => {
          const deptId = test.departmentId;
          if (!departmentRevenues[deptId]) return;
          
          if (isTestRefunded(test)) {
            departmentRevenues[deptId].refundAmount += parseFloat(test.originalPrice || test.discountedPrice) || 0;
          } else {
            const testPrice = parseFloat(test.discountedPrice) || 0;
            const balanceAmount = parseFloat(test.balanceAmount) || 0;
            
            departmentRevenues[deptId].balanceAmount += balanceAmount;
            
            departmentRevenues[deptId].amount += (testPrice - balanceAmount);
          }
        });
      }
      
      let grossDeposit = 0;
      if (transaction.TestDetails && transaction.TestDetails.length > 0) {
        grossDeposit = transaction.TestDetails
          .filter(test => test.status !== 'refunded')
          .reduce((sum, test) => {
            const testPrice = parseFloat(test.discountedPrice) || 0;
            const balanceAmount = parseFloat(test.balanceAmount) || 0;
            return sum + (testPrice - balanceAmount);
          }, 0);
      } else {
        grossDeposit = parseFloat(transaction.totalCashAmount) + parseFloat(transaction.totalGCashAmount);
      }
      
      let referrerName = 'Out Patient';
      
      if (transaction.referrerId) {
        const transactionReferrerId = String(transaction.referrerId);
        const referrer = referrers.find(ref => String(ref.referrerId) === transactionReferrerId);
        
        if (referrer) {
          referrerName = referrer.lastName ? `Dr. ${referrer.lastName}` : 'Unknown';
        } else {
          referrerName = 'Out Patient';    
        }
      }

      return {
        id: transaction.mcNo,
        name: `${transaction.firstName} ${transaction.lastName}`,
        departmentRevenues,
        referrer: referrerName,
        referrerId: transaction.referrerId,
        grossDeposit: grossDeposit,
        status: transaction.status,
        originalTransaction: transaction,
        hasRefunds: transaction.TestDetails?.some(test => isTestRefunded(test)) || false,
        refundDate: transaction.TestDetails?.find(test => isTestRefunded(test))?.updatedAt || null
      };
    });

  const filteredTransactions = processedTransactions.filter((transaction) => {
    return (
      transaction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const departmentTotals = {};
  const departmentBalanceTotals = {}; 
 
  const departmentRefundTotals = {};
  departments.forEach(dept => {
    departmentRefundTotals[dept.departmentId] = 0;
    departmentBalanceTotals[dept.departmentId] = 0; 
  });

  const refundInfo = calculateRefundTotal(filteredTransactions);
  const totalRefundAmount = refundInfo.totalRefundAmount;
  const totalRefundedTests = refundInfo.refundedTestCount;

  const totalRefundsToDisplay = totalRefundAmount + (pendingRefundAmount || 0);

  const refundDisplay = (
    <td className="bg-gray-100 text-red-600 font-medium py-1 px-4 md:px-8 border border-gray-300 text-right">
      {totalRefundsToDisplay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </td>
  );

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
            const testPrice = parseFloat(test.discountedPrice || 0);
            const balanceAmount = parseFloat(test.balanceAmount) || 0;
            departmentBalanceTotals[deptId] = (departmentBalanceTotals[deptId] || 0) + balanceAmount;
            departmentTotals[deptId] = (departmentTotals[deptId] || 0) + (testPrice - balanceAmount);
          }
        });
      } else {
        Object.entries(transaction.departmentRevenues).forEach(([deptId, data]) => {
          departmentTotals[deptId] = (departmentTotals[deptId] || 0) + data.amount;
          departmentBalanceTotals[deptId] = (departmentBalanceTotals[deptId] || 0) + (data.balanceAmount || 0);
        });
      }
    }
  });

  const departmentsWithValues = departments.filter(dept => 
    departmentTotals[dept.departmentId] > 0 || departmentRefundTotals[dept.departmentId] > 0 || dept.status === 'active'
  );

  const totalGross = Object.values(departmentTotals).reduce((sum, amount) => {
    return sum + Math.max(0, amount);
  }, 0);

  const totalGCash = filteredTransactions.reduce((sum, transaction) => {
    if (transaction.status === 'cancelled') {
      return sum; 
    }
    
    let gCashAmount = 0;
    if (transaction.originalTransaction?.TestDetails) {
      transaction.originalTransaction.TestDetails.forEach(test => {
        if (test.status !== 'refunded') {
          gCashAmount += parseFloat(test.gCashAmount) || 0;
        }
      });
      return sum + gCashAmount;
    }
    
    return sum + parseFloat(transaction.originalTransaction.totalGCashAmount || 0);
  }, 0);

  if (isAuthenticating) {
    return null;
  }

  if (!user) {
    return null;
  }

  if (isLoadingTransactions || isLoadingDepartments || isLoadingReferrers || isLoadingRefunds) {
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
    toggleRefundMode,
    handleRefundSelection
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
                <DateSelector 
                  date={selectedDate}
                  onDateChange={handleDateChange}
                  inputRef={incomeDateInputRef}
                />
                    
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
                        <TransactionRow
                          key={transaction.id}
                          transaction={transaction}
                          departmentsWithValues={departmentsWithValues}
                          editingId={editingId}
                          editedTransaction={editedTransaction}
                          openMenuId={openMenuId}
                          referrers={referrers}
                          handlers={rowHandlers}
                        />
                      ))}
                      
                      {/* Totals row */}
                      <tr className="bg-green-100">
                        <td colSpan={2} className="py-1 md:py-2 px-1 md:px-2 font-bold border border-green-200 text-green-800 sticky left-0 bg-green-100">TOTAL:</td>
                        
                        {departmentsWithValues.map(dept => {
                          const grossRevenue = departmentTotals[dept.departmentId] || 0;
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
              
              <div className="flex justify-end mt-4 px-2">
                <div className="text-sm text-gray-600">
                  Showing {filteredTransactions.length} {filteredTransactions.length === 1 ? 'patient' : 'patients'}
                </div>
              </div>
            </div>
          </div>
          
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
                    {refundDisplay}
                  </tr>
                  <tr>
                    <td className="bg-green-800 text-white font-medium py-1 px-2 md:px-4 border border-gray-300 text-center">
                      DEPOSIT
                    </td>
                    <td className="bg-gray-100 text-green-800 font-medium py-1 px-4 md:px-8 border border-gray-300 text-right">
                      {Math.max(0, totalGross - totalGCash).toLocaleString(undefined, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
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
                <DateSelector 
                  date={selectedDate}
                  onDateChange={handleDateChange}
                  inputRef={expenseDateInputRef}
                />
                    
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
      
      {/* Transaction Summary Modal - Use our extracted component */}
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
          mcNoExists={mcNoExists}
          isMcNoChecking={isMcNoChecking}
          mutations={mutations}
          handlers={summaryHandlers}
        />
      )}

      {/* Confirmation Modal - Use our extracted component */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={closeConfirmModal} 
        onConfirm={confirmCancellation}
        isPending={mutations?.cancelTransaction?.isPending}
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

export default Transaction;
