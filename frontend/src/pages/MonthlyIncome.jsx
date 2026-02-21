import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, CirclePlus } from 'lucide-react'
import Sidebar from '../components/dashboard/Sidebar'
import useAuth from '../hooks/auth/useAuth'
import usePermissions from '../hooks/auth/usePermissions'
import DailyIncomeBreakdownModal from '../components/transaction/DailyIncomeBreakdownModal';
import { collectibleIncomeAPI, monthlyIncomeAPI, monthlyExpenseAPI, userAPI, transactionAPI } from '../services/api';
import { toast, ToastContainer } from 'react-toastify';
import { exportMonthlyIncomeToExcel } from '../utils/monthlyIncomeExporter';
import { useQuery } from '@tanstack/react-query';
import 'react-toastify/dist/ReactToastify.css';

const Monthly = () => {
  const { user, isAuthenticating } = useAuth()
  const { hasPermission } = usePermissions()
  const navigate = useNavigate()

  // Monthly income state
  const [monthlyData, setMonthlyData] = useState({
    departments: [],
    dailyIncome: []
  });
  const [monthlySummary, setMonthlySummary] = useState({
    totalGross: 0,
    totalGCash: 0,
    totalCash: 0,
    departmentTotals: {},
    departments: []
  });
  const [dataLoading, setDataLoading] = useState(false);

  // Breakdown modal state
  const [breakdownData, setBreakdownData] = useState(null);
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);
  const [cachedReportData, setCachedReportData] = useState(null);
  const [breakdownLabels, setBreakdownLabels] = useState({ col1: '', col2: '', title: '' });

  // Current month/year state
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });

  const [currentMonth, setCurrentMonth] = useState('');

  // Admin user — needed for DailyIncomeBreakdownModal
  const { data: adminUser } = useQuery({
    queryKey: ['adminUser'],
    queryFn: async () => {
      try {
        const response = await userAPI.getAllUsers();
        const users = response.data?.users || response.data?.data || (Array.isArray(response.data) ? response.data : []);
        return users.find(u => u.role === 'admin');
      } catch (err) {
        return null;
      }
    },
    staleTime: Infinity,
    retry: false
  });

  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  useEffect(() => {
    setCurrentMonth(`${monthNames[currentDate.month - 1]}-${currentDate.year}`);
    fetchMonthlyIncomeData();
  }, [currentDate.month, currentDate.year]);

  const fetchMonthlyIncomeData = async () => {
    setDataLoading(true);
    try {
      // Get monthly income data
      const incomeResponse = await monthlyIncomeAPI.getMonthlyIncome(
        currentDate.month,
        currentDate.year
      );

      if (incomeResponse && incomeResponse.data && incomeResponse.data.success) {
        setMonthlyData(incomeResponse.data.data);
      } else {
        toast.error('Failed to fetch monthly income data');
        setMonthlyData({ departments: [], dailyIncome: [] });
      }

      // Get summary data
      const summaryResponse = await monthlyIncomeAPI.getMonthlyIncomeSummary(
        currentDate.month,
        currentDate.year
      );

      if (summaryResponse && summaryResponse.data && summaryResponse.data.success) {
        setMonthlySummary(summaryResponse.data.data);
      } else {
        toast.error('Failed to fetch monthly summary data');
        setMonthlySummary({
          totalGross: 0,
          totalGCash: 0,
          totalCash: 0,
          departmentTotals: {},
          departments: []
        });
      }
    } catch (error) {
      console.error('Error fetching monthly data:', error);
      toast.error(`Error: ${error.message || 'Failed to load monthly data'}`);
    } finally {
      setDataLoading(false);
    }
  };

  const handleAddIncome = () => navigate('/add-transaction');

  const handlePrevMonth = () => {
    setCurrentDate(prev => ({
      month: prev.month === 1 ? 12 : prev.month - 1,
      year: prev.month === 1 ? prev.year - 1 : prev.year,
    }));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => ({
      month: prev.month === 12 ? 1 : prev.month + 1,
      year: prev.month === 12 ? prev.year + 1 : prev.year,
    }));
  };

  const handleGenerateReport = async () => {
    try {
      // Get all collectibles for the current month (not paginated)
      const response = await collectibleIncomeAPI.getAllCollectibleIncome();
      let allCollectibles = [];

      if (response && response.data && response.data.success) {
        const allData = response.data.data || [];
        allCollectibles = allData.filter(item => {
          const itemDate = new Date(item.dateConducted);
          return itemDate.getMonth() + 1 === currentDate.month &&
            itemDate.getFullYear() === currentDate.year;
        });
      }

      // Fetch profit & loss data for current and previous month
      const profitLossData = await fetchProfitLossData();

      if (!profitLossData) {
        toast.error('Failed to fetch report data');
        return;
      }

      // Fetch all transactions for the month for the export detail
      // Using a high limit to get all transactions for the month
      const transResponse = await transactionAPI.getAllTransactions({
        month: currentDate.month,
        year: currentDate.year,
        limit: 2000
      });
      const allTransactions = transResponse?.data?.data?.transactions || transResponse?.data?.transactions || [];

      setCachedReportData({ allCollectibles, profitLossData, allTransactions });

      // Prepare Labels
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const prevMonthIdx = currentDate.month === 1 ? 11 : currentDate.month - 2;
      const currMonthIdx = currentDate.month - 1;

      const prevMonthName = monthNames[prevMonthIdx];
      const currMonthName = monthNames[currMonthIdx];
      const prevLabel = `${prevMonthName} (Previous)`;
      const currLabel = `${currMonthName} (Current)`;

      setBreakdownLabels({
        col1: prevLabel,
        col2: currLabel,
        title: 'Monthly Income Report'
      });

      // Prepare Breakdown Data
      const breakdown = {
        departmentRevenues: profitLossData.revenue.departments.map(d => ({
          departmentName: d.name,
          yesterday: d.previousMonth,
          today: d.currentMonth
        })),
        departmentExpenses: profitLossData.expenses.categories.map(e => ({
          departmentName: e.name,
          yesterday: e.previousMonth,
          today: e.currentMonth
        })),
        additionalIncome: {
          yesterday: profitLossData.revenue.additionalIncome.previousMonth,
          today: profitLossData.revenue.additionalIncome.currentMonth
        },
        gcashIncome: {
          yesterday: profitLossData.revenue.gCashIncome.previousMonth,
          today: profitLossData.revenue.gCashIncome.currentMonth
        },
        transactions: [], // No individual transactions for monthly view
        totals: {
          revenue: { yesterday: profitLossData.revenue.total.previousMonth, today: profitLossData.revenue.total.currentMonth },
          expenses: { yesterday: profitLossData.expenses.total.previousMonth, today: profitLossData.expenses.total.currentMonth },
        }
      };

      setBreakdownData(breakdown);
      setIsBreakdownModalOpen(true);

    } catch (error) {
      console.error('Error preparing report:', error);
      toast.error('Failed to prepare report data.');
    }
  };

  const handleModalExport = async () => {
    try {
      if (!cachedReportData) return;
      await exportMonthlyIncomeToExcel(
        monthlyData,
        monthlySummary,
        cachedReportData.allCollectibles,
        currentMonth,
        cachedReportData.profitLossData,
        cachedReportData.allTransactions
      );
      toast.success('Monthly Income Report exported successfully!');
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Failed to export report.');
    }
  };

  const fetchProfitLossData = async () => {
    try {
      const currentMonth = currentDate.month;
      const currentYear = currentDate.year;

      // Calculate previous month
      let previousMonth = currentMonth - 1;
      let previousYear = currentYear;
      if (previousMonth === 0) {
        previousMonth = 12;
        previousYear = currentYear - 1;
      }

      // Month names for display
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];


      // Fetch current month data
      const currentIncomeResponse = await monthlyIncomeAPI.getMonthlyIncomeSummary(currentMonth, currentYear);
      const currentExpenseResponse = await monthlyExpenseAPI.getMonthlyExpenses(currentMonth, currentYear);

      // Fetch previous month data
      const previousIncomeResponse = await monthlyIncomeAPI.getMonthlyIncomeSummary(previousMonth, previousYear);
      const previousExpenseResponse = await monthlyExpenseAPI.getMonthlyExpenses(previousMonth, previousYear);

      // Get collectible income for both months
      const collectiblesResponse = await collectibleIncomeAPI.getAllCollectibleIncome();
      let currentCollectibleTotal = 0;
      let previousCollectibleTotal = 0;

      if (collectiblesResponse && collectiblesResponse.data && collectiblesResponse.data.success) {
        const allCollectibles = collectiblesResponse.data.data || [];

        // Current month collectibles
        const currentMonthCollectibles = allCollectibles.filter(item => {
          const itemDate = new Date(item.dateConducted);
          return itemDate.getMonth() + 1 === currentMonth && itemDate.getFullYear() === currentYear;
        });
        currentCollectibleTotal = currentMonthCollectibles.reduce((sum, item) => sum + parseFloat(item.totalIncome || 0), 0);

        // Previous month collectibles
        const previousMonthCollectibles = allCollectibles.filter(item => {
          const itemDate = new Date(item.dateConducted);
          return itemDate.getMonth() + 1 === previousMonth && itemDate.getFullYear() === previousYear;
        });
        previousCollectibleTotal = previousMonthCollectibles.reduce((sum, item) => sum + parseFloat(item.totalIncome || 0), 0);
      }


      // Extract department totals and GCash from summary responses
      const currentDepartmentTotals = currentIncomeResponse.data?.data?.departmentTotals || {};
      const previousDepartmentTotals = previousIncomeResponse.data?.data?.departmentTotals || {};
      const currentTotalGCash = currentIncomeResponse.data?.data?.totalGCash || 0;
      const previousTotalGCash = previousIncomeResponse.data?.data?.totalGCash || 0;
      const departments = currentIncomeResponse.data?.data?.departments || [];


      // Prepare department revenue data
      const departmentRevenueData = [];
      const allDepartmentIds = new Set([
        ...Object.keys(currentDepartmentTotals),
        ...Object.keys(previousDepartmentTotals)
      ]);

      allDepartmentIds.forEach(deptId => {
        const dept = departments.find(d => d.departmentId === parseInt(deptId));
        const deptName = dept?.departmentName || 'Unknown';

        departmentRevenueData.push({
          name: deptName,
          previousMonth: parseFloat(previousDepartmentTotals[deptId] || 0),
          currentMonth: parseFloat(currentDepartmentTotals[deptId] || 0)
        });
      });

      // Calculate total revenue (including GCash)
      const currentTotalRevenue = departmentRevenueData.reduce((sum, dept) => sum + dept.currentMonth, 0) + currentCollectibleTotal + currentTotalGCash;
      const previousTotalRevenue = departmentRevenueData.reduce((sum, dept) => sum + dept.previousMonth, 0) + previousCollectibleTotal + previousTotalGCash;

      // Process current month expenses - extract from API response
      const currentExpenses = currentExpenseResponse.data?.data?.dailyExpenses || [];
      const currentExpenseCategories = {};

      currentExpenses.forEach(dailyExpense => {
        Object.values(dailyExpense.departments || {}).forEach(dept => {
          (dept.items || []).forEach(item => {
            const category = item.categoryName || 'Other Expenses';
            currentExpenseCategories[category] = (currentExpenseCategories[category] || 0) + parseFloat(item.amount || 0);
          });
        });
      });

      // Process previous month expenses
      const previousExpenses = previousExpenseResponse.data?.data?.dailyExpenses || [];
      const previousExpenseCategories = {};

      previousExpenses.forEach(dailyExpense => {
        Object.values(dailyExpense.departments || {}).forEach(dept => {
          (dept.items || []).forEach(item => {
            const category = item.categoryName || 'Other Expenses';
            previousExpenseCategories[category] = (previousExpenseCategories[category] || 0) + parseFloat(item.amount || 0);
          });
        });
      });

      // Prepare expense categories data
      const allExpenseCategories = new Set([
        ...Object.keys(currentExpenseCategories),
        ...Object.keys(previousExpenseCategories)
      ]);

      const expenseCategoriesData = [];
      allExpenseCategories.forEach(category => {
        expenseCategoriesData.push({
          name: category,
          previousMonth: previousExpenseCategories[category] || 0,
          currentMonth: currentExpenseCategories[category] || 0
        });
      });


      // Calculate total expenses
      const currentTotalExpenses = Object.values(currentExpenseCategories).reduce((sum, val) => sum + val, 0);
      const previousTotalExpenses = Object.values(previousExpenseCategories).reduce((sum, val) => sum + val, 0);


      // Calculate income before tax
      const currentIncomeBeforeTax = currentTotalRevenue - currentTotalExpenses;
      const previousIncomeBeforeTax = previousTotalRevenue - previousTotalExpenses;

      // Calculate income tax (12%)
      const currentIncomeTax = currentIncomeBeforeTax * 0.12;
      const previousIncomeTax = previousIncomeBeforeTax * 0.12;

      // Calculate net profit
      const currentNetProfit = currentIncomeBeforeTax - currentIncomeTax;
      const previousNetProfit = previousIncomeBeforeTax - previousIncomeTax;

      // Format date for display
      const today = new Date();
      const formattedDate = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

      return {
        date: formattedDate,
        previousMonth: `${monthNames[previousMonth - 1]}\nprevious month`,
        currentMonth: `${monthNames[currentMonth - 1]}\ncurrent month`,
        revenue: {
          departments: departmentRevenueData,
          additionalIncome: {
            previousMonth: previousCollectibleTotal,
            currentMonth: currentCollectibleTotal
          },
          gCashIncome: {
            previousMonth: previousTotalGCash,
            currentMonth: currentTotalGCash
          },
          total: {
            previousMonth: previousTotalRevenue,
            currentMonth: currentTotalRevenue
          }
        },
        expenses: {
          categories: expenseCategoriesData,
          total: {
            previousMonth: previousTotalExpenses,
            currentMonth: currentTotalExpenses
          }
        },
        incomeBeforeTax: {
          previousMonth: previousIncomeBeforeTax,
          currentMonth: currentIncomeBeforeTax
        },
        incomeTax: {
          previousMonth: previousIncomeTax,
          currentMonth: currentIncomeTax
        },
        netProfit: {
          previousMonth: previousNetProfit,
          currentMonth: currentNetProfit
        }
      };
    } catch (error) {
      console.error('Error fetching profit & loss data:', error);
      return null;
    }
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

  if (isAuthenticating) {
    return null;
  }

  if (!user) {
    return null;
  }

  // Get the number of days in the current month
  const daysInMonth = new Date(currentDate.year, currentDate.month, 0).getDate();

  return (
    <div className="flex flex-col md:flex-row h-screen bg-cream-50">

      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      {/* Sidebar */}
      <div className="md:sticky md:top-0 md:h-screen z-10">
        <Sidebar />
      </div>

      {/* Main content area with improved spacing */}
      <div className="flex-1 overflow-auto p-4 pt-16 lg:pt-6 lg:ml-64">

        <div className="bg-cream-50 border-green-800 rounded">

          {/* No navigation button needed — use the sidebar Monthly dropdown */}

          {/* Month navigation - improved to match design */}
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

          {/* Monthly Income Table */}
          <div className="p-2">
            <div className="bg-green-800 text-white p-2 font-semibold rounded-t flex justify-between items-center">
              Monthly Income
              <button onClick={handleAddIncome} className="bg-green-700 text-white rounded-full w-6 h-6 flex items-center justify-center">
                <CirclePlus />
              </button>
            </div>
            <div className="border border-green-800 rounded-b">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-green-800 bg-green-100">
                      <th className="p-1 border-r border-green-800 text-sm font-medium text-center uppercase tracking-wide">Day</th>
                      <th className="p-1 border-r border-green-800 text-sm font-medium text-right uppercase tracking-wide">Gross</th>
                      {monthlyData.departments.map(dept => (
                        <th key={dept.id} className="p-1 border-r border-green-800 text-sm font-medium text-right uppercase tracking-wide">
                          {dept.name}
                        </th>
                      ))}
                      <th className="p-1 border-r border-green-800 text-sm font-medium text-right uppercase tracking-wide">GCash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataLoading ? (
                      <tr>
                        <td colSpan={monthlyData.departments.length + 4} className="p-2 text-center bg-white">
                          Loading data...
                        </td>
                      </tr>
                    ) : monthlyData.dailyIncome.length > 0 ? (
                      monthlyData.dailyIncome.map((day) => (
                        <tr key={day.date} className="border-b border-green-100">
                          <td className="p-2 border-r border-green-200 text-center bg-white">{formatDate(day.date)}</td>
                          <td className="p-2 border-r border-green-200 text-right bg-white">{formatCurrency(day.grossAmount)}</td>
                          {monthlyData.departments.map(dept => (
                            <td key={`${day.date}-${dept.id}`} className="p-2 border-r border-green-200 text-right bg-white">
                              {formatCurrency(day.departments[dept.id])}
                            </td>
                          ))}
                          <td className="p-2 border-r border-green-200 text-right bg-white">{formatCurrency(day.gCashAmount)}</td>

                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={monthlyData.departments.length + 4} className="p-2 text-center text-gray-500 bg-white">
                          No income data available for this month
                        </td>
                      </tr>
                    )}

                    {/* Empty rows to fill space if needed */}
                    {!dataLoading && monthlyData.dailyIncome.length < 10 &&
                      [...Array(10 - monthlyData.dailyIncome.length)].map((_, index) => (
                        <tr key={`empty-row-${index}`} className="border-b border-green-100">
                          <td className="p-2 border-r border-green-200 bg-white"></td>
                          <td className="p-2 border-r border-green-200 bg-white"></td>
                          {monthlyData.departments.map(dept => (
                            <td key={`empty-${index}-${dept.id}`} className="p-2 border-r border-green-200 bg-white"></td>
                          ))}
                          <td className="p-2 border-r border-green-200 bg-white"></td>
                        </tr>
                      ))
                    }
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-green-800 bg-green-100 font-bold">
                      <td className="p-1 border-r border-green-800 text-center">TOTAL:</td>
                      <td className="p-1 border-r border-green-800 text-right">{formatCurrency(monthlySummary.totalGross)}</td>
                      {monthlyData.departments.map(dept => (
                        <td key={`total-${dept.id}`} className="p-1 border-r border-green-800 text-right">
                          {formatCurrency(monthlySummary.departmentTotals[dept.id])}
                        </td>
                      ))}
                      <td className="p-1 border-r border-green-800 text-right">{formatCurrency(monthlySummary.totalGCash)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Generate Report Button */}
          {(monthlyData.dailyIncome.length > 0) && hasPermission('transactions.export') && (
            <div className="flex justify-end p-2">
              <button
                onClick={handleGenerateReport}
                className="bg-green-800 text-white px-4 py-2 rounded flex items-center hover:bg-green-600"
              >
                Show Breakdown
              </button>
            </div>
          )}
        </div>
      </div>

      <DailyIncomeBreakdownModal
        isOpen={isBreakdownModalOpen}
        onClose={() => setIsBreakdownModalOpen(false)}
        breakdownData={breakdownData}
        selectedDate={new Date(currentDate.year, currentDate.month - 1, 1)}
        user={user}
        adminUser={adminUser}
        labels={breakdownLabels}
        onGenerateExternal={handleModalExport}
      />
    </div>
  )
}

export default Monthly
