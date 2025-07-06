// Environment configuration for Vite
const config = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5001',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001',
  NODE_ENV: import.meta.env.MODE || 'development',
};

export default config; 