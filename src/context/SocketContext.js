import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const auth = useAuth();
  const user = auth ? auth.user : null;
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user?.userId) {
      console.log('[SOCKET_CONTEXT] No userId, disconnecting socket');
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    console.log('[SOCKET_CONTEXT] Initializing socket', { userId: user.userId });

    const newSocket = io('http://localhost:3000', {
      query: { userId: user.userId },
      auth: { token: localStorage.getItem('token') },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('[SOCKET_CONTEXT] Socket connected:', newSocket.id);
    });

    newSocket.on('connect_error', (error) => {
      console.error('[SOCKET_CONTEXT] Connect error:', error.message);
    });

    newSocket.on('error', (error) => {
      console.error('[SOCKET_CONTEXT] Socket error:', error.message);
    });

    setSocket(newSocket);

    return () => {
      console.log('[SOCKET_CONTEXT] Disconnecting socket');
      newSocket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);