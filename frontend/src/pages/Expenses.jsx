import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import { Download, Search } from 'lucide-react';
import useAuth from '../hooks/auth/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DateSelector from '../components/transaction/DateSelector';
import ExpenseTable from '../components/transaction/ExpenseTable';
import ExpenseSummaryModal from '../components/transaction/ExpenseSummaryModal';
import { expenseAPI, departmentAPI } from '../services/api';
import { exportExpenseToExcel } from '../utils/expenseExcelExporter';

const Expenses = () => {
  const { user, isAuthenticating } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [expenseSearchTerm, setExpenseSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('This Month');
  const [isExpenseSummaryOpen, setIsExpenseSummaryOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isEditingExpense, setIsEditingExpense] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const expenseDateInputRef = useRef(null);

  // Fetch expenses data
  const { data: expensesData, isLoading: expensesLoading, refetch: refetchExpenses } = useQuery({
    queryKey: ['expenses', expenseDate],
    queryFn: async () => {
      const formattedDate = expenseDate.toISOString().split('T')[0];
      const response = await expenseAPI.getExpenses({ date: formattedDate });
      return response.data;
    },
    enabled: !!expenseDate,
    onError: (error) => {
      console.error('Failed to fetch expenses:', error);
      toast.error('Failed to load expenses');
    }
  });

  // Fetch departments
  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentAPI.getAllDepartments().then(res => res.data),
    onError: (error) => console.error('Failed to fetch departments:', error),
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => expenseAPI.getAllCategories().then(res => res.data),
    onError: (error) => console.error('Failed to fetch categories:', error),
  });

  // Process data
  const expenses = expensesData ? 
    (Array.isArray(expensesData) ? expensesData : 
    (expensesData.data && Array.isArray(expensesData.data) ? expensesData.data : [])) 
    : [];

  const departments = departmentsData ? 
    (Array.isArray(departmentsData) ? departmentsData : 
    (departmentsData.data && Array.isArray(departmentsData.data) ? departmentsData.data : [])) 
    : [];

  const categories = categoriesData ? 
    (Array.isArray(categoriesData) ? categoriesData : 
    (categoriesData.data && Array.isArray(categoriesData.data) ? categoriesData.data : [])) 
    : [];

  // Filter expenses by search term
  const filteredExpenses = expenses.filter((expense) => {
    const name = `${expense.firstName || ''} ${expense.lastName || ''}`.toLowerCase();
    const department = expense.Department?.departmentName?.toLowerCase() || '';
    const searchLower = expenseSearchTerm.toLowerCase();
    
    return name.includes(searchLower) || department.includes(searchLower);
  });

  // Filter expenses by selected month period
  const getDateRange = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    switch (selectedMonth) {
      case 'This Month':
        return {
          start: new Date(currentYear, currentMonth, 1),
          end: new Date(currentYear, currentMonth + 1, 0, 23, 59, 59)
        };
      case 'Last Month':
        return {
          start: new Date(currentYear, currentMonth - 1, 1),
          end: new Date(currentYear, currentMonth, 0, 23, 59, 59)
        };
      case 'Last 3 Months':
        return {
          start: new Date(currentYear, currentMonth - 2, 1),
          end: new Date(currentYear, currentMonth + 1, 0, 23, 59, 59)
        };
      case 'This Year':
        return {
          start: new Date(currentYear, 0, 1),
          end: new Date(currentYear, 11, 31, 23, 59, 59)
        };
      default:
        return {
          start: new Date(currentYear, currentMonth, 1),
          end: new Date(currentYear, currentMonth + 1, 0, 23, 59, 59)
        };
    }
  };

  const dateRange = getDateRange();
  
  const monthFilteredExpenses = filteredExpenses.filter((expense) => {
    const expenseDate = new Date(expense.createdAt || expense.date);
    return expenseDate >= dateRange.start && expenseDate <= dateRange.end;
  });

  // Pagination logic
  const totalPages = Math.ceil(monthFilteredExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedExpenses = monthFilteredExpenses.slice(startIndex, endIndex);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Calculate total expense from month-filtered data
  const totalExpense = monthFilteredExpenses.reduce((sum, expense) => {
    return sum + (parseFloat(expense.totalAmount) || 0);
  }, 0);

  // Calculate reimbursed total
  const reimbursedTotal = monthFilteredExpenses.reduce((sum, expense) => {
    if (expense.ExpenseItems && expense.ExpenseItems.length > 0) {
      const reimbursedSum = expense.ExpenseItems
        .filter(item => item.status === 'reimbursed')
        .reduce((itemSum, item) => itemSum + (parseFloat(item.amount) || 0), 0);
      return sum + reimbursedSum;
    }
    return sum;
  }, 0);

  // Calculate reimbursed percentage
  const reimbursedPercentage = totalExpense > 0 
    ? ((reimbursedTotal / totalExpense) * 100).toFixed(1) 
    : 0;

  // Handle date change
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
    }
  };

  // Handle expense edit
  const handleEditExpense = (expense) => {
    setSelectedExpense(expense);
    setIsEditingExpense(true);
    setIsExpenseSummaryOpen(true);
  };

  // Get expense modal data
  const getExpenseModalData = () => {
    if (!selectedExpense) return {};
    
    const firstName = selectedExpense.firstName || selectedExpense.name?.split(' ')[0] || '';
    const lastName = selectedExpense.lastName || selectedExpense.name?.split(' ').slice(1).join(' ') || '';
    
    const expenses = selectedExpense.ExpenseItems && selectedExpense.ExpenseItems.length > 0 
      ? selectedExpense.ExpenseItems.map((item, index) => ({
          id: item.id || index,
          paidTo: item.paidTo || `${firstName} ${lastName}`,
          purpose: item.purpose || '',
          categoryId: item.Category?.categoryId || item.categoryId || '',
          categoryName: item.Category?.name || 'No Category',
          status: item.status || 'pending',
          amount: parseFloat(item.amount || 0)
        }))
      : [{
          id: 1,
          paidTo: `${firstName} ${lastName}`,
          purpose: selectedExpense.purpose || selectedExpense.description || '',
          categoryId: selectedExpense.Category?.categoryId || selectedExpense.categoryId || '',
          categoryName: selectedExpense.Category?.name || 'No Category',
          status: selectedExpense.status || 'pending',
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

  // Calculate expense total
  const calculateExpenseTotal = () => {
    const modalData = getExpenseModalData();
    return modalData.expenses ? modalData.expenses.reduce((total, exp) => total + exp.amount, 0) : 0;
  };

  // Close expense summary
  const closeExpenseSummary = () => {
    setIsExpenseSummaryOpen(false);
    setSelectedExpense(null);
    setIsEditingExpense(false);
  };

  // Save expense changes
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
      
      await refetchExpenses();
      
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

  // Handle Excel export
  const handleGenerateExpenseReport = async () => {
    try {
      await exportExpenseToExcel(
        monthFilteredExpenses,
        totalExpense,
        expenseDate
      );
      toast.success('Expense report exported successfully!');
    } catch (error) {
      console.error('Expense export failed:', error);
      toast.error('Failed to export expense report. Please try again.');
    }
  };

  // Handle new expense
  const handleNewExpense = () => {
    navigate('/add-expenses');
  };

  // Handle month filter change
  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Reset search and pagination when date changes
  useEffect(() => {
    setExpenseSearchTerm('');
    setCurrentPage(1);
  }, [expenseDate]);

  // Reset pagination when search term or month filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [expenseSearchTerm, selectedMonth]);

  if (isAuthenticating) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="flex-1 overflow-auto p-4 sm:p-6 pt-16 lg:pt-6 lg:ml-64">
        {/* Page Header with Month Selector */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Expenses</h1>
          
          {/* Month Selector - Top Right */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Showing data for:</span>
            <select
              value={selectedMonth}
              onChange={handleMonthChange}
              className="border border-gray-300 rounded-lg py-2 px-4 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            >
              <option value="This Month">This Month</option>
              <option value="Last Month">Last Month</option>
              <option value="Last 3 Months">Last 3 Months</option>
              <option value="This Year">This Year</option>
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Total Expenses Card */}
          <div className="bg-white rounded-lg shadow-md p-4 flex items-center">
            <div className="bg-purple-600 rounded-lg p-3 mr-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-800">
                ₱ {totalExpense.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
            </div>
          </div>

          {/* Reimbursed Card */}
          <div className="bg-white rounded-lg shadow-md p-4 flex items-center">
            <div className="bg-green-600 rounded-lg p-3 mr-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 font-medium">Reimbursed</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-gray-800">
                  ₱ {reimbursedTotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </p>
                <span className="text-sm text-green-600 font-semibold">
                  {reimbursedPercentage}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Actions Bar */}
        <div className="bg-white rounded-lg shadow-md mb-4">
          <div className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Left side - Search */}
            <div className="relative flex-1 max-w-md w-full">
              <input
                type="text"
                placeholder="Search..."
                value={expenseSearchTerm}
                onChange={(e) => setExpenseSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg py-2 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>

            {/* Right side - Add New Button */}
            <button
              onClick={handleNewExpense}
              className="bg-[#02542D] text-white px-6 py-2 rounded-lg hover:bg-green-600 font-semibold transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New
            </button>
          </div>

          {/* Table Header Info */}
          <div className="px-4 pb-4">
            <p className="text-sm text-gray-600">
              Showing {monthFilteredExpenses.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, monthFilteredExpenses.length)} of {monthFilteredExpenses.length} expenses
            </p>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="bg-white rounded-lg shadow-md">
          <ExpenseTable
            filteredExpenses={paginatedExpenses || []}
            totalExpense={totalExpense || 0}
            editingId={null}
            editedExpense={null}
            openMenuId={null}
            handlers={{
              handleEditClick: () => {},
              handleCancelClick: () => {},
              handleSaveClick: () => {},
              handleCancelInlineEdit: () => {},
              toggleExpenseMenu: null
            }}
            expenseSearchTerm={expenseSearchTerm}
            onEditExpense={handleEditExpense}
            key={`expense-table-${expenseDate.toISOString().split('T')[0]}`}
          />

          {/* Footer with Generate Report and Pagination */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <button
                onClick={handleGenerateExpenseReport}
                disabled={monthFilteredExpenses.length === 0}
                className={`${
                  monthFilteredExpenses.length === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-[#02542D] hover:bg-green-600'
                } text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2`}
              >
                <Download className="w-5 h-5" />
                Generate Report
              </button>

              {/* Pagination - only show if there are pages */}
              {totalPages > 0 && (
                <div className="flex gap-2 items-center">
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded font-semibold ${
                      currentPage === 1 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-[#02542D] text-white hover:bg-green-600'
                    }`}
                  >
                    Prev
                  </button>
                  
                  {getPageNumbers().map((page, index) => (
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-3 py-1">...</span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 rounded ${
                          currentPage === page
                            ? 'bg-[#02542D] text-white font-semibold'
                            : 'bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  ))}
                  
                  <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded font-semibold ${
                      currentPage === totalPages 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-[#02542D] text-white hover:bg-green-600'
                    }`}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
          isEditing={isEditingExpense}
          onEnterEditMode={() => setIsEditingExpense(true)}
          mode="edit"
        />
      )}
    </div>
  );
};

export default Expenses;
