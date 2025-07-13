// Environment configuration for Vite
const config = {
  API_URL: "https://study-buddy-finder-hfwo.onrender.com", // updated to deployed backend
  SOCKET_URL: "https://study-buddy-finder-hfwo.onrender.com", // updated to deployed backend
  NODE_ENV: import.meta.env.MODE || 'development',
};

export default config; 