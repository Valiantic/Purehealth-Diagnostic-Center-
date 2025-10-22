import React, { useEffect, useState, useRef, useMemo } from 'react';
import { BsTriangleFill } from 'react-icons/bs';
import { TbTriangleInvertedFilled } from 'react-icons/tb';
import { RxAvatar } from 'react-icons/rx';
import Chart from 'chart.js/auto';
import Sidebar from '../components/dashboard/Sidebar';
import DashboardErrorBoundary from '../components/dashboard/DashboardErrorBoundary';
import DateSelector from '../components/transaction/DateSelector';
import useAuth  from '../hooks/auth/useAuth';
import { DashboardProvider, useDashboardContext } from '../contexts/DashboardContext';
import useDashboardData from '../hooks/dashboard/useDashboardData';
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
    transactionCount,
    transactionComparison,
  } = useDashboardData();

  // Handle date change
  const handleDateChange = (e) => {
    const newDate = new Date(e.target.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    newDate.setHours(0, 0, 0, 0);

    if (newDate > today){
      return; 
    }

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

  const [dailyIncomeLegend, setDailyIncomeLegend] = useState([]);

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
        const chartOptions = {
          ...getLineChartOptions(),
          plugins: {
            ...getLineChartOptions().plugins,
            tooltip: {
              ...getLineChartOptions().plugins.tooltip,
              callbacks: {
                label: function(context) {
                  const label = context.dataset.label || '';
                  return `${label}: ${formatCurrency(context.parsed.y)}`;
                }
              }
            }
          }
        };

        setDailyIncomeLegend(
          chartData.datasets.map(ds => ({
            label: ds.label,
            color: ds.borderColor,
            borderDash: ds.borderDash || [],
          }))
        );

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

        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 relative">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-gray-500 text-base font-medium whitespace-nowrap">Showing data for:</span>
            <div className="relative w-full max-w-xs sm:max-w-[180px]">
              <DateSelector 
                date={selectedDate}
                onDateChange={handleDateChange}
                inputRef={dateInputRef}
                max={new Date().toISOString().split('T')[0]}
                className="border border-gray-300 rounded px-3 py-2 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-green-600 text-base font-medium w-full min-w-[120px] sm:min-w-[120px]"
                customStyles={{
                  wrapper: "relative w-full",
                  text: "text-sm sm:text-base w-full",
                  icon: "ml-2 h-4 w-4 text-gray-400"
                }}
                dropdownProps={{
                  className: "absolute left-0 right-0 top-full z-50 bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-auto w-full",
                  style: { maxWidth: '100vw' }
                }}
                displayFormat="month-year"
              />
            </div>
          </div>
        </div>

        {/* Header Section */}
        <div className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <div className="bg-white rounded shadow-sm p-4">
              <h3 className="text-green-800 font-bold text-sm sm:text-xl md:text-2xl mb-2">Total Revenue</h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-black">{loading.monthlyData ? 'Loading...' : `${formatCurrency(monthlyRevenue)}`}</div>
                  <div className="flex items-center text-xs text-gray-500 mt-2">
                    {revenueComparison ? (
                      <>
                        {revenueComparison.direction === 'up' ? (
                          <BsTriangleFill className="w-4 h-4 text-green-600 mr-1" />
                        ) : (
                          <TbTriangleInvertedFilled className="w-4 h-4 text-red-600 mr-1" />
                        )}
                        <span className={`font-medium ${revenueComparison.direction === 'up' ? 'text-green-700' : 'text-red-600'}`}>{revenueComparison.percentage?.toFixed(2)}%</span>
                        <span className="ml-2">last month</span>
                      </>
                    ) : (
                      <span className="text-gray-400">--</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Operating Cost */}
            <div className="bg-white rounded shadow-sm p-4">
              <h3 className="text-green-800 font-bold text-sm sm:text-xl md:text-2xl mb-2">Operating Cost</h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-black">{loading.monthlyData ? 'Loading...' : `${formatCurrency(monthlyExpenses)}`}</div>
                  <div className="flex items-center text-xs text-gray-500 mt-2">
                    {expensesComparison ? (
                      <>
                        {expensesComparison.direction === 'up' ? (
                          <BsTriangleFill className="w-4 h-4 text-red-600 mr-1" />
                        ) : (
                          <TbTriangleInvertedFilled className="w-4 h-4 text-green-600 mr-1" />
                        )}
                        <span className={`font-medium ${expensesComparison.direction === 'up' ? 'text-red-600' : 'text-green-700'}`}>{expensesComparison.percentage?.toFixed(2)}%</span>
                        <span className="ml-2">last month</span>
                      </>
                    ) : (
                      <span className="text-gray-400">--</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Total Transactions */}
            <div className="bg-white rounded shadow-sm p-4">
              <h3 className="text-green-800 font-bold text-sm sm:text-xl md:text-2xl mb-2">Total Transactions</h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-black">{loading.monthlyData ? 'Loading...' : (typeof transactionCount === 'number' ? transactionCount : '--')}</div>
                  <div className="flex items-center text-xs text-gray-500 mt-2">
                    {transactionComparison ? (
                      <>
                        {transactionComparison.direction === 'up' ? (
                          <BsTriangleFill className="w-4 h-4 text-green-600 mr-1" />
                        ) : transactionComparison.direction === 'down' ? (
                          <TbTriangleInvertedFilled className="w-4 h-4 text-red-600 mr-1" />
                        ) : (
                          <span className="w-4 h-4 mr-1 text-gray-400">•</span>
                        )}
                        <span className={`font-medium ${transactionComparison.direction === 'up' ? 'text-green-700' : transactionComparison.direction === 'down' ? 'text-red-600' : 'text-gray-500'}`}>{transactionComparison.percentage?.toFixed(2)}%</span>
                        <span className="ml-2">last month</span>
                      </>
                    ) : (
                      <span className="text-gray-400">--</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Net Profit */}
            <div className="bg-white rounded shadow-sm p-4">
              <h3 className="text-green-800 font-bold text-sm sm:text-xl md:text-2xl mb-2">{netProfit >= 0 ? 'Net Profit' : 'Net Loss'}</h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-2xl sm:text-3xl font-extrabold ${netProfit >= 0 ? 'text-black' : 'text-red-600'}`}>{loading.monthlyData ? 'Loading...' : `${formatCurrency(netProfit)}`}</div>
                  <div className="flex items-center text-xs text-gray-500 mt-2">
                    {netProfitComparison ? (
                      <>
                        {netProfitComparison.direction === 'up' ? (
                          <BsTriangleFill className="w-4 h-4 text-green-600 mr-1" />
                        ) : (
                          <TbTriangleInvertedFilled className="w-4 h-4 text-red-600 mr-1" />
                        )}
                        <span className={`font-medium ${netProfitComparison.direction === 'up' ? 'text-green-700' : 'text-red-600'}`}>{netProfitComparison.percentage?.toFixed(2)}%</span>
                        <span className="ml-2">last month</span>
                      </>
                    ) : (
                      <span className="text-gray-400">--</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
              
        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Daily Income Trend Chart */}
          <div className="bg-white p-4 rounded-lg shadow-md">
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
                    <p>
                      This chart displays your daily income over the past few days, including both collected and collectible income. The "Total Income" line represents the sum of collected and collectible income for each day.
                    </p>
                  </div>
                )}
              </div>
            </div>
            {/* Color legend for daily income trend */}
            <div className="flex flex-wrap gap-4 mb-2">
              {dailyIncomeLegend.map((item, idx) => (
                <div key={idx} className="flex items-center text-xs">
                  <span
                    className="inline-block w-4 h-2 mr-2 rounded"
                    style={{
                      background: item.color,
                      borderBottom: item.borderDash.length ? '2px dashed #333' : '2px solid #333',
                      borderColor: item.color,
                      borderStyle: item.borderDash.length ? 'dashed' : 'solid'
                    }}
                  ></span>
                  <span>{item.label}</span>
                </div>
              ))}
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
          <div className="bg-white p-4 rounded-lg shadow-md">
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
        <div className="bg-white p-4 rounded-lg shadow-md mt-6">
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