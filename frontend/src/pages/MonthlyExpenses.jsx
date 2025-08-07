import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/dashboard/Sidebar'
import { ChevronLeft, ChevronRight, CirclePlus } from 'lucide-react'
import useAuth from '../hooks/auth/useAuth'
import { monthlyExpenseAPI, departmentAPI } from '../services/api'
import { toast } from 'react-toastify'

const MonthlyExpenses = () => {
  const { user, isAuthenticating } = useAuth()
  const navigate = useNavigate()
  
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return {
      month: now.getMonth() + 1, 
      year: now.getFullYear()
    };
  });
  const [currentMonth, setCurrentMonth] = useState('');
  
  const [departmentsList, setDepartmentsList] = useState([]);
  
  const [monthlyData, setMonthlyData] = useState({
    departments: [],
    dailyExpenses: []
  });
  const [dataLoading, setDataLoading] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);

  useEffect(() => {
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    setCurrentMonth(`${monthNames[currentDate.month - 1]}-${currentDate.year}`);
    
    fetchDepartments();
  }, [currentDate]); 

  useEffect(() => {
    if (departmentsList.length > 0) {
      fetchMonthlyExpensesData();
    }
  }, [currentDate.month, currentDate.year, departmentsList.length]);

  const fetchDepartments = async () => {
    try {
      const response = await departmentAPI.getAllDepartments(true);
      
      if (response && response.data) {
        const depts = Array.isArray(response.data) ? response.data : 
                     Array.isArray(response.data.data) ? response.data.data : [];
        
        // Only include active departments (exclude archived)
        const activeDepts = depts.filter(dept => dept.status === 'active');
        
        setDepartmentsList(activeDepts);
      } else {
        console.error("Failed to get departments:", response);
        toast.error("Failed to load departments");
        setDepartmentsList([]);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error(`Error loading departments: ${error.message}`);
      setDepartmentsList([]);
    }
  };

  // Fetch monthly expenses data from the API
  const fetchMonthlyExpensesData = async () => {
    setDataLoading(true);
    try {
      // Get monthly expense data for all departments
      const expensesResponse = await monthlyExpenseAPI.getMonthlyExpenses(
        currentDate.month,
        currentDate.year,
        null // Get all data
      );
      
      if (expensesResponse && expensesResponse.data && expensesResponse.data.success) {
        const responseData = expensesResponse.data.data;
        setMonthlyData(responseData);
      } else {
        toast.error('Failed to fetch monthly expenses data');
        setMonthlyData({ departments: [], dailyExpenses: [] });
      }
    } catch (error) {
      console.error('Error fetching monthly expense data:', error);
      toast.error(`Error: ${error.message || 'Failed to load monthly data'}`);
    } finally {
      setDataLoading(false);
    }
  };

  const handleAddExpense = () => {
    navigate('/add-expenses')
  }

  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const newMonth = prev.month === 1 ? 12 : prev.month - 1;
      const newYear = prev.month === 1 ? prev.year - 1 : prev.year;
      return { month: newMonth, year: newYear };
    });
  }

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const newMonth = prev.month === 12 ? 1 : prev.month + 1;
      const newYear = prev.month === 12 ? prev.year + 1 : prev.year;
      return { month: newMonth, year: newYear };
    });
  }

  // Format currency values
  const formatCurrency = (value) => {
    return parseFloat(value || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Format dates in DD-MM-YY format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
  };

  // Function to get expense items by department
  const getExpenseItemsByDepartment = (departmentId) => {
    if (!monthlyData.dailyExpenses || monthlyData.dailyExpenses.length === 0) {
      return [];
    }
    
    const items = [];
    
    monthlyData.dailyExpenses.forEach(day => {
      Object.entries(day.departments).forEach(([deptName, deptData]) => {
        // Find department by ID
        const department = departmentsList.find(dept => 
          dept.departmentId === departmentId || dept.id === departmentId
        );
        
        if (department && department.departmentName === deptName) {
          deptData.items.forEach(item => {
            if (item.status !== 'paid') { 
              items.push({
                ...item,
                date: day.date,
                department: deptName,
              });
            }
          });
        }
      });
    });
    
    return items.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Function to get expense items with no department
  const getExpenseItemsWithNoDepartment = () => {
    if (!monthlyData.dailyExpenses || monthlyData.dailyExpenses.length === 0) {
      return [];
    }
    
    const items = [];
    
    monthlyData.dailyExpenses.forEach(day => {
      Object.entries(day.departments).forEach(([deptName, deptData]) => {
        // Check if this department name doesn't match any active department
        const isKnownDepartment = departmentsList.some(dept => dept.departmentName === deptName);
        
        if (!isKnownDepartment || deptName === 'Other' || deptName === 'No Department') {
          deptData.items.forEach(item => {
            if (item.status !== 'paid') { 
              items.push({
                ...item,
                date: day.date,
                department: deptName || 'Other',
              });
            }
          });
        }
      });
    });
    
    return items.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Calculate total for a department
  const calculateDepartmentTotal = (departmentId) => {
    const items = getExpenseItemsByDepartment(departmentId);
    return items.reduce((total, item) => total + parseFloat(item.amount || 0), 0);
  };

  // Calculate total for expenses with no department
  const calculateOtherExpensesTotal = () => {
    const items = getExpenseItemsWithNoDepartment();
    return items.reduce((total, item) => total + parseFloat(item.amount || 0), 0);
  };

  const GoToMonthlyIncome = () => {
    navigate('/monthly-income');
  }

  if (isAuthenticating) {
    return null;
  }
  
  if (!user) {
    return null;
  }

  const otherExpensesItems = getExpenseItemsWithNoDepartment();

  return (
    <div className="flex flex-col md:flex-row h-screen bg-cream-50">
      {/* Sidebar */}
      <div className="md:sticky md:top-0 md:h-screen z-10">
        <Sidebar />
      </div>
      
      {/* Main content area with improved spacing */}
      <div className="flex-1 overflow-auto p-4 pt-16 lg:pt-6 lg:ml-64">

        <div className="bg-cream-50 border-green-800 rounded">

          <div className='flex justify-start mb-2'>
              <button onClick={GoToMonthlyIncome} 
                        className="text-green-800 bg-white border-2 border-green-800 hover:bg-green-300 hover:text-white font-medium py-1 px-3 rounded flex items-center">
                        Monthly Income <ChevronLeft size={16} className="ml-1" />
              </button>
          </div>

          {/* Month navigation */}
          <div className="flex justify-center items-center py-2">
            <div className="flex border border-green-800 rounded overflow-hidden">
              <button 
                onClick={handlePrevMonth}
                className="bg-green-800 font-bold text-white px-2 py-2 flex items-center justify-center text-sm"
              >
               <ChevronLeft size={20} color="white" />
              </button>
              <div className="px-4 py-1 font-medium border-l border-r border-green-800 text-green-800">{currentMonth}</div>
              <button 
                onClick={handleNextMonth}
                className="bg-green-800 font-bold text-white px-2 py-2 flex items-center justify-center text-sm"
              >
               <ChevronRight size={20} color="white" />
              </button>
            </div>
          </div>

          <div className="flex justify-end px-2 mb-2">
            <button onClick={handleAddExpense} className="bg-green-800 text-white px-4 py-2 rounded flex items-center hover:bg-green-600">
              <CirclePlus size={16} className="mr-2" />
              Add Expense
            </button>
          </div>

          {dataLoading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-green-800 font-medium">Loading expense data...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Department Tables */}
              {departmentsList.map((department) => {
                const departmentItems = getExpenseItemsByDepartment(department.departmentId || department.id);
                const departmentTotal = calculateDepartmentTotal(department.departmentId || department.id);
                
                // Only show department if it has expenses
                if (departmentItems.length === 0) {
                  return null;
                }

                return (
                  <div key={department.departmentId || department.id} className="p-2">
                    <div className="bg-green-800 p-2 rounded-t">
                      <h1 className='ml-2 font-bold text-white sm:text-xs md:text-xl'>
                        {department.departmentName} Department
                      </h1>
                    </div>
                    <div className="border border-green-800 rounded-b">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-green-800 bg-green-100">
                              <th className="p-1 border-r border-green-800 text-sm font-medium">Date</th>
                              <th className="p-1 border-r border-green-800 text-sm font-medium">Paid To</th>
                              <th className="p-1 border-r border-green-800 text-sm font-medium">Category</th>
                              <th className="p-1 border-r border-green-800 text-sm font-medium">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {departmentItems.map((item, index) => (
                              <tr key={item.id || `dept-${department.departmentId}-item-${index}`} className="border-b border-green-100">
                                <td className="p-1 border-r border-green-200 text-center bg-white">{formatDate(item.date)}</td>
                                <td className="p-1 border-r border-green-200 text-center bg-white">{item.paidTo || '-'}</td>
                                <td className="p-1 border-r border-green-200 text-center bg-white">{item.categoryName || '-'}</td>
                                <td className="p-1 border-r border-green-200 text-center bg-white">{formatCurrency(item.amount)}</td>
                              </tr>
                            ))}
                            
                            {/* Empty rows to fill space if needed */}
                            {departmentItems.length < 5 && 
                              [...Array(5 - departmentItems.length)].map((_, index) => (
                                <tr key={`dept-${department.departmentId}-empty-${index}`} className="border-b border-green-100">
                                  <td className="p-1 border-r border-green-200 bg-white">&nbsp;</td>
                                  <td className="p-1 border-r border-green-200 bg-white">&nbsp;</td>
                                  <td className="p-1 border-r border-green-200 bg-white">&nbsp;</td>
                                  <td className="p-1 border-r border-green-200 bg-white">&nbsp;</td>
                                </tr>
                              ))
                            }
                          </tbody>
                          <tfoot>
                            <tr className="border-t border-green-800 bg-green-100 font-bold">
                              <td className="p-1 text-center border-r border-green-800">TOTAL:</td>
                              <td colSpan={2} className="p-1 border-r border-green-800"></td>
                              <td className="p-1 border-r border-green-800 text-center">{formatCurrency(departmentTotal)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Other Expenses Table (No Department) */}
              {otherExpensesItems.length > 0 && (
                <div className="p-2">
                  <div className="bg-gray-800 p-2 rounded-t">
                    <h1 className='ml-2 font-bold text-white sm:text-xs md:text-xl'>
                      Other Expenses (No Department)
                    </h1>
                  </div>
                  <div className="border border-gray-800 rounded-b">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-800 bg-gray-100">
                            <th className="p-1 border-r border-gray-800 text-sm font-medium">Date</th>
                            <th className="p-1 border-r border-gray-800 text-sm font-medium">Paid To</th>
                            <th className="p-1 border-r border-gray-800 text-sm font-medium">Category</th>
                            <th className="p-1 border-r border-gray-800 text-sm font-medium">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {otherExpensesItems.map((item, index) => (
                            <tr key={item.id || `other-item-${index}`} className="border-b border-gray-100">
                              <td className="p-1 border-r border-gray-200 text-center bg-white">{formatDate(item.date)}</td>
                              <td className="p-1 border-r border-gray-200 text-center bg-white">{item.paidTo || '-'}</td>
                              <td className="p-1 border-r border-gray-200 text-center bg-white">{item.categoryName || '-'}</td>
                              <td className="p-1 border-r border-gray-200 text-center bg-white">{formatCurrency(item.amount)}</td>
                            </tr>
                          ))}
                          
                          {/* Empty rows to fill space if needed */}
                          {otherExpensesItems.length < 5 && 
                            [...Array(5 - otherExpensesItems.length)].map((_, index) => (
                              <tr key={`other-empty-${index}`} className="border-b border-gray-100">
                                <td className="p-1 border-r border-gray-200 bg-white">&nbsp;</td>
                                <td className="p-1 border-r border-gray-200 bg-white">&nbsp;</td>
                                <td className="p-1 border-r border-gray-200 bg-white">&nbsp;</td>
                                <td className="p-1 border-r border-gray-200 bg-white">&nbsp;</td>
                              </tr>
                            ))
                          }
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-gray-800 bg-gray-100 font-bold">
                            <td className="p-1 text-center border-r border-gray-800">TOTAL:</td>
                            <td colSpan={2} className="p-1 border-r border-gray-800"></td>
                            <td className="p-1 border-r border-gray-800 text-center">{formatCurrency(calculateOtherExpensesTotal())}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* No Data Message */}
              {departmentsList.length === 0 && otherExpensesItems.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-600">No expense data available for this month.</p>
                </div>
              )}
            </div>
          )}

          {/* Generate Report Button */}
          <div className="flex justify-end p-2">
            <button className="bg-green-800 text-white px-4 py-2 rounded flex items-center hover:bg-green-600">
              Generate Report
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Close dropdown menus when clicking outside */}
      {activeMenu && (
        <div 
          className="fixed inset-0 h-full w-full z-0"
          onClick={() => setActiveMenu(null)}
        />
      )}
    </div>
  )
}

export default MonthlyExpenses
