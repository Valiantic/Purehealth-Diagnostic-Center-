import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Income from '../assets/icons/income_logo.png';
import Expense from '../assets/icons/expense_logo.png';
import { Calendar, Download, Edit, X, Check, MoreVertical, ReceiptText } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
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
  const [date, setDate] = useState(formatDate(new Date()));
  const [openMenuId, setOpenMenuId] = useState(null);
  const [openExpenseMenuId, setOpenExpenseMenuId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const navigate = useNavigate();

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
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await transactionAPI.getAllTransactions({
        page: 1,
        limit: 50,
        status: 'active',
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

  // Process transactions to organize by departments
  const processedTransactions = transactions.map((transaction) => {
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

    // Find the referrer - improved matching logic
    let referrerName = 'N/A';
    
    if (transaction.referrerId) {
      // Normalize IDs for comparison by converting both to strings
      const transactionReferrerId = String(transaction.referrerId);
      
      // Find referrer by ID with string comparison
      const referrer = referrers.find(ref => String(ref.referrerId) === transactionReferrerId);
      
      // Debug referrer match
      console.log(`Matching referrer for transaction ${transaction.transactionId}:`, {
        transactionReferrerId,
        availableReferrerIds: referrers.map(r => String(r.referrerId)),
        referrerFound: !!referrer,
        matchedReferrer: referrer
      });
      
      if (referrer) {
        referrerName = `Dr. ${referrer.lastName || ''} ${referrer.firstName || ''}`.trim();
      } else {
        // Handle missing referrer case
        referrerName = `ID: ${transactionReferrerId.substring(0, 8)}...`;
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

  // Calculate department totals
  const departmentTotals = {};
  departments.forEach((dept) => {
    departmentTotals[dept.departmentId] = 0;
  });

  filteredTransactions.forEach((transaction) => {
    if (transaction.status !== 'cancelled') {
      Object.entries(transaction.departmentRevenues).forEach(([deptId, data]) => {
        departmentTotals[deptId] = (departmentTotals[deptId] || 0) + data.amount;
      });
    }
  });

  // Calculate total gross
  const totalGross = filteredTransactions.reduce((sum, transaction) => {
    return sum + (transaction.status !== 'cancelled' ? transaction.grossDeposit : 0);
  }, 0);

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
              
              <div className="flex space-x-2 w-full md:w-auto justify-between md:justify-start">
                <div className="flex items-center border border-green-800 rounded-md bg-green-50 font-bold text-green-700 text-xs md:text-sm flex-1 md:flex-none">
                  <input
                    type="text"
                    value={date}
                    className="px-1 md:px-2 py-1 outline-none bg-green-50 w-24 md:w-auto"
                    readOnly
                  />
                  <Calendar className="mx-1 h-4 w-4 md:h-5 md:w-5 text-green-800" />
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
              <table className="min-w-full border-collapse text-sm md:text-base">
                <thead>
                  <tr className="bg-green-800 text-white">
                    <th className="py-1 md:py-2 px-1 md:px-2 text-left border border-green-200 sticky left-0 bg-green-800 z-10">MC#</th>
                    <th className="py-1 md:py-2 px-1 md:px-2 text-left border border-green-200">Patient Name</th>
                    
                    {/* Department columns - only show active departments */}
                    {departments
                      .filter(dept => dept.status === 'active')
                      .map(dept => (
                        <th 
                          key={dept.departmentId} 
                          className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200"
                        >
                          {dept.departmentName}
                        </th>
                      ))
                    }
                    
                    <th className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">Gross</th>
                    <th className="py-1 md:py-2 px-1 md:px-2 text-left border border-green-200">Referrer</th>
                    <th className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr 
                      key={transaction.id} 
                      className={transaction.status === 'cancelled' ? 'bg-gray-100' : 'bg-white'}
                    >
                      <td className="py-1 md:py-2 px-1 md:px-2 border border-green-200 sticky left-0 bg-inherit">
                        {transaction.id}
                      </td>
                      <td className="py-1 md:py-2 px-1 md:px-2 border border-green-200">
                        {transaction.name}
                      </td>
                      
                      {/* Department amounts */}
                      {departments
                        .filter(dept => dept.status === 'active')
                        .map(dept => {
                          const deptData = transaction.departmentRevenues[dept.departmentId];
                          return (
                            <td 
                              key={dept.departmentId} 
                              className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200"
                            >
                              {transaction.status === 'cancelled' ? (
                                <span className="text-green-700 font-medium text-xs md:text-sm">
                                  {dept.departmentName === 'XRAY' ? 'Canceled' : ''}
                                </span>
                              ) : (
                                deptData && deptData.amount > 0 ? deptData.amount.toFixed(2) : ''
                              )}
                            </td>
                          );
                        })
                      }
                      
                      <td className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">
                        {transaction.grossDeposit.toFixed(2)}
                      </td>
                      <td className="py-1 md:py-2 px-1 md:px-2 border border-green-200 max-w-[100px] truncate">
                        {/* Show debug info on hover for referrer field */}
                        <div 
                          title={`Referrer ID: ${transaction.originalTransaction?.referrerId || 'None'}`} 
                          className="truncate"
                        >
                          {transaction.status === 'cancelled' ? '' : transaction.referrer}
                        </div>
                      </td>
                      <td className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">
                        {transaction.status !== 'cancelled' && (
                          <div className="relative flex justify-center">
                            <button 
                              className="text-gray-600 hover:text-green-600 focus:outline-none"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleIncomeMenu(transaction.id);
                              }}
                            >
                              <MoreVertical size={16} className="md:w-5 md:h-5" />
                            </button>
                            
                            {openMenuId === transaction.id && (
                              <div 
                                className="absolute right-0 top-full mt-1 w-24 bg-white shadow-lg rounded-md border border-gray-200 z-20"
                                onClick={handleDropdownClick}
                              >
                                <button className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-gray-600">
                                  <ReceiptText size={14} className="mr-2" />
                                 Details
                                </button>
                                <button className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-blue-600">
                                  <Edit size={14} className="mr-2" />
                                  Edit
                                </button>
                                <button className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-red-600">
                                  <X size={14} className="mr-2" />
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  
                  {/* Totals row */}
                  <tr className="bg-green-100">
                    <td colSpan={2} className="py-1 md:py-2 px-1 md:px-2 font-bold border border-green-200 text-green-800 sticky left-0 bg-green-100">TOTAL:</td>
                    
                    {/* Department totals */}
                    {departments
                      .filter(dept => dept.status === 'active')
                      .map(dept => (
                        <td 
                          key={dept.departmentId} 
                          className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200"
                        >
                          {departmentTotals[dept.departmentId] > 0 ? 
                            departmentTotals[dept.departmentId].toFixed(2) : ''}
                        </td>
                      ))
                    }
                    
                    <td className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">
                      {totalGross.toFixed(2)}
                    </td>
                    <td className="py-1 md:py-2 px-1 md:px-2 border border-green-200"></td>
                    <td className="py-1 md:py-2 px-1 md:px-2 border border-green-200"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Legend */}
          <div className="mt-2 flex flex-col md:flex-row justify-between p-2">
            <div className="flex flex-wrap items-center mb-4 md:mb-0">
              <button className="bg-green-800 text-white px-4 md:px-6 py-2 rounded flex items-center mb-2 md:mb-0 text-sm md:text-base hover:bg-green-600">
                Generate Report <Download className="ml-2 h-3 w-3 md:h-4 md:w-4" />
              </button>
              
              <div className="ml-0 md:ml-4 flex flex-wrap items-center font-bold text-green-800 text-xs md:text-base">
                <span className="mr-1">Legend:</span>
                <div className="flex items-center mr-2">
                  <span className="mr-1">Downpayment</span>
                  <span className="h-3 w-3 md:h-4 md:w-4 rounded-full border-2 md:border-4 border-yellow-500 inline-block"></span>
                </div>
                
                <div className="flex items-center mr-2">
                  <span className="mr-1">Refunded</span>
                  <span className="h-3 w-3 md:h-4 md:w-4 rounded-full border-2 md:border-4 border-red-500 inline-block"></span>
                </div>
                
                <div className="flex items-center">
                  <span className="mr-1">GCash</span>
                  <span className="h-3 w-3 md:h-4 md:w-4 rounded-full border-2 md:border-4 border-blue-500 inline-block"></span>
                </div>
              </div>
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
                      {/* Replace with actual GCASH total */}
                      0.00
                    </td>
                  </tr>
                  <tr>
                    <td className="bg-red-500 text-white font-medium py-1 px-2 md:px-4 border border-gray-300 text-center">
                      REFUND
                    </td>
                    <td className="bg-gray-100 text-green-800 font-medium py-1 px-4 md:px-8 border border-gray-300 text-right">
                      {/* Replace with actual REFUND total */}
                      0.00
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
                <div className="flex items-center border border-green-800 rounded-md bg-green-50 font-bold text-green-700 text-xs md:text-sm flex-1 md:flex-none">
                  <input
                    type="text"
                    value={date}
                    className="px-1 md:px-2 py-1 outline-none bg-green-50 w-24 md:w-auto"
                    readOnly
                  />
                  <Calendar className="mx-1 h-4 w-4 md:h-5 md:w-5 text-green-800" />
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transaction;
