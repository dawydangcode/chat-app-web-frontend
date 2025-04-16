// socket.js
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000'; // Địa chỉ backend của bạn
let socket = null;

export const connectSocket = (token) => {
  if (!token) {
    console.error('Token không hợp lệ, không thể kết nối Socket.IO');
    return;
  }

  socket = io(SOCKET_URL, {
    auth: {
      token: `Bearer ${token}`,
    },
    transports: ['websocket'], // Sử dụng WebSocket để đảm bảo realtime
  });

  socket.on('connect', () => {
    console.log('Đã kết nối tới Socket.IO server');
  });

  socket.on('error', (error) => {
    console.error('Socket.IO error:', error);
    if (error.message === 'Chưa xác thực!') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  });

  socket.on('disconnect', () => {
    console.log('Ngắt kết nối Socket.IO');
  });
};

export const getSocket = () => {
  if (!socket) {
    console.error('Socket chưa được khởi tạo. Vui lòng gọi connectSocket trước.');
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};