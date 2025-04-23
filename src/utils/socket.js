// src/utils/socket.js
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000';
let sockets = {};

export const initializeSocket = (token, namespace = '') => {
  const key = namespace || 'default';
  if (sockets[key]) {
    return sockets[key];
  }

  sockets[key] = io(`${SOCKET_URL}${namespace}`, {
    auth: {
      token: `Bearer ${token}`,
    },
    transports: ['websocket'],
  });

  sockets[key].on('connect', () => {
    console.log(`Connected to Socket.IO server (${namespace})`);
  });

  sockets[key].on('connect_error', (error) => {
    console.error(`Socket connection error (${namespace}):`, error);
  });

  sockets[key].on('disconnect', () => {
    console.log(`Disconnected from Socket.IO server (${namespace})`);
  });

  return sockets[key];
};

export const getSocket = (namespace = '') => {
  const key = namespace || 'default';
  if (!sockets[key]) {
    throw new Error(`Socket for namespace ${namespace} not initialized.`);
  }
  return sockets[key];
};

export const disconnectSocket = (namespace = '') => {
  const key = namespace || 'default';
  if (sockets[key]) {
    sockets[key].disconnect();
    delete sockets[key];
    console.log(`Socket disconnected (${namespace})`);
  }
};

export const disconnectAllSockets = () => {
  Object.keys(sockets).forEach((key) => {
    sockets[key].disconnect();
    delete sockets[key];
  });
  console.log('All sockets disconnected');
};