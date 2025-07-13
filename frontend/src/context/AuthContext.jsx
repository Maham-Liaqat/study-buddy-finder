import React, { createContext, useState, useEffect } from 'react';
import axios from '../axios';
import TokenManager from '../utils/tokenManager';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(TokenManager.getToken());
  const [loading, setLoading] = useState(true);

  // Validate token on app initialization
  useEffect(() => {
    const validateToken = async () => {
      console.log('AuthContext: Starting token validation');
      const storedToken = TokenManager.getToken();
      if (!storedToken) {
        console.log('AuthContext: No token found');
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
        console.error('AuthContext: Token validation failed:', err.response?.data?.error || err.message);
        TokenManager.removeToken();
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
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        const storedToken = TokenManager.getToken();
        console.log('AuthContext: Storage changed, new token:', TokenManager.sanitizeToken(storedToken));
        setToken(storedToken);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = (newToken, refreshToken) => {
    console.log('AuthContext: Logging in with token:', TokenManager.sanitizeToken(newToken));
    TokenManager.setToken(newToken);
    if (refreshToken) {
      TokenManager.setRefreshToken(refreshToken);
    }
    setToken(newToken);
  };

  const logout = () => {
    console.log('AuthContext: Logging out');
    TokenManager.removeToken();
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};