import React, { createContext, useContext, useReducer } from 'react';

// Initial state
const initialState = {
  // Current monthly data
  monthlyRevenue: 0,
  monthlyExpenses: 0,
  netProfit: 0,
  transactionCount: 0,
  transactionComparison: null,
  
  // Previous month data for comparison
  previousMonthRevenue: 0,
  previousMonthExpenses: 0,
  previousNetProfit: 0,
  
  // Comparison indicators
  revenueComparison: {
    direction: 'neutral', // 'up', 'down', 'neutral'
    percentage: 0
  },
  expensesComparison: {
    direction: 'neutral',
    percentage: 0
  },
  netProfitComparison: {
    direction: 'neutral',
    percentage: 0
  },
  
  // Chart data
  dailyIncomeData: [],
  expensesByDepartment: [],
  monthlyProfitData: [],
  
  // Loading states
  loading: {
    monthlyData: true,
    dailyIncome: true,
    expensesByDepartment: true,
    monthlyProfit: true
  },
  
  // Error states
  errors: {
    monthlyData: null,
    dailyIncome: null,
    expensesByDepartment: null,
    monthlyProfit: null
  },
  
  // Current period
  currentMonth: new Date().getMonth() + 1,
  currentYear: new Date().getFullYear()
};

// Action types
const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_MONTHLY_DATA: 'SET_MONTHLY_DATA',
  SET_PREVIOUS_MONTH_DATA: 'SET_PREVIOUS_MONTH_DATA',
  SET_DAILY_INCOME_DATA: 'SET_DAILY_INCOME_DATA',
  SET_EXPENSES_BY_DEPARTMENT: 'SET_EXPENSES_BY_DEPARTMENT',
  SET_MONTHLY_PROFIT_DATA: 'SET_MONTHLY_PROFIT_DATA',
  SET_PERIOD: 'SET_PERIOD',
  CLEAR_ERRORS: 'CLEAR_ERRORS',
  UPDATE_COMPARISONS: 'UPDATE_COMPARISONS'
  ,SET_TRANSACTION_DATA: 'SET_TRANSACTION_DATA'
};

// Helper function to calculate comparison
const calculateComparison = (current, previous) => {
  if (previous === 0) {
    if (current > 0) return { direction: 'up', percentage: 100 };
    if (current < 0) return { direction: 'down', percentage: 100 };
    return { direction: 'neutral', percentage: 0 };
  }
  
  const percentageChange = ((current - previous) / Math.abs(previous)) * 100;
  
  if (percentageChange > 0) {
    return { direction: 'up', percentage: percentageChange };
  } else if (percentageChange < 0) {
    return { direction: 'down', percentage: Math.abs(percentageChange) };
  } else {
    return { direction: 'neutral', percentage: 0 };
  }
};

// Reducer function
const dashboardReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value
        }
      };
      
    case actionTypes.SET_ERROR:
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.key]: action.payload.error
        },
        loading: {
          ...state.loading,
          [action.payload.key]: false
        }
      };
      
    case actionTypes.SET_MONTHLY_DATA:
      return {
        ...state,
        monthlyRevenue: action.payload.monthlyRevenue,
        monthlyExpenses: action.payload.monthlyExpenses,
        netProfit: action.payload.netProfit,
        transactionCount: typeof action.payload.transactionCount === 'number' ? action.payload.transactionCount : 0,
        transactionComparison: action.payload.transactionComparison || null,
        loading: {
          ...state.loading,
          monthlyData: false
        },
        errors: {
          ...state.errors,
          monthlyData: null
        }
      };
    case actionTypes.SET_TRANSACTION_DATA:
      return {
        ...state,
        transactionCount: typeof action.payload.transactionCount === 'number' ? action.payload.transactionCount : 0,
        transactionComparison: action.payload.transactionComparison || null
      };
      
    case actionTypes.SET_PREVIOUS_MONTH_DATA:
      return {
        ...state,
        previousMonthRevenue: action.payload.monthlyRevenue,
        previousMonthExpenses: action.payload.monthlyExpenses,
        previousNetProfit: action.payload.netProfit
      };
      
    case actionTypes.UPDATE_COMPARISONS:
      return {
        ...state,
        revenueComparison: calculateComparison(state.monthlyRevenue, state.previousMonthRevenue),
        expensesComparison: calculateComparison(state.monthlyExpenses, state.previousMonthExpenses),
        netProfitComparison: calculateComparison(state.netProfit, state.previousNetProfit)
      };
      
    case actionTypes.SET_DAILY_INCOME_DATA:
      return {
        ...state,
        dailyIncomeData: action.payload,
        loading: {
          ...state.loading,
          dailyIncome: false
        },
        errors: {
          ...state.errors,
          dailyIncome: null
        }
      };
      
    case actionTypes.SET_EXPENSES_BY_DEPARTMENT:
      return {
        ...state,
        expensesByDepartment: action.payload,
        loading: {
          ...state.loading,
          expensesByDepartment: false
        },
        errors: {
          ...state.errors,
          expensesByDepartment: null
        }
      };
      
    case actionTypes.SET_MONTHLY_PROFIT_DATA:
      return {
        ...state,
        monthlyProfitData: action.payload,
        loading: {
          ...state.loading,
          monthlyProfit: false
        },
        errors: {
          ...state.errors,
          monthlyProfit: null
        }
      };
      
    case actionTypes.SET_PERIOD:
      return {
        ...state,
        currentMonth: action.payload.month,
        currentYear: action.payload.year
      };
      
    case actionTypes.CLEAR_ERRORS:
      return {
        ...state,
        errors: {
          monthlyData: null,
          dailyIncome: null,
          expensesByDepartment: null,
          monthlyProfit: null
        }
      };
      
    default:
      return state;
  }
};

// Create context
const DashboardContext = createContext();

// Dashboard provider component
export const DashboardProvider = ({ children }) => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  const value = {
    // State
    ...state,
    
    // Actions
    setLoading: (key, value) => dispatch({
      type: actionTypes.SET_LOADING,
      payload: { key, value }
    }),
    
    setError: (key, error) => dispatch({
      type: actionTypes.SET_ERROR,
      payload: { key, error }
    }),
    
    setMonthlyData: (data) => dispatch({
      type: actionTypes.SET_MONTHLY_DATA,
      payload: data
    }),
    
    setPreviousMonthData: (data) => dispatch({
      type: actionTypes.SET_PREVIOUS_MONTH_DATA,
      payload: data
    }),
    
    updateComparisons: () => dispatch({
      type: actionTypes.UPDATE_COMPARISONS
    }),
    
    setDailyIncomeData: (data) => dispatch({
      type: actionTypes.SET_DAILY_INCOME_DATA,
      payload: data
    }),
    
    setExpensesByDepartment: (data) => dispatch({
      type: actionTypes.SET_EXPENSES_BY_DEPARTMENT,
      payload: data
    }),
    
    setMonthlyProfitData: (data) => dispatch({
      type: actionTypes.SET_MONTHLY_PROFIT_DATA,
      payload: data
    }),
    
    setPeriod: (month, year) => dispatch({
      type: actionTypes.SET_PERIOD,
      payload: { month, year }
    }),
    
    clearErrors: () => dispatch({
      type: actionTypes.CLEAR_ERRORS
    })
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

// Custom hook to use dashboard context
export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboardContext must be used within a DashboardProvider');
  }
  return context;
};

export default DashboardContext;
