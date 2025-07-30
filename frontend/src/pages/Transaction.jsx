import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import Income from '../assets/icons/income_logo.png';
import Expense from '../assets/icons/expense_logo.png';
import { Download } from 'lucide-react';
import useAuth from '../hooks/auth/useAuth';
import Loading from '../components/transaction/Loading';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { ToastContainer, toast } from 'react-toastify'; // Added toast import
import { calculateRefundTotal } from '../utils/transactionUtils';
import DateSelector from '../components/transaction/DateSelector';
import IncomeTable from '../components/transaction/IncomeTable';
import ExpenseTable from '../components/transaction/ExpenseTable';
import ConfirmationModal from '../components/transaction/ConfirmationModal';
import TransactionSummaryModal from '../components/transaction/TransactionSummaryModal';
import ExpenseSummaryModal from '../components/transaction/ExpenseSummaryModal';
import { useTransactionManagement } from '../hooks/transaction/useTransactionManagement';
import { useTransactionData } from '../hooks/transaction/useTransactionData';
import { expenseAPI } from '../services/api';

const Transaction = () => {
  const { user, isAuthenticating } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expenseDate, setExpenseDate] = useState(new Date()); 
  const [searchTerm, setSearchTerm] = useState('');
  const [expenseSearchTerm, setExpenseSearchTerm] = useState('');
  const [pendingRefundAmount, setPendingRefundAmount] = useState(0);
  const [isExpenseSummaryOpen, setIsExpenseSummaryOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isEditingExpense, setIsEditingExpense] = useState(false);
  
  const idTypeOptions = [
    { value: 'Regular', label: 'Regular' },
    { value: 'Person with Disability', label: 'PWD' },
    { value: 'Senior Citizen', label: 'Senior Citizen' }
  ];
  
  const incomeDateInputRef = useRef(null);
  const expenseDateInputRef = useRef(null);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Use our new custom hook to handle data fetching and processing
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

  // Fetch categories for the expense modal
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => expenseAPI.getAllCategories().then(res => res.data),
    onError: (error) => console.error('Failed to fetch categories:', error),
  });

  // Process categories data consistently
  const categories = categoriesData ? 
    (Array.isArray(categoriesData) ? categoriesData : 
    (categoriesData.data && Array.isArray(categoriesData.data) ? categoriesData.data : [])) 
    : [];

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
    mutations
  } = useTransactionManagement(user, selectedDate);

  // Process and filter transactions
  const processedTransactions = processTransactions(transactions, departments, referrers);
  const filteredTransactions = processedTransactions.filter((transaction) => {
    return (
      transaction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Calculate department totals
  const departmentTotalsData = calculateDepartmentTotals(filteredTransactions);
  const departmentsWithValues = getDepartmentsWithValues();
  const { totalGross, totalGCash } = calculateTotalValues(filteredTransactions);

  // Filter expenses by search term
  const filteredExpenses = filterExpenses(expenses, expenseSearchTerm);
  const totalExpense = calculateTotalExpense(filteredExpenses);

  // Calculate refund total
  const refundInfo = calculateRefundTotal(filteredTransactions);
  const totalRefundAmount = refundInfo.totalRefundAmount;
  const totalRefundedTests = refundInfo.refundedTestCount;
  const totalRefundsToDisplay = totalRefundAmount + (pendingRefundAmount || 0);

  const handleDateChange = (e) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      setSelectedDate(newDate);
      setPendingRefundAmount(0);
      setTimeout(() => refetchTransactionData(), 0);
    }
  };

  const handleExpenseDateChange = (e) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      const normalizedDate = new Date(
        newDate.getFullYear(),
        newDate.getMonth(),
        newDate.getDate()
      );
      
      setExpenseDate(normalizedDate);
      setExpenseSearchTerm(''); 
      refetchExpenseData(normalizedDate);
    }
  };
  
  const handleNewExpenses = () => navigate('/add-expenses');
  const handleNewIncome = () => navigate('/add-transaction');

  const [localExpenseMenuId, setLocalExpenseMenuId] = useState(null);

  const toggleExpenseMenuFixed = (id) => {
    
    if (localExpenseMenuId === id) {
      setLocalExpenseMenuId(null);
    } else {
      setLocalExpenseMenuId(id);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only run this if a menu is open
      if (localExpenseMenuId && !event.target.closest('.menu-dropdown') && !event.target.closest('.menu-button')) {
        setLocalExpenseMenuId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [localExpenseMenuId]);

  useEffect(() => {
    setSearchTerm('');
  }, [selectedDate]);

  const handleEditExpense = (expense) => {
    setSelectedExpense(expense);
    setIsEditingExpense(true);
    setIsExpenseSummaryOpen(true);
  };
  
  const getExpenseModalData = () => {
    if (!selectedExpense) return {};
    
    const firstName = selectedExpense.firstName || selectedExpense.name?.split(' ')[0] || '';
    const lastName = selectedExpense.lastName || selectedExpense.name?.split(' ').slice(1).join(' ') || '';
    
    const expenses = selectedExpense.ExpenseItems && selectedExpense.ExpenseItems.length > 0 
      ? selectedExpense.ExpenseItems.map((item, index) => ({
          id: item.id || index,
          paidTo: item.paidTo || firstName + ' ' + lastName,
          purpose: item.purpose || '',
          categoryId: item.Category?.categoryId || item.categoryId || '',
          categoryName: item.Category?.name || 'No Category',
          amount: parseFloat(item.amount || 0)
        }))
      : [{
          id: 1,
          paidTo: firstName + ' ' + lastName,
          purpose: selectedExpense.purpose || selectedExpense.description || '',
          categoryId: selectedExpense.Category?.categoryId || selectedExpense.categoryId || '',
          categoryName: selectedExpense.Category?.name || 'No Category', 
          amount: parseFloat(selectedExpense.amount || 0)
        }];
    
    return {
      firstName,
      lastName,
      selectedDepartment: selectedExpense.departmentId || '',
      selectedDate: expenseDate.toISOString().split('T')[0],
      expenses
    };
  };
  
  const calculateExpenseTotal = () => {
    const modalData = getExpenseModalData();
    return modalData.expenses ? modalData.expenses.reduce((total, exp) => total + exp.amount, 0) : 0;
  };
  
  const closeExpenseSummary = () => {
    setIsExpenseSummaryOpen(false);
    setSelectedExpense(null);
    setIsEditingExpense(false);
  };

  const handleSaveExpenseChanges = async (updatedData) => {
    try {
      const totalAmount = updatedData.expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
      
      const expenseUpdateData = {
        firstName: updatedData.firstName,
        lastName: updatedData.lastName,
        departmentId: parseInt(updatedData.selectedDepartment),
        date: updatedData.selectedDate || expenseDate.toISOString().split('T')[0],
        totalAmount: totalAmount,
        ExpenseItems: updatedData.expenses.map(exp => ({
          id: exp.id,
          paidTo: exp.paidTo,
          purpose: exp.purpose,
          categoryId: parseInt(exp.categoryId) || null,
          amount: parseFloat(exp.amount),
          status: exp.status || 'pending'
        })),
        userId: user.userId
      };

      const expenseId = selectedExpense?.expenseId || selectedExpense?.id;
      if (!expenseId) {
        throw new Error('No expense ID found for updating');
      }

      await expenseAPI.updateExpense(expenseId, expenseUpdateData);
      
      await refetchExpenseData(expenseDate);
      
      queryClient.invalidateQueries({ 
        queryKey: ['expenses', expenseDate] 
      });
      
      toast.success('Expense updated successfully');
      closeExpenseSummary();
    } catch (error) {
      console.error('Failed to update expense:', error);
      toast.error(`Failed to update expense: ${error.message || 'Unknown error'}`);
    }
  };

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

  const expenseHandlers = {
    handleEditClick,
    handleCancelClick,
    handleEditChange,
    handleSaveClick,
    handleCancelInlineEdit,
    toggleExpenseMenu: toggleExpenseMenuFixed, 
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

  const refundDisplay = (
    <td className="bg-gray-100 text-red-600 font-medium py-1 px-4 md:px-8 border border-gray-300 text-right">
      {totalRefundsToDisplay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </td>
  );
  
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
          
          {/* Income Table */}
          <IncomeTable
            filteredTransactions={filteredTransactions}
            departmentsWithValues={departmentsWithValues}
            departmentTotals={departmentTotals}
            totalGross={totalGross}
            editingId={editingId}
            editedTransaction={editedTransaction}
            openMenuId={openMenuId}
            referrers={referrers}
            handlers={rowHandlers}
          />
          
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
                  value={expenseSearchTerm}
                  onChange={(e) => setExpenseSearchTerm(e.target.value)}
                  className="border-2 border-green-800 focus:border-green-800 focus:outline-none rounded-lg px-2 py-1 md:px-4 md:py-2 w-full text-sm md:text-base"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" className="md:w-4 md:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
              </div>
              
              <div className="flex space-x-2 w-full md:w-auto justify-between md:justify-start">
                <DateSelector 
                  date={expenseDate}
                  onDateChange={handleExpenseDateChange}
                  inputRef={expenseDateInputRef}
                />
                    
                <button onClick={handleNewExpenses} className="px-3 md:px-8 py-1 md:py-2 bg-green-800 text-white rounded-md text-sm md:text-base flex-1 md:flex-none md:w-32 hover:bg-green-600">
                  New
                </button>
              </div>
            </div>
          </div>
          
          {/* Expenses table section */}
          <ExpenseTable
            filteredExpenses={filteredExpenses || []}
            totalExpense={totalExpense || 0}
            editingId={editingId}
            editedExpense={editedTransaction}
            openMenuId={null}
            handlers={{
              handleEditClick,
              handleCancelClick,
              handleSaveClick,
              handleCancelInlineEdit,
              toggleExpenseMenu: null
            }}
            expenseSearchTerm={expenseSearchTerm}
            onEditExpense={handleEditExpense}
            key={`expense-table-${expenseDate.toISOString().split('T')[0]}`} 
          />
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

      {/* Expense Summary Modal */}
      {isExpenseSummaryOpen && selectedExpense && (
        <ExpenseSummaryModal
          isOpen={isExpenseSummaryOpen}
          onClose={closeExpenseSummary}
          firstName={getExpenseModalData().firstName}
          lastName={getExpenseModalData().lastName}
          selectedDepartment={getExpenseModalData().selectedDepartment}
          selectedDate={getExpenseModalData().selectedDate}
          departments={departments}
          categories={categories}
          expenses={getExpenseModalData().expenses}
          calculateTotal={calculateExpenseTotal}
          onSave={handleSaveExpenseChanges}
          isLoading={false}
          isEditing={false}
          onEnterEditMode={() => setIsEditingExpense(true)}
          mode="edit"
        />
      )}

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
