import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Income from '../assets/icons/income_logo.png';
import Expense from '../assets/icons/expense_logo.png';
import { Calendar, Download, Edit, X, Check, MoreVertical, ReceiptText } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import LoginForm from '../components/LoginForm';

const Transaction = () => {
  const { user, loading } = useAuth();
  const [date, setDate] = useState('16-MAR-2025');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [openExpenseMenuId, setOpenExpenseMenuId] = useState(null);

  // Toggle dropdown menu for income rows
  const toggleIncomeMenu = (id) => {
    setOpenMenuId(prevId => prevId === id ? null : id);
    // Close expense menu if open
    if (openExpenseMenuId) setOpenExpenseMenuId(null);
  };

  // Toggle dropdown menu for expense rows
  const toggleExpenseMenu = (id) => {
    setOpenExpenseMenuId(prevId => prevId === id ? null : id);
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

  const incomeData = [
    {
      id: '20001',
      name: 'John Williams',
      utz: 200,
      lab: 150,
      xray: 700,
      ecg: 500,
      pe: null,
      dt: 210,
      referrer: 'Dr. Robotnik',
      grossDeposit: 1860,
      status: 'active'
    },
    {
      id: '20002',
      name: 'Will Smith',
      utz: 300,
      lab: null,
      xray: null,
      ecg: null,
      pe: null,
      dt: null,
      referrer: null,
      grossDeposit: 550,
      status: 'canceled'
    }
  ];

   // Calculate totals
   const totals = incomeData.reduce((acc, row) => {
    if (row.status !== 'canceled') {
      acc.utz += row.utz || 0;
      acc.lab += row.lab || 0;
      acc.xray += row.xray || 0;
      acc.ecg += row.ecg || 0;
      acc.pe += row.pe || 0;
      acc.dt += row.dt || 0;
      acc.grossDeposit += row.grossDeposit || 0;
    }
    return acc;
  }, { utz: 0, lab: 0, xray: 0, ecg: 0, pe: 0, dt: 0, grossDeposit: 0 });

    // Summary data
    const summary = {
      gcash: 210,
      refund: 310,
      total: 1650
    };

  // Sample expense data
  const expenseData = [
    {
      payee: 'Salmon Hermida',
      purpose: 'Office Supplies',
      department: 'Lab',
      amount: 3000,
    },
    {
      payee: 'Grey Williams',
      purpose: 'Utilities',
      department: 'X-ray',
      amount: 7000,
    },
    {
      payee: 'Elmira Joe',
      purpose: 'Medical Equipment',
      department: 'ECG',
      amount: 4000,
    }
  ];

  // Calculate expense totals
  const expenseTotals = expenseData.reduce((acc, expense) => {
    if (expense.status === 'paid') {
      acc.total += expense.amount;
      
      // Track payment methods
      if (expense.paymentMethod === 'Cash') {
        acc.cash += expense.amount;
      } else if (expense.paymentMethod === 'GCash') {
        acc.gcash += expense.amount;
      } else {
        acc.other += expense.amount;
      }
    }
    return acc;
  }, { total: 0, cash: 0, gcash: 0, other: 0 });

  if (loading) {
    return <LoginForm />;
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
                
                <button className="px-3 md:px-8 py-1 md:py-2 bg-green-800 text-white rounded-md text-sm md:text-base flex-1 md:flex-none md:w-32">
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
                    <th className="py-1 md:py-2 px-1 md:px-2 text-left border border-green-200">Name</th>
                    <th className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">UTZ</th>
                    <th className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">Lab</th>
                    <th className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">XRAY</th>
                    <th className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">ECG</th>
                    <th className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">PE</th>
                    <th className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">DT</th>
                    <th className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">Gross</th>
                    <th className="py-1 md:py-2 px-1 md:px-2 text-left border border-green-200">Referrer</th>
                    <th className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeData.map((row) => (
                    <tr key={row.id} className={row.id === '20002' ? 'bg-gray-100' : 'bg-white'}>
                      <td className="py-1 md:py-2 px-1 md:px-2 border border-green-200 sticky left-0 bg-inherit">{row.id}</td>
                      <td className="py-1 md:py-2 px-1 md:px-2 border border-green-200">{row.name}</td>
                      <td className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">{row.utz}</td>
                      <td className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">
                        {row.status === 'canceled' ? '' : row.lab}
                      </td>
                      <td className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">
                        {row.status === 'canceled' ? (
                          <span className="text-green-700 font-medium text-xs md:text-sm">Canceled</span>
                        ) : row.xray}
                      </td>
                      <td className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">
                        {row.status === 'canceled' ? '' : row.ecg}
                      </td>
                      <td className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">
                        {row.status === 'canceled' ? '' : row.pe}
                      </td>
                      <td className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">
                        {row.status === 'canceled' ? '' : row.dt}
                      </td>
                      <td className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">{row.grossDeposit}</td>
                      <td className="py-1 md:py-2 px-1 md:px-2 border border-green-200 max-w-[100px] truncate">
                        {row.status === 'canceled' ? '' : row.referrer}
                      </td>
                      <td className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">
                        {row.status !== 'canceled' && (
                          <div className="relative flex justify-center">
                            <button 
                              className="text-gray-600 hover:text-green-600 focus:outline-none"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleIncomeMenu(row.id);
                              }}
                            >
                              <MoreVertical size={16} className="md:w-5 md:h-5" />
                            </button>
                            
                            {openMenuId === row.id && (
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
                  
                  <tr className="bg-gray-200">
                    <td colSpan={2} className="py-1 md:py-2 px-1 md:px-2 font-bold border border-green-200 text-green-800 sticky left-0 bg-gray-200">Total:</td>
                    <td className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">{totals.utz}</td>
                    <td className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">{totals.lab}</td>
                    <td className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">{totals.xray}</td>
                    <td className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">{totals.ecg}</td>
                    <td className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">{totals.pe}</td>
                    <td className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">{totals.dt}</td>
                    <td className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">{totals.grossDeposit}</td>
                    <td className="py-1 md:py-2 px-1 md:px-2 border border-green-200"></td>
                    <td className="py-1 md:py-2 px-1 md:px-2 border border-green-200"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Legend  */}
          <div className="mt-2 flex flex-col md:flex-row justify-between p-2">
            <div className="flex flex-wrap items-center mb-4 md:mb-0">
              <button className="bg-green-800 text-white px-4 md:px-6 py-2 rounded flex items-center mb-2 md:mb-0 text-sm md:text-base">
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
                      {summary.gcash}
                    </td>
                  </tr>
                  <tr>
                    <td className="bg-red-500 text-white font-medium py-1 px-2 md:px-4 border border-gray-300 text-center">
                      REFUND
                    </td>
                    <td className="bg-gray-100 text-green-800 font-medium py-1 px-4 md:px-8 border border-gray-300 text-right">
                      {summary.refund}
                    </td>
                  </tr>
                  <tr>
                    <td className="bg-green-800 text-white font-medium py-1 px-2 md:px-4 border border-gray-300 text-center">
                      TOTAL
                    </td>
                    <td className="bg-gray-100 text-green-800 font-medium py-1 px-4 md:px-8 border border-gray-300 text-right">
                      {summary.total.toLocaleString()}
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
                
                <button className="px-3 md:px-8 py-1 md:py-2 bg-green-800 text-white rounded-md text-sm md:text-base flex-1 md:flex-none md:w-32">
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
                  {expenseData.map((row, index) => (
                    <tr key={index} className={row.status === 'pending' ? 'bg-green-50' : 'bg-white'}>
                      <td className="py-1 md:py-2 px-1 md:px-2 border border-green-200">{row.payee}</td>
                      <td className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">{row.purpose}</td>
                      <td className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">{row.department}</td>
                      <td className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">{row.amount}</td>
                      <td className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200">
                        <div className="relative flex justify-center">
                          <button 
                            className="text-gray-600 hover:text-green-600 focus:outline-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpenseMenu(index);
                            }}
                          >
                            <MoreVertical size={16} className="md:w-5 md:h-5" />
                          </button>
                          
                          {openExpenseMenuId === index && (
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
                              <button className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-green-600">
                                <Check size={14} className="mr-2" />
                                Mark Paid
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  <tr className="bg-gray-200">
                    <td colSpan={3} className="py-1 md:py-2 px-1 md:px-2 font-bold border border-green-200 text-green-800">Total:</td>
                    <td className="py-1 md:py-2 px-1 md:px-2 text-center border border-green-200 font-bold">{expenseTotals.total}</td>
                    <td className="py-1 md:py-2 px-1 md:px-2 border border-green-200"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Expenses summary */}
          <div className="mt-2 flex flex-col md:flex-row justify-between p-2">
            <div className="flex flex-wrap items-center mb-4 md:mb-0">
              <button className="bg-green-800 text-white px-4 md:px-6 py-2 rounded flex items-center mb-2 md:mb-0 text-sm md:text-base">
                Generate Report <Download className="ml-2 h-3 w-3 md:h-4 md:w-4" />
              </button>
              
            </div>
          </div>

          
        </div>
      </div>
    </div>
  );
};

export default Transaction;
