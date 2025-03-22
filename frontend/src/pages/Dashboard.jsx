import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Chart from 'chart.js/auto';
import Sidebar from '../components/Sidebar';
import Income from '../assets/icons/profits.png';
import Expense from '../assets/icons/expense.png';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
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

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    
    try {
      setUser(JSON.parse(userData));
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('user');
      navigate('/login');
    }
  }, [navigate]);

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

  if (!user) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      
      <div className="flex-1 overflow-auto p-6 pt-16 lg:pt-6 lg:ml-64">
        {/* Header Section */}
        <div className="bg-[#02542D] p-6 rounded-lg shadow-md flex justify-around items-center space-x-8 mb-6">
          {/* Total Income */}
          <div className="flex flex-col items-start">
            <h2 className="font-bold mb-4 text-white sm:text-xs md:text-2xl">Total Monthly Income</h2>
            <div className="flex items-center gap-4">
              <img src={Income} className="w-12 h-12" alt="Income Icon" />
              <h1 className="text-white font-bold sm:text-xs md:text-4xl">₱ 25,000</h1>
            </div>
          </div>

          {/* Total Expenses */}
          <div className="flex flex-col items-start">
            <h2 className="font-bold mb-4 text-white sm:text-xs md:text-2xl">Total Monthly Expenses</h2>
            <div className="flex items-center gap-4">
              <img src={Expense} className="w-12 h-12" alt="Expense Icon" />
              <h1 className="text-white font-bold sm:text-xs md:text-4xl">₱ 3,000</h1>
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
                    <p>This chart displays your daily income over the past days. It helps you identify patterns in revenue generation and track day-to-day financial performance.</p>
                  </div>
                )}
              </div>
            </div>
            <div className="h-48">
              <canvas ref={dailyIncomeChartRef}></canvas>
            </div>
          </div>
          
          {/* Monthly Expenses by Department Chart */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-gray-700">Monthly Expenses by Department</h3>
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
                  <p>This bar chart shows your net profit for the last 6 months. Use this data to analyze profit trends, identify seasonal variations, and track overall financial performance.</p>
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