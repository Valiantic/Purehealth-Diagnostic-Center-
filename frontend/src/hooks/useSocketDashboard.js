import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const useSocketDashboard = (refreshDataCallback) => {
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Initialize socket connection
  const initSocket = useCallback(() => {
    const serverUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    
    socketRef.current = io(serverUrl, {
      transports: ['websocket'],
      timeout: 30000,
      forceNew: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      autoConnect: true
    });

    // Connection event handlers
    socketRef.current.on('connect', () => {
      
      // Clear any reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    });

    socketRef.current.on('disconnect', (reason) => {
      
      // Only try to reconnect for server-side disconnects
      if (reason === 'io server disconnect' || reason === 'transport close' || reason === 'transport error') {
        reconnectTimeoutRef.current = setTimeout(() => {
          if (socketRef.current && !socketRef.current.connected) {
            socketRef.current.connect();
          }
        }, 2000);
      }
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    // Dashboard update handler
    socketRef.current.on('dashboard-update', (update) => {
      
      try {
        if (refreshDataCallback) {
          setTimeout(() => {
            switch (update.type) {
              case 'transaction-created':
                refreshDataCallback('monthly');
                refreshDataCallback('dailyIncome');
                break;
                
              case 'expense-created':
                refreshDataCallback('monthly');
                refreshDataCallback('expensesByDepartment');
                break;
                
              default:
                refreshDataCallback('all');
                break;
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Error handling dashboard update:', error);
      }
    });

    return socketRef.current;
  }, [refreshDataCallback]);

  // Cleanup socket connection
  const cleanupSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  // Manual emit for testing (optional)
  const emitTestUpdate = useCallback((type, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('test-update', { type, data });
    }
  }, []);

  // Get connection status
  const isConnected = socketRef.current?.connected || false;

  // Effect to manage socket lifecycle
  useEffect(() => {
    // Initialize socket connection
    initSocket();

    // Cleanup on unmount
    return cleanupSocket;
  }, [initSocket, cleanupSocket]);

  return {
    socket: socketRef.current,
    isConnected,
    emitTestUpdate,
    reconnect: initSocket,
    disconnect: cleanupSocket
  };
};

export default useSocketDashboard;
