import { io } from 'socket.io-client';
import TokenManager from './utils/tokenManager';
import config from './config';

let socket = null;

const createSocket = () => {
  const token = TokenManager.getToken();
  
  if (!token) {
    console.warn('No token available for Socket.IO connection');
    return null;
  }

  socket = io(config.SOCKET_URL, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    auth: {
      token: token
    },
    query: {
      token: token
    }
  });

  socket.on('connect', () => {
    console.log('Connected to Socket.IO server:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.error('Socket.IO connection error:', err.message);
    if (err.message.includes('Authentication error')) {
      console.log('Authentication failed, redirecting to login');
      TokenManager.removeToken();
      window.location.href = '/login';
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket.IO disconnected:', reason);
    if (reason === 'io server disconnect') {
      // Server disconnected, try to reconnect
      socket.connect();
    }
  });

  return socket;
};

const getSocket = () => {
  if (!socket || !socket.connected) {
    return createSocket();
  }
  return socket;
};

const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export { getSocket, disconnectSocket };
export default getSocket;