import { io } from 'socket.io-client';

const socket = io('http://localhost:5001', {
  withCredentials: true,
  transports: ['websocket', 'polling'], // Try WebSocket first, then fall back to polling
});

socket.on('connect', () => {
  console.log('Connected to Socket.IO server:', socket.id);
});

socket.on('connect_error', (err) => {
  console.error('Socket.IO connection error:', err.message);
});

export default socket;