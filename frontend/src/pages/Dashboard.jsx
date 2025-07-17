import React, { useEffect, useState, useRef, useMemo } from 'react';
import { BsTriangleFill } from 'react-icons/bs';
import { TbTriangleInvertedFilled } from 'react-icons/tb';
import { RxAvatar } from 'react-icons/rx';
import Chart from 'chart.js/auto';
import Sidebar from '../components/Sidebar';
import DashboardErrorBoundary from '../components/DashboardErrorBoundary';
import DateSelector from '../components/transaction/DateSelector';
import useUserDisplay from '../hooks/useUserDisplay';
import useAuth  from '../hooks/useAuth';
import { DashboardProvider, useDashboardContext } from '../contexts/DashboardContext';
import useDashboardData from '../hooks/useDashboardData';
import {
  transformDailyIncomeData,
  transformExpensesByDepartment,
  transformMonthlyProfitData,
  getLineChartOptions,
  getPieChartOptions,
  getBarChartOptions,
  formatCurrency
} from '../utils/chartDataTransformers';

const DashboardContent = () => {
  // Use the custom auth hook - with isAuthenticating check
  const { user, isAuthenticating } = useAuth();
  const userDisplayData = useUserDisplay(user);
  
  // Dashboard context for setting period
  const { setPeriod, currentMonth, currentYear } = useDashboardContext();
  
  const initialDate = useMemo(() => {
    return new Date(currentYear, currentMonth - 1, 1);
  }, [currentYear, currentMonth]);
  
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const dateInputRef = useRef(null);

  // Dashboard data hook
  const {
    monthlyRevenue,
    monthlyExpenses,
    netProfit,
    dailyIncomeData,
    expensesByDepartment,
    monthlyProfitData,
    loading,
    isLoading,
    revenueComparison,
    expensesComparison,
    netProfitComparison,
  } = useDashboardData();

  // Handle date change
  const handleDateChange = (e) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      const month = newDate.getMonth() + 1;
      const year = newDate.getFullYear();
      
      if (month !== currentMonth || year !== currentYear) {
        setSelectedDate(newDate);
        setPeriod(month, year);
      }
    }
  };

  // Tooltip visibility states
  const [showDailyIncomeTooltip, setShowDailyIncomeTooltip] = useState(false);
  const [showExpensesTooltip, setShowExpensesTooltip] = useState(false);
  const [showNetProfitTooltip, setShowNetProfitTooltip] = useState(false);
  
  // Chart legend data
  const [expenseLegendData, setExpenseLegendData] = useState([]);
  
  // Chart references
  const dailyIncomeChartRef = useRef(null);
  const expensesByDepartmentChartRef = useRef(null);
  const monthlyNetProfitChartRef = useRef(null);
  
  // Chart instances
  const chartInstancesRef = useRef({
    dailyIncome: null,
    expensesByDepartment: null,
    monthlyNetProfit: null
  });

  // Initialize and render charts with memoized dependencies
  useEffect(() => {
    if (!user || isLoading) return;
    
      Object.values(chartInstancesRef.current).forEach(chart => {
      if (chart) chart.destroy();
    });
    
    const renderTimeout = setTimeout(() => {
      if (dailyIncomeChartRef.current && dailyIncomeData && !loading.dailyIncome) {
        const dailyIncomeCtx = dailyIncomeChartRef.current.getContext('2d');
        const chartData = transformDailyIncomeData(dailyIncomeData);
        const chartOptions = getLineChartOptions();
        
        chartInstancesRef.current.dailyIncome = new Chart(dailyIncomeCtx, {
          type: 'line',
          data: chartData,
          options: chartOptions
        });
      }
      
      // Monthly Expenses by Department Pie Chart
      if (expensesByDepartmentChartRef.current && expensesByDepartment && !loading.expensesByDepartment) {
        const expensesCtx = expensesByDepartmentChartRef.current.getContext('2d');
        const chartData = transformExpensesByDepartment(expensesByDepartment);
        const chartOptions = getPieChartOptions();
        
        // Store legend data for rendering
        setExpenseLegendData(chartData.legendData || []);
        
        chartInstancesRef.current.expensesByDepartment = new Chart(expensesCtx, {
          type: 'pie',
          data: chartData,
          options: chartOptions
        });
      }
      
      // Monthly Net Profit Bar Chart
      if (monthlyNetProfitChartRef.current && monthlyProfitData && !loading.monthlyProfit) {
        const profitCtx = monthlyNetProfitChartRef.current.getContext('2d');
        const chartData = transformMonthlyProfitData(monthlyProfitData);
        const chartOptions = getBarChartOptions();
        
        chartInstancesRef.current.monthlyNetProfit = new Chart(profitCtx, {
          type: 'bar',
          data: chartData,
          options: chartOptions
        });
      }
    }, 100);
    
    // Cleanup function to destroy charts when component unmounts
    return () => {
      clearTimeout(renderTimeout);
      Object.values(chartInstancesRef.current).forEach(chart => {
        if (chart) chart.destroy();
      });
    };
  }, [
    user, 
    isLoading, 
    dailyIncomeData, 
    expensesByDepartment, 
    monthlyProfitData,
    loading.dailyIncome,
    loading.expensesByDepartment,
    loading.monthlyProfit
  ]);

  if (isAuthenticating) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      
      <div className="flex-1 overflow-auto p-6 pt-16 lg:pt-6 lg:ml-64">

        {/* Header Section */}
        <div className='flex flex-col lg:flex-row items-start justify-start gap-4 mb-6'>

          {/* Main metrics container */}
          <div className='flex-1 w-full text-center grid grid-cols-1 sm:grid-cols-4 lg:grid-cols-3 gap-4'>

            <div className="bg-white border-2 border-green-600 p-4 md:p-6 rounded-lg shadow-md flex flex-col items-start">
              {/* Total Revenue */}
              <h2 className="font-medium mb-2 sm:text-xs md:mb-4 text-green-800 text-sm md:text-lg lg:text-xl">Total Monthly Revenue</h2>
              <div className="flex items-center gap-2 md:gap-4">
                {revenueComparison ? (
                  revenueComparison.direction === 'up' ? (
                    <BsTriangleFill 
                      className="w-4 h-4 sm:w-4 sm:h-4 md:w-6 md:h-6 text-green-600" 
                      title={`Up ${revenueComparison.percentage?.toFixed(1)}% from last month`}
                    />
                  ) : revenueComparison.direction === 'down' ? (
                    <TbTriangleInvertedFilled 
                      className="w-4 h-4 sm:w-4 sm:h-4 md:w-6 md:h-6 text-red-600" 
                      title={`Down ${revenueComparison.percentage?.toFixed(1)}% from last month`}
                    />
                  ) : (
                    <div 
                      className="w-4 h-4 sm:w-4 sm:h-4 md:w-6 md:h-6 bg-gray-400 rounded-full"
                      title="No change from last month"
                    ></div>
                  )
                ) : (
                  <div 
                    className="w-4 h-1 sm:w-4 sm:h-1 md:w-6 md:h-1 bg-gray-400 rounded"
                    title="No previous month data available"
                  ></div>
                )}
                <h1 className="text-green-800 font-medium text-lg sm:text-xs md:text-2xl lg:text-3xl">
                  {loading.monthlyData ? 'Loading...' : formatCurrency(monthlyRevenue)}
                </h1>
              </div>
            </div>

            <div className="bg-white border-2 border-green-600 p-4 md:p-6 rounded-lg shadow-md flex flex-col items-start">
              {/* Total Expenses */}
              <h2 className="font-medium mb-2 sm:text-xs md:mb-4 text-green-800 text-sm md:text-lg lg:text-xl">Total Monthly Expenses</h2>
              <div className="flex items-center gap-2 md:gap-4">
                {expensesComparison ? (
                  expensesComparison.direction === 'up' ? (
                    <BsTriangleFill 
                      className="w-4 h-4 sm:w-4 sm:h-4 md:w-6 md:h-6 text-red-600" 
                      title={`Up ${expensesComparison.percentage?.toFixed(1)}% from last month`}
                    />
                  ) : expensesComparison.direction === 'down' ? (
                    <TbTriangleInvertedFilled 
                      className="w-4 h-4 sm:w-4 sm:h-4 md:w-6 md:h-6 text-green-600" 
                      title={`Down ${expensesComparison.percentage?.toFixed(1)}% from last month`}
                    />
                  ) : (
                    <div 
                      className="w-4 h-4 sm:w-4 sm:h-4 md:w-6 md:h-6 bg-gray-400 rounded-full"
                      title="No change from last month"
                    ></div>
                  )
                ) : (
                  <div 
                    className="w-4 h-1 sm:w-4 sm:h-1 md:w-6 md:h-1 bg-gray-400 rounded"
                    title="No previous month data available"
                  ></div>
                )}
                <h1 className="text-green-800 font-medium text-lg sm:text-xs md:text-2xl lg:text-3xl">
                  {loading.monthlyData ? 'Loading...' : formatCurrency(monthlyExpenses)}
                </h1>
              </div>
            </div>

            <div className="bg-white border-2 border-green-600 p-4 md:p-6 rounded-lg shadow-md flex flex-col items-start sm:col-span-2 lg:col-span-1">
              {/* Net Profit */}
              <h2 className="font-medium mb-2 md:mb-4 text-green-800 text-sm md:text-lg lg:text-xl">Net Profit</h2>
              <div className="flex items-center gap-2 md:gap-4">
                {netProfitComparison ? (
                  netProfitComparison.direction === 'up' ? (
                    <BsTriangleFill 
                      className="w-4 h-4 sm:w-4 sm:h-4 md:w-6 md:h-6 text-green-600" 
                      title={`Up ${netProfitComparison.percentage?.toFixed(1)}% from last month`}
                    />
                  ) : netProfitComparison.direction === 'down' ? (
                    <TbTriangleInvertedFilled 
                      className="w-4 h-4 sm:w-4 sm:h-4 md:w-6 md:h-6 text-red-600" 
                      title={`Down ${netProfitComparison.percentage?.toFixed(1)}% from last month`}
                    />
                  ) : (
                    <div 
                      className="w-4 h-4 sm:w-4 sm:h-4 md:w-6 md:h-6 bg-gray-400 rounded-full"
                      title="No change from last month"
                    ></div>
                  )
                ) : (
                  <div 
                    className="w-4 h-1 sm:w-4 sm:h-1 md:w-6 md:h-1 bg-gray-400 rounded"
                    title="No previous month data available"
                  ></div>
                )}
                <h1 className={`font-medium text-lg md:text-2xl lg:text-3xl ${netProfit >= 0 ? 'text-green-800' : 'text-red-600'}`}>
                  {loading.monthlyData ? 'Loading...' : formatCurrency(netProfit)}
                </h1>
              </div>
            </div>

          </div>

          {/* Side info container */}
          <div className='flex flex-row lg:flex-col gap-4 w-full lg:w-auto lg:min-w-[220px]'>

            <div className='bg-white border-2 border-green-600 p-3 rounded-lg shadow-md flex items-center justify-center gap-2 flex-1 lg:flex-none'>
              <RxAvatar className="w-4 h-4 md:w-6 sm:w-4 sm:h-4 md:h-6 text-green-700" /> 
              <span className="text-green-700 font-medium text-sm md:text-lg"
              title={userDisplayData.fullName}
              >
                {userDisplayData.displayName}
              </span>
            </div>

            <div className='bg-white border-2 border-green-600 rounded-lg shadow-md flex-1 lg:flex-none'>
              <DateSelector 
                date={selectedDate}
                onDateChange={handleDateChange}
                inputRef={dateInputRef}
                className="relative flex items-center border-0 rounded-md bg-transparent font-bold text-green-700 text-sm md:text-lg flex-1 md:flex-none cursor-pointer p-3"
                customStyles={{
                  wrapper: "flex-grow",
                  text: "text-green-700 font-medium",
                  icon: "ml-2 h-4 w-4 md:h-6 md:w-6 text-green-700"
                }}
                displayFormat="month-year"
              />
            </div>
          
          </div>

        </div>
              
        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Daily Income Trend Chart */}
          <div className="bg-white border border-2 border-green-600 p-4 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-gray-700">Daily Income Trend</h3>
              <div 
                className="w-5 h-5 rounded-full bg-[#02542D] flex items-center justify-center text-white text-xs cursor-help relative"
                onMouseEnter={() => setShowDailyIncomeTooltip(true)}
                onMouseLeave={() => setShowDailyIncomeTooltip(false)}
              >
                i
                {showDailyIncomeTooltip && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg p-3 z-10 text-gray-700 text-xs">
                    <p className="font-semibold mb-1">Daily Income Trend</p>
                    <p>This chart displays your daily income over the past few days. It helps you identify patterns in revenue generation and track day-to-day financial performance.</p>
                  </div>
                )}
              </div>
            </div>
            <div className="h-48">
              {loading.dailyIncome ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500">Loading chart...</div>
                </div>
              ) : (
                <canvas ref={dailyIncomeChartRef}></canvas>
              )}
            </div>
          </div>
          
          {/* Monthly Expenses by Department Chart */}
          <div className="bg-white border border-2 border-green-600 p-4 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-gray-700">Monthly Expenses Breakdown by Department</h3>
              <div 
                className="w-5 h-5 rounded-full bg-[#02542D] flex items-center justify-center text-white text-xs cursor-help relative"
                onMouseEnter={() => setShowExpensesTooltip(true)}
                onMouseLeave={() => setShowExpensesTooltip(false)}
              >
                i
                {showExpensesTooltip && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg p-3 z-10 text-gray-700 text-xs">
                    <p className="font-semibold mb-1">Monthly Expenses by Department</p>
                    <p>This pie chart shows the distribution of expenses across different departments. Use this visualization to identify which departments are consuming the largest portions of your budget.</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center">
              <div className="h-48 w-full md:w-2/3">
                {loading.expensesByDepartment ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-gray-500">Loading chart...</div>
                  </div>
                ) : (
                  <canvas ref={expensesByDepartmentChartRef}></canvas>
                )}
              </div>
              <div className="w-full md:w-1/3 mt-4 md:mt-0">
                {/* Dynamic legend based on real data */}
                {expenseLegendData && expenseLegendData.length > 0 ? (
                  expenseLegendData.map((item, index) => (
                    <div key={index} className="flex items-center mb-2">
                      <div 
                        className="w-6 h-3 mr-2" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-xs">{item.label} ({item.percentage}%)</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-500">No expense data available</div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Monthly Net Profit Chart (Full Width) */}
        <div className="bg-white border border-2 border-green-600 p-4 rounded-lg shadow-md mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-gray-700">Monthly Net Profit</h3>
            <div 
              className="w-5 h-5 rounded-full bg-[#02542D] flex items-center justify-center text-white text-xs cursor-help relative"
              onMouseEnter={() => setShowNetProfitTooltip(true)}
              onMouseLeave={() => setShowNetProfitTooltip(false)}
            >
              i
              {showNetProfitTooltip && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg p-3 z-10 text-gray-700 text-xs">
                  <p className="font-semibold mb-1">Monthly Net Profit</p>
                  <p>This bar chart shows your net profit for the year. Use this data to analyze profit trends, identify seasonal variations, and track overall financial performance.</p>
                </div>
              )}
            </div>
          </div>
          <div className="h-64">
            {loading.monthlyProfit ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">Loading chart...</div>
              </div>
            ) : (
              <canvas ref={monthlyNetProfitChartRef}></canvas>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  return (
    <DashboardErrorBoundary>
      <DashboardProvider>
        <DashboardContent />
      </DashboardProvider>
    </DashboardErrorBoundary>
  );
};

export default Dashboard;