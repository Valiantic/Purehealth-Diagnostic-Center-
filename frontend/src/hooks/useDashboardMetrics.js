import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';

export const useDashboardMetrics = (month = null, year = null) => {
  const { isConnected, emit, on, off } = useSocket();
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionTimeout, setConnectionTimeout] = useState(null);

  const fetchMetrics = useCallback(() => {
    if (isConnected) {
      console.log('📊 Fetching dashboard metrics via Socket.IO for:', { month, year });
      setLoading(true);
      setError(null);
      emit('getDashboardMetrics', { month, year });
    } else {
      console.log('⏳ Waiting for socket connection to fetch metrics...');
    }
  }, [isConnected, emit, month, year]);

  const requestUpdate = useCallback(() => {
    if (isConnected) {
      emit('requestMetricsUpdate', { month, year });
    }
  }, [isConnected, emit, month, year]);

  useEffect(() => {
    const handleMetrics = (data) => {
      console.log('📈 Received dashboard metrics:', data);
      setMetrics(data);
      setLoading(false);
      setError(null);
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        setConnectionTimeout(null);
      }
    };

    const handleMetricsUpdate = (data) => {
      console.log('🔄 Received metrics update:', data);
      // Only update if it's for the same month/year we're viewing
      if (
        (!month || data.month === month) && 
        (!year || data.year === year)
      ) {
        setMetrics(data);
      }
    };

    const handleError = (errorData) => {
      console.error('❌ Dashboard metrics error:', errorData);
      setError(errorData.message);
      setLoading(false);
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        setConnectionTimeout(null);
      }
    };

    if (isConnected) {
      on('dashboardMetrics', handleMetrics);
      on('dashboardMetricsUpdate', handleMetricsUpdate);
      on('dashboardError', handleError);
      
      // Fetch initial metrics
      fetchMetrics();

      // Set timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        console.warn('⚠️ Dashboard metrics request timed out');
        setError('Failed to load dashboard metrics: Request timed out');
        setLoading(false);
      }, 10000); // 10 seconds timeout
      
      setConnectionTimeout(timeout);
    } else {
      // If not connected after 5 seconds, show error
      const timeout = setTimeout(() => {
        if (!isConnected) {
          console.warn('⚠️ Socket connection timed out');
          setError('Failed to connect to server');
          setLoading(false);
        }
      }, 5000);
      setConnectionTimeout(timeout);
    }

    return () => {
      off('dashboardMetrics', handleMetrics);
      off('dashboardMetricsUpdate', handleMetricsUpdate);
      off('dashboardError', handleError);
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
      }
    };
  }, [isConnected, on, off, fetchMetrics, month, year]);

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics,
    requestUpdate
  };
};

export default useDashboardMetrics;
