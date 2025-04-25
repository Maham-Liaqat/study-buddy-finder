import React, { createContext, useState, useEffect } from 'react';
import axios from '../axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Validate token on app initialization
  useEffect(() => {
    const validateToken = async () => {
      console.log('AuthContext: Starting token validation');
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        console.log('AuthContext: No token found in localStorage');
        setToken(null);
        setLoading(false);
        return;
      }

      try {
        console.log('AuthContext: Validating token with /api/users/me');
        await axios.get('/api/users/me', {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        console.log('AuthContext: Token is valid');
        setToken(storedToken);
      } catch (err) {
        console.error('AuthContext: Token validation failed:', err.message);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setToken(null);
      } finally {
        console.log('AuthContext: Token validation complete');
        setLoading(false);
      }
    };

    validateToken();
  }, []);

  // Listen for storage changes (e.g., logout from another tab)
  useEffect(() => {
    const handleStorageChange = () => {
      const storedToken = localStorage.getItem('token');
      console.log('AuthContext: Storage changed, new token:', storedToken);
      setToken(storedToken);
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = (newToken, refreshToken) => {
    console.log('AuthContext: Logging in with token:', newToken);
    localStorage.setItem('token', newToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    setToken(newToken);
  };

  const logout = () => {
    console.log('AuthContext: Logging out');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};