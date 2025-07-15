import React, { useEffect, useState, useRef } from 'react';
import { BsTriangleFill } from 'react-icons/bs';
import { TbTriangleInvertedFilled } from 'react-icons/tb';
import { RxAvatar } from 'react-icons/rx';
import Chart from 'chart.js/auto';
import Sidebar from '../components/Sidebar';
import { Calendar } from 'lucide-react';
import useUserDisplay from '../hooks/useUserDisplay';
import useAuth  from '../hooks/useAuth';
import useDashboardMetrics from '../hooks/useDashboardMetrics';

const Dashboard = () => {
  // Use the custom auth hook - with isAuthenticating check
  const { user, isAuthenticating } = useAuth();
  
  // Get current month/year for dashboard metrics
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  
  // Use dashboard metrics hook
  const { metrics, loading: metricsLoading, error: metricsError, refetch } = useDashboardMetrics(currentMonth, currentYear);

  console.log('Dashboard state:', { 
    user: !!user, 
    isAuthenticating, 
    metricsLoading, 
    metricsError, 
    metrics 
  });

  // Debug: Force refetch when component mounts
  useEffect(() => {
    if (user && !metricsLoading) {
      console.log('🔄 Component mounted, attempting to refetch metrics...');
      setTimeout(() => {
        refetch();
      }, 1000);
    }
  }, [user]);

  const userDisplayData = useUserDisplay(user);

  // Tooltip visibility states
  const [showDailyIncomeTooltip, setShowDailyIncomeTooltip] = useState(false);
  const [showExpensesTooltip, setShowExpensesTooltip] = useState(false);
  const [showNetProfitTooltip, setShowNetProfitTooltip] = useState(false);
  
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

  // Initialize and render charts
  useEffect(() => {
    if (!user) return;
    
    // Destroy existing charts to prevent duplicates on re-render
    Object.values(chartInstancesRef.current).forEach(chart => {
      if (chart) chart.destroy();
    });
    
    // Daily Income Trend Line Chart
    if (dailyIncomeChartRef.current) {
      const dailyIncomeCtx = dailyIncomeChartRef.current.getContext('2d');
      chartInstancesRef.current.dailyIncome = new Chart(dailyIncomeCtx, {
        type: 'line',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat',],
          datasets: [{
            label: 'Daily Income',
            data: [2000, 7000, 4500, 3000, 9700, 4000],
            borderColor: '#02542D',
            backgroundColor: 'rgba(2, 84, 45, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              displayColors: false,
              callbacks: {
                label: function(context) {
                  return `Income: ${context.parsed.y}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 3000,
                font: {
                  size: 10
                }
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              }
            },
            x: {
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              }
            }
          }
        }
      });
    }
    
    // Monthly Expenses by Department Pie Chart
    if (expensesByDepartmentChartRef.current) {
      const expensesCtx = expensesByDepartmentChartRef.current.getContext('2d');
      chartInstancesRef.current.expensesByDepartment = new Chart(expensesCtx, {
        type: 'pie',
        data: {
          labels: ['Lab', 'UTZ', 'X-ray', 'ECG'],
          datasets: [{
            data: [45, 25, 15, 15],
            backgroundColor: [
              '#02542D',
              '#1C7847',
              '#4CAF50',
              '#8BC34A'
            ],
            borderWidth: 0,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.label}: ${context.parsed}%`;
                }
              }
            }
          }
        }
      });
    }
    
    // Monthly Net Profit Bar Chart
    if (monthlyNetProfitChartRef.current) {
      const profitCtx = monthlyNetProfitChartRef.current.getContext('2d');
      chartInstancesRef.current.monthlyNetProfit = new Chart(profitCtx, {
        type: 'bar',
        data: {
          labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
          datasets: [{
            label: 'Net Profit',
            data: [12000, 16000, 22000, 0, 0, 0],
            backgroundColor: [
              '#8BC34A',
              '#4CAF50',
              '#02542D',
              '#02542D',
              '#02542D',
              '#02542D'
            ],
            borderWidth: 0,
            borderRadius: 2,
            barThickness: 30
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `₱ ${context.parsed.y.toLocaleString()}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              },
              ticks: {
                callback: function(value) {
                  return value === 0 ? '0' : '';
                }
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          }
        }
      });
    }
    
    // Cleanup function to destroy charts when component unmounts
    return () => {
      Object.values(chartInstancesRef.current).forEach(chart => {
        if (chart) chart.destroy();
      });
    };
  }, [user]);

  // Return nothing while authenticating to prevent flash of protected content
  if (isAuthenticating) {
    console.log('🔐 Authenticating user...');
    return null;
  }

  // If user is null after authentication check, the hook will handle redirect
  if (!user) {
    console.log('❌ No user found, redirecting...');
    return null;
  }

  // Show loading state while fetching metrics
  if (metricsLoading) {
    console.log('📊 Loading dashboard metrics...');
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 overflow-auto p-6 pt-16 lg:pt-6 lg:ml-64">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading dashboard metrics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

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
                <BsTriangleFill className="w-4 h-4 sm:w-4 sm:h-4 md:w-6 md:h-6 text-green-600" />
                <h1 className="text-green-800 font-medium text-lg sm:text-xs md:text-2xl lg:text-3xl">
                  {metricsError ? '₱ 0' : formatCurrency(metrics.totalRevenue)}
                </h1>
              </div>
            </div>

            <div className="bg-white border-2 border-green-600 p-4 md:p-6 rounded-lg shadow-md flex flex-col items-start">
              {/* Total Expenses */}
              <h2 className="font-medium mb-2 sm:text-xs md:mb-4 text-green-800 text-sm md:text-lg lg:text-xl">Total Monthly Expenses</h2>
              <div className="flex items-center gap-2 md:gap-4">
                <TbTriangleInvertedFilled className="w-4 h-4  sm:w-4 sm:h-4 md:w-6 md:h-6 text-red-600" />
                <h1 className="text-green-800 font-medium text-lg sm:text-xs md:text-2xl lg:text-3xl">
                  {metricsError ? '₱ 0' : formatCurrency(metrics.totalExpenses)}
                </h1>
              </div>
            </div>

            <div className="bg-white border-2 border-green-600 p-4 md:p-6 rounded-lg shadow-md flex flex-col items-start sm:col-span-2 lg:col-span-1">
              {/* Net Profit */}
              <h2 className="font-medium mb-2 md:mb-4 text-green-800 text-sm md:text-lg lg:text-xl">Net Profit</h2>
              <div className="flex items-center gap-2 md:gap-4">
                <BsTriangleFill className={`w-4 h-4 sm:w-4 sm:h-4 md:w-6 md:h-6 ${metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                <h1 className="text-green-800 font-medium text-lg md:text-2xl lg:text-3xl">
                  {metricsError ? '₱ 0' : formatCurrency(metrics.netProfit)}
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

            <div className='bg-white border-2 border-green-600 p-3 rounded-lg shadow-md flex items-center justify-center gap-2 flex-1 lg:flex-none'>
              <Calendar className="w-4 h-4 md:w-6 sm:w-4 sm:h-4 md:h-6 text-green-700" /> 
              <span className="text-green-700 font-medium text-sm md:text-lg">
                {new Date(currentYear, currentMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          
          </div>

        </div>

        {/* Error Display */}
        {metricsError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center justify-between">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Unable to load dashboard metrics
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{metricsError}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={refetch}
                  className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}
              
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
              <canvas ref={dailyIncomeChartRef}></canvas>
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
                <canvas ref={expensesByDepartmentChartRef}></canvas>
              </div>
              <div className="w-full md:w-1/3 mt-4 md:mt-0">
                <div className="flex items-center mb-2">
                  <div className="w-6 h-3 bg-[#02542D] mr-2"></div>
                  <span className="text-xs">Laboratory</span>
                </div>
                <div className="flex items-center mb-2">
                  <div className="w-6 h-3 bg-[#1C7847] mr-2"></div>
                  <span className="text-xs">UTZ</span>
                </div>
                <div className="flex items-center mb-2">
                  <div className="w-6 h-3 bg-[#4CAF50] mr-2"></div>
                  <span className="text-xs">X-ray</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-3 bg-[#8BC34A] mr-2"></div>
                  <span className="text-xs">ECG</span>
                </div>
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
            <canvas ref={monthlyNetProfitChartRef}></canvas>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;