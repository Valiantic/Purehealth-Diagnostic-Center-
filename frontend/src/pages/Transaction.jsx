import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Income from '../assets/icons/income_logo.png';
import Expense from '../assets/icons/expense_logo.png';
import { Calendar, Download, Edit, X, Check, MoreVertical, AlertCircle, Save } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionAPI, departmentAPI, referrerAPI } from '../services/api';

// Helper function to format date as DD-MMM-YYYY
const formatDate = (date) => {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
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
      return response;
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

  // Extract data from query results
  const transactions = transactionsData?.data?.transactions || [];
  const departments = Array.isArray(departmentsData)
    ? departmentsData
    : Array.isArray(departmentsData.data)
    ? departmentsData.data
    : [];
  const referrers = referrersData?.data?.data || [];

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

    // Find the referrer - simplified to show only last name
    let referrerName = 'Out Patient';
    
    if (transaction.referrerId) {
      // Normalize IDs for comparison by converting both to strings
      const transactionReferrerId = String(transaction.referrerId);
      
      // Find referrer by ID with string comparison
      const referrer = referrers.find(ref => String(ref.referrerId) === transactionReferrerId);
      
      if (referrer) {
        referrerName = referrer.lastName ? `Dr. ${referrer.lastName}` : 'Unknown';
      } else {
        // Shorter ID display for missing referrers
        // referrerName = `ID: ${transactionReferrerId.substring(0, 5)}...`;
        referrerName = 'Out Patient'; 
      }
    }

    return {
      id: transaction.mcNo,
      name: `${transaction.firstName} ${transaction.lastName}`,
      departmentRevenues,
      referrer: referrerName,
      grossDeposit: parseFloat(transaction.totalCashAmount) + parseFloat(transaction.totalGCashAmount),
      status: transaction.status,
      // Store original transaction for debugging
      originalTransaction: transaction
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
  const departmentRefunds = {};

  departments.forEach((dept) => {
    departmentTotals[dept.departmentId] = 0;
    departmentRefunds[dept.departmentId] = 0;
  });

  filteredTransactions.forEach((transaction) => {
    Object.entries(transaction.departmentRevenues).forEach(([deptId, data]) => {
      if (transaction.status !== 'cancelled') {
        departmentTotals[deptId] = (departmentTotals[deptId] || 0) + data.amount;
      } else {
        departmentRefunds[deptId] = (departmentRefunds[deptId] || 0) + data.amount;
      }
    });
  });

  // Check which departments have values in transactions
  const departmentsWithValues = departments.filter(dept => 
    departmentTotals[dept.departmentId] > 0 || dept.status === 'active'
  );

  // Calculate total gross
  const totalGross = filteredTransactions.reduce((sum, transaction) => {
    return sum + (transaction.status !== 'cancelled' ? transaction.grossDeposit : 0);
  }, 0);

  // Calculate total GCash
  const totalGCash = filteredTransactions.reduce((sum, transaction) => {
    return sum + (transaction.status !== 'cancelled' ? 
      parseFloat(transaction.originalTransaction.totalGCashAmount || 0) : 0);
  }, 0);
  
  // Calculate total refunded amount
  const totalRefund = filteredTransactions.reduce((sum, transaction) => {
    return sum + (transaction.status === 'cancelled' ? transaction.grossDeposit : 0);
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
      // You could add toast notification here
      setIsConfirmModalOpen(false);
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
    if (transactionToCancel) {
      cancelTransactionMutation.mutate(transactionToCancel.originalTransaction.transactionId);
    }
  };

  // Close modal
  const closeModal = () => {
    setIsConfirmModalOpen(false);
    setTransactionToCancel(null);
  };

  // Edit transaction state
  const [editingId, setEditingId] = useState(null);
  const [editedTransaction, setEditedTransaction] = useState(null);

  // Toggle edit mode for a transaction
  const handleEditClick = (transaction) => {
    setEditingId(transaction.id);
    setEditedTransaction({
      id: transaction.id,
      name: transaction.name,
      referrerId: transaction.originalTransaction.referrerId || '',
      // We can add more fields here if needed for editing
    });
    setOpenMenuId(null); // Close the dropdown
  };

  // Handle saving edited transaction
  const saveTransactionMutation = useMutation({
    mutationFn: (data) => {
      return transactionAPI.updateTransaction(
        data.transactionId,
        {
          mcNo: data.mcNo,
          firstName: data.firstName,
          lastName: data.lastName,
          referrerId: data.referrerId || null
        }
      );
    },
    onSuccess: () => {
      // Invalidate and refetch transactions data
      queryClient.invalidateQueries({
        queryKey: ['transactions'],
        exact: false,
        refetchType: 'all'
      });
      setEditingId(null);
      setEditedTransaction(null);
    },
    onError: (error) => {
      console.error('Failed to save transaction:', error);
      // You could add toast notification here
      setEditingId(null);
    }
  });

  // Handle saving edited transaction
  const handleSaveClick = (transaction) => {
    if (!editedTransaction) return;

    // Split the name into first and last name
    const nameParts = editedTransaction.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    saveTransactionMutation.mutate({
      transactionId: transaction.originalTransaction.transactionId,
      mcNo: editedTransaction.id,
      firstName,
      lastName,
      referrerId: editedTransaction.referrerId
    });
  };

  // Handle input change for edited transaction
  const handleEditChange = (e, field) => {
    setEditedTransaction({
      ...editedTransaction,
      [field]: e.target.value
    });
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedTransaction(null);
  };

  // Page Rendering Security
  if (isAuthenticating) {
    return null;
  }

  if (!user) {
    return null;
  }

  // Loading state
  if (isLoadingTransactions || isLoadingDepartments || isLoadingReferrers) {
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
                  <p className="text-gray-500 font-medium">No income transactions found</p>
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
                        ))
                        }
                        
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
                            : 'bg-white'
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
                          
                          {/* Department amounts - include inactive departments with values */}
                          {departmentsWithValues.map(dept => {
                              const deptData = transaction.departmentRevenues[dept.departmentId];
                              const isArchivedWithValue = dept.status !== 'active' && 
                                                        deptData && 
                                                        deptData.amount > 0;
                              
                              return (
                                <td 
                                  key={dept.departmentId} 
                                  className={`py-1 md:py-2 px-1 md:px-2 text-center border border-green-200 
                                            ${isArchivedWithValue ? 'bg-green-50' : ''}`}
                                >
                                  {transaction.status === 'cancelled' ? (
                                    '' // Don't display revenue data for cancelled transactions
                                  ) : (
                                    deptData && deptData.amount > 0 ? deptData.amount.toLocaleString(2) : ''
                                  )}
                                </td>
                              );
                            })
                          }
                          
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
                                      onClick={handleCancelEdit}
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
                        {departmentsWithValues.map(dept => (
                            <td 
                              key={dept.departmentId} 
                              className={`py-1 md:py-2 px-1 md:px-2 text-center border border-green-200 
                  ${dept.status !== 'active' ? 'bg-green-50' : ''}`}
                            >
                              <div>
                                {departmentTotals[dept.departmentId] > 0 ? 
                                  departmentTotals[dept.departmentId].toLocaleString(2) : ''}
                            </div>
                           
                            </td>
                          ))
                        }
                        
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
              <button className="bg-green-800 text-white px-4 md:px-6 py-2 rounded flex items-center mb-2 md:mb-0 text-sm md:text-base hover:bg-green-600">
                Generate Report <Download className="ml-2 h-3 w-3 md:h-4 md:w-4" />
              </button>
              
            
            </div>
            
            {/* Summary Box */}
            <div className="mt-2 md:mt-0 border border-gray-300 w-full md:w-auto">
              <table className="border-collapse w-full md:w-auto text-sm md:text-base">
                <tbody>
                  <tr>
                    <td className="bg-blue-500 text-white font-medium py-1 px-2 md:px-4 border border-gray-300 text-center">
                      GCASH
                    </td>
                    <td className="bg-gray-100 text-green-800 font-medium py-1 px-4 md:px-8 border border-gray-300 text-right">
                      {totalGCash.toLocaleString(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="bg-red-500 text-white font-medium py-1 px-2 md:px-4 border border-gray-300 text-center">
                      REFUND
                    </td>
                    <td className="bg-gray-100 text-green-800 font-medium py-1 px-4 md:px-8 border border-gray-300 text-right">
                      {totalRefund.toLocaleString(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="bg-green-800 text-white font-medium py-1 px-2 md:px-4 border border-gray-300 text-center">
                      TOTAL
                    </td>
                    <td className="bg-gray-100 text-green-800 font-medium py-1 px-4 md:px-8 border border-gray-300 text-right">
                      {totalGross.toLocaleString()}
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
              {true ? (
                <div className="text-center py-8 bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-gray-500 font-medium">No expense records found</p>
                  <p className="text-sm text-gray-400 mt-1">Track your expenses by adding new records</p>
                </div>
              ) : (
                <table className="min-w-full border-collapse text-sm md:text-base">
                  <thead>
                    <tr className="bg-green-800 text-white">
                      <th className="py-1 md:py-2 px-1 md:px-2 text-left border border-green-200">Payee</th>
                      <th className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">Purpose</th>
                      <th className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">Department</th>
                      <th className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">Amount</th>
                      <th className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Replace with actual expense data */}
                    <tr className="bg-green-100">
                      <td colSpan={3} className="py-1 md:py-2 px-1 md:px-2 font-bold border border-green-200 text-green-800">TOTAL:</td>
                      <td className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200 font-bold">0.00</td>
                      <td className="py-1 md:py-2 px-1 md:px-2 border border-green-200"></td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */
      isConfirmModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4 text-red-600">
              <AlertCircle className="mr-2" size={24} />
              <h3 className="text-lg font-semibold">Confirm Cancellation</h3>
            </div>
            
            <p className="mb-6">
              Are you sure you want to cancel the transaction for 
              <span className="font-bold"> {transactionToCancel?.name}</span>? 
              This will mark the transaction as refunded and update financial records.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button 
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                No, Keep It
              </button>
              <button 
                onClick={confirmCancellation}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                disabled={cancelTransactionMutation.isPending}
              >
                {cancelTransactionMutation.isPending ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transaction;
