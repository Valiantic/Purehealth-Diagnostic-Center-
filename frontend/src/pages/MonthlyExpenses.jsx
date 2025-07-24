import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { ChevronLeft, ChevronRight, CirclePlus, ChevronDown, MoreVertical } from 'lucide-react'
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
  
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [departmentsList, setDepartmentsList] = useState([]);
  
  const [monthlyData, setMonthlyData] = useState({
    departments: [],
    dailyExpenses: []
  });
  const [monthlySummary, setMonthlySummary] = useState({
    totalExpense: 0,
    departmentTotals: {}
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
  }, [currentDate.month, currentDate.year, selectedDepartment, departmentsList.length]);

  const fetchDepartments = async () => {
    try {
      const response = await departmentAPI.getAllDepartments(true);
      
      if (response && response.data) {
        const depts = Array.isArray(response.data) ? response.data : 
                     Array.isArray(response.data.data) ? response.data.data : [];
        
        const activeDepts = depts.filter(dept => dept.status === 'active');
        
        const deptOptions = [
          { id: 'all', departmentId: 'all', departmentName: 'All Departments' },
          ...activeDepts
        ];
        
        setDepartmentsList(deptOptions);
      } else {
        console.error("Failed to get departments:", response);
        toast.error("Failed to load departments");
        setDepartmentsList([{ id: 'all', departmentId: 'all', departmentName: 'All Departments' }]);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error(`Error loading departments: ${error.message}`);
      setDepartmentsList([{ id: 'all', departmentId: 'all', departmentName: 'All Departments' }]);
    }
  };

  // Fetch monthly expenses data from the API
  const fetchMonthlyExpensesData = async () => {
    setDataLoading(true);
    try {
      // Get monthly expense data
      const expensesResponse = await monthlyExpenseAPI.getMonthlyExpenses(
        currentDate.month,
        currentDate.year,
        selectedDepartment !== 'all' ? selectedDepartment : null
      );
      
      if (expensesResponse && expensesResponse.data && expensesResponse.data.success) {
        const responseData = expensesResponse.data.data;
        setMonthlyData(responseData);
        
        // Update departments list from the API response
        if (responseData.departments && responseData.departments.length > 0) {
          const deptOptions = [{ id: 'all', departmentId: 'all', departmentName: 'All Departments' }];
          
          responseData.departments.forEach(dept => {
            deptOptions.push({ 
              id: dept.id, 
              departmentId: dept.id, 
              departmentName: dept.name 
            });
          });
          
          setDepartmentsList(deptOptions);
        }
      } else {
        toast.error('Failed to fetch monthly expenses data');
        setMonthlyData({ departments: [], dailyExpenses: [] });
      }
      
      // Get summary data
      const summaryResponse = await monthlyExpenseAPI.getMonthlyExpensesSummary(
        currentDate.month,
        currentDate.year,
        selectedDepartment !== 'all' ? selectedDepartment : null
      );
      
      if (summaryResponse && summaryResponse.data && summaryResponse.data.success) {
        setMonthlySummary(summaryResponse.data.data);
      } else {
        toast.error('Failed to fetch monthly expenses summary');
        setMonthlySummary({
          totalExpense: 0,
          departmentTotals: {}
        });
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
  
  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
  }
  
  const toggleMenu = (id) => {
    setActiveMenu(activeMenu === id ? null : id);
  };

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

  // Function to get flattened expense items for all departments or filtered by selected department
  const getExpenseItemsForDisplay = () => {
    if (!monthlyData.dailyExpenses || monthlyData.dailyExpenses.length === 0) {
      return [];
    }
    
    const allItems = [];
    

    monthlyData.dailyExpenses.forEach(day => {
      if (selectedDepartment === 'all') {
        Object.entries(day.departments).forEach(([deptName, deptData]) => {
          deptData.items.forEach(item => {
            if (item.status !== 'paid') { 
              allItems.push({
                ...item,
                date: day.date,
                department: deptName,
              });
            }
          });
        });
      } 
      else {
        Object.entries(day.departments).forEach(([deptName, deptData]) => {
          const deptFromList = monthlyData.departments.find(d => 
            d.name === deptName && d.id.toString() === selectedDepartment.toString()
          );
          
          if (deptFromList) {
            deptData.items.forEach(item => {
              if (item.status !== 'paid') {
                allItems.push({
                  ...item,
                  date: day.date,
                  department: deptName,
                });
              }
            });
          }
        });
      }
    });
    

    
    return allItems.sort((a, b) => new Date(b.date) - new Date(a.date));
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

  const selectedDepartmentName = departmentsList.find(d => d.id === selectedDepartment || d.departmentId === selectedDepartment)?.departmentName || 'All Departments';
  
  const expenseItemsToDisplay = getExpenseItemsForDisplay();

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
            <div className="relative">
              <select
                value={selectedDepartment}
                onChange={handleDepartmentChange}
                className="bg-white border-2 border-green-800 text-green-800 font-bold text-sm rounded py-1 pl-2 pr-6 appearance-none focus:outline-none focus:ring-1 focus:ring-white"
              >
                {departmentsList.map((dept) => (
                  <option key={dept.id || dept.departmentId} value={dept.id || dept.departmentId}>
                    {dept.departmentName}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-1 pointer-events-none">
                <ChevronDown size={16} className="text-green-800" />
              </div>
            </div>
          </div>

          <div className="p-2">
            <div className="bg-green-800 text-white p-2 font-semibold rounded-t flex justify-between items-center">
              <div>{selectedDepartmentName} Monthly Expenses</div>
              <button onClick={handleAddExpense} className="bg-green-700 text-white rounded-full w-6 h-6 flex items-center justify-center">
                <CirclePlus/>
              </button>
            </div>
            
            <div className="border border-green-800 rounded-b">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-green-800 bg-green-100">
                      <th className="p-1 border-r border-green-800 text-sm font-medium">Date</th>
                      <th className="p-1 border-r border-green-800 text-sm font-medium">Department</th>
                      <th className="p-1 border-r border-green-800 text-sm font-medium">Payee</th>
                      <th className="p-1 border-r border-green-800 text-sm font-medium">Purpose</th>
                      <th className="p-1 border-r border-green-800 text-sm font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataLoading ? (
                      <tr>
                        <td colSpan={6} className="p-2 text-center bg-white">
                          Loading data...
                        </td>
                      </tr>
                    ) : expenseItemsToDisplay.length > 0 ? (
                      expenseItemsToDisplay.map((item, index) => (
                        <tr key={item.id || `expense-item-${index}`} className="border-b border-green-100">
                          <td className="p-1 border-r border-green-200 text-center bg-white">{formatDate(item.date)}</td>
                          <td className="p-1 border-r border-green-200 text-center bg-white">{item.department}</td>
                          <td className="p-1 border-r border-green-200 text-center bg-white">{item.paidTo || '-'}</td>
                          <td className="p-1 border-r border-green-200 text-center bg-white">{item.purpose || '-'}</td>
                          <td className="p-1 border-r border-green-200 text-center bg-white">{formatCurrency(item.amount)}</td>
                          
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-2 text-center text-gray-500 bg-white">
                          No expense data available for {selectedDepartmentName} in this month
                        </td>
                      </tr>
                    )}
                    
                    {/* Empty rows to fill space if needed */}
                    {!dataLoading && expenseItemsToDisplay.length < 10 && 
                      [...Array(10 - expenseItemsToDisplay.length)].map((_, index) => (
                        <tr key={`empty-row-${index}`} className="border-b border-green-100">
                          <td className="p-1 border-r border-green-200 bg-white"></td>
                          <td className="p-1 border-r border-green-200 bg-white"></td>
                          <td className="p-1 border-r border-green-200 bg-white"></td>
                          <td className="p-1 border-r border-green-200 bg-white"></td>
                          <td className="p-1 border-r border-green-200 bg-white"></td>
                        </tr>
                      ))
                    }
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-green-800 bg-green-100 font-bold">
                      <td className="p-1 text-center border-r border-green-800">TOTAL:</td>
                      <td colSpan={3} className="p-1 border-r border-green-800"></td>
                      <td className="p-1 border-r border-green-800 text-center">{formatCurrency(
                        selectedDepartment === 'all' 
                          ? monthlySummary.totalExpense 
                          : monthlySummary.departmentTotals[selectedDepartment]?.amount || 0
                      )}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

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
