import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
// import msgpackParser from 'socket.io-msgpack-parser';

// Fix the Socket.IO URL - remove /api and ensure we connect to the base server
const SOCKET_URL = 'http://localhost:5000';

let socket = null;

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!socket) {
      console.log('🔌 Connecting to Socket.IO server at:', SOCKET_URL);
      socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        // parser: msgpackParser, // Temporarily disabled for debugging
        timeout: 20000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      socket.on('connect', () => {
        setIsConnected(true);
        console.log('✅ Connected to server with ID:', socket.id);
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
        console.log('❌ Disconnected from server');
      });

      socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
      });
    }

    return () => {
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
      }
    };
  }, []);

  const emit = useCallback((event, data) => {
    if (socket && socket.connected) {
      console.log('📤 Emitting event:', event, data);
      socket.emit(event, data);
    } else {
      console.warn('⚠️ Socket not connected, cannot emit:', event);
    }
  }, []);

  const forceReconnect = useCallback(() => {
    console.log('🔄 Force reconnecting socket...');
    if (socket) {
      socket.disconnect();
      socket.connect();
    }
  }, []);

  const on = useCallback((event, callback) => {
    if (socket) {
      socket.on(event, callback);
    }
  }, []);

  const off = useCallback((event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  }, []);

  return {
    socket,
    isConnected,
    emit,
    on,
    off,
    forceReconnect
  };
};

export default useSocket;
