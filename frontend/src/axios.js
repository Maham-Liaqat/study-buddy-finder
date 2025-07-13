import axios from 'axios';
import TokenManager from './utils/tokenManager';
import config from './config';

const API_URL = config.API_URL;

const instance = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 second timeout
  withCredentials: true, // Include cookies in requests
});

// Add a request interceptor to include the token in all requests
instance.interceptors.request.use(
  (config) => {
    const token = TokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor for error handling
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Try to refresh token
      const refreshToken = TokenManager.getRefreshToken && TokenManager.getRefreshToken();
      if (refreshToken) {
        try {
          const response = await axios.post(API_URL + '/api/auth/refresh', {
            refreshToken: refreshToken
          });
          
          const { token: newToken } = response.data;
          TokenManager.setToken(newToken);
          
          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return instance(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout user
          TokenManager.removeToken();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, redirect to login
        TokenManager.removeToken();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default instance;