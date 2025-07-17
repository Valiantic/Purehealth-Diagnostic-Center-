import { useEffect, useCallback, useRef } from 'react';
import { useDashboardContext } from '../contexts/DashboardContext';
import { dashboardAPI } from '../services/api';

const useDashboardData = () => {
  const {
    currentMonth,
    currentYear,
    setLoading,
    setError,
    setMonthlyData,
    setPreviousMonthData,
    updateComparisons,
    setDailyIncomeData,
    setExpensesByDepartment,
    setMonthlyProfitData,
    monthlyRevenue,
    monthlyExpenses,
    netProfit,
    dailyIncomeData,
    expensesByDepartment,
    monthlyProfitData,
    loading,
    errors,
    revenueComparison,
    expensesComparison,
    netProfitComparison
  } = useDashboardContext();

  const abortControllerRef = useRef(null);
  const refreshTimeoutRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const lastFetchedPeriodRef = useRef({ month: null, year: null });

  // Fetch monthly summary data
  const fetchMonthlyData = useCallback(async () => {
    try {
      setLoading('monthlyData', true);
      
      // Fetch current month data
      const response = await dashboardAPI.getMonthlyData(currentMonth, currentYear);
      
      if (response.data.success) {
        setMonthlyData(response.data.data);
        
        // Fetch previous month data for comparison
        const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        
        try {
          const previousResponse = await dashboardAPI.getMonthlyData(previousMonth, previousYear);
          if (previousResponse.data.success) {
            setPreviousMonthData(previousResponse.data.data);
            // Trigger comparison calculation
            setTimeout(() => updateComparisons(), 100);
          }
        } catch (prevError) {
          console.warn('Could not fetch previous month data for comparison:', prevError);
          setPreviousMonthData({ monthlyRevenue: 0, monthlyExpenses: 0, netProfit: 0 });
        }
      } else {
        throw new Error(response.data.message || 'Failed to fetch monthly data');
      }
    } catch (error) {
      if (error.name !== 'CanceledError') {
        console.error('Error fetching monthly data:', error);
        setError('monthlyData', error.message);
      }
    }
  }, [currentMonth, currentYear, setLoading, setError, setMonthlyData, setPreviousMonthData, updateComparisons]);

  // Fetch daily income data
  const fetchDailyIncomeData = useCallback(async () => {
    try {
      setLoading('dailyIncome', true);
      const response = await dashboardAPI.getDailyIncome(currentMonth, currentYear);
      
      if (response.data.success) {
        setDailyIncomeData(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch daily income data');
      }
    } catch (error) {
      if (error.name !== 'CanceledError') {
        console.error('Error fetching daily income data:', error);
        setError('dailyIncome', error.message);
      }
    }
  }, [currentMonth, currentYear, setLoading, setError, setDailyIncomeData]);

  // Fetch expenses by department
  const fetchExpensesByDepartment = useCallback(async () => {
    try {
      setLoading('expensesByDepartment', true);
      const response = await dashboardAPI.getExpensesByDepartment(currentMonth, currentYear);
            
      if (response.data.success) {
        setExpensesByDepartment(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch expenses by department');
      }
    } catch (error) {
      if (error.name !== 'CanceledError') {
        console.error('Error fetching expenses by department:', error);
        setError('expensesByDepartment', error.message);
      }
    }
  }, [currentMonth, currentYear, setLoading, setError, setExpensesByDepartment]);

  // Fetch monthly profit data
  const fetchMonthlyProfitData = useCallback(async () => {
    try {
      setLoading('monthlyProfit', true);
      const response = await dashboardAPI.getMonthlyProfit(currentYear);
      
      if (response.data.success) {
        setMonthlyProfitData(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch monthly profit data');
      }
    } catch (error) {
      if (error.name !== 'CanceledError') {
        console.error('Error fetching monthly profit data:', error);
        setError('monthlyProfit', error.message);
      }
    }
  }, [currentYear, setLoading, setError, setMonthlyProfitData]);

  // Fetch all dashboard data with proper sequencing
  const fetchAllData = useCallback(async () => {
    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      await fetchMonthlyData();
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
      
      await fetchDailyIncomeData();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await fetchExpensesByDepartment();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await fetchMonthlyProfitData();
      
    } catch (error) {
      if (error.name !== 'CanceledError') {
        console.error('Error fetching dashboard data:', error);
      }
    }
  }, [fetchMonthlyData, fetchDailyIncomeData, fetchExpensesByDepartment, fetchMonthlyProfitData]);

  // Debounced refresh function to prevent rapid successive calls
  const refreshData = useCallback((dataType) => {
    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Set a new timeout
    refreshTimeoutRef.current = setTimeout(() => {
      switch (dataType) {
        case 'monthly':
          fetchMonthlyData();
          break;
        case 'dailyIncome':
          fetchDailyIncomeData();``
          break;
        case 'expensesByDepartment':
          fetchExpensesByDepartment();
          break;
        case 'monthlyProfit':
          fetchMonthlyProfitData();
          break;
        case 'all':
        default:
          fetchAllData();
          break;
      }
    }, 500); // 500ms debounce
  }, [fetchMonthlyData, fetchDailyIncomeData, fetchExpensesByDepartment, fetchMonthlyProfitData, fetchAllData]);

  // Initial data fetch and period change handling with debounce
  useEffect(() => {
    const lastFetched = lastFetchedPeriodRef.current;
    const shouldFetch = isInitialLoadRef.current || 
                       lastFetched.month !== currentMonth || 
                       lastFetched.year !== currentYear;

    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      lastFetchedPeriodRef.current = { month: currentMonth, year: currentYear };
      fetchAllData();
    } else {
      // Debounce the API calls to prevent rapid successive requests
      refreshTimeoutRef.current = setTimeout(() => {
        lastFetchedPeriodRef.current = { month: currentMonth, year: currentYear };
        fetchAllData();
      }, 300); // 300ms debounce
    }

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [currentMonth, currentYear]); // Only depend on the actual values, not the function

  // Computed values
  const isLoading = Object.values(loading).some(Boolean);
  const hasErrors = Object.values(errors).some(Boolean);

  return {
    // Data
    monthlyRevenue,
    monthlyExpenses,
    netProfit,
    dailyIncomeData,
    expensesByDepartment,
    monthlyProfitData,
    
    // Comparison data
    revenueComparison,
    expensesComparison,
    netProfitComparison,
    
    // States
    loading,
    errors,
    isLoading,
    hasErrors,
    
    // Actions
    refreshData,
    fetchAllData,
    
    // Period
    currentMonth,
    currentYear
  };
};

export default useDashboardData;
