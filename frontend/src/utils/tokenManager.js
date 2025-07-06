// Secure token management utility
class TokenManager {
  static getToken() {
    try {
      return localStorage.getItem('token');
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return null;
    }
  }

  static setToken(token) {
    try {
      localStorage.setItem('token', token);
    } catch (error) {
      console.error('Error setting token in localStorage:', error);
    }
  }

  static removeToken() {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    } catch (error) {
      console.error('Error removing token from localStorage:', error);
    }
  }

  static getRefreshToken() {
    try {
      return localStorage.getItem('refreshToken');
    } catch (error) {
      console.error('Error accessing refreshToken from localStorage:', error);
      return null;
    }
  }

  static setRefreshToken(token) {
    try {
      localStorage.setItem('refreshToken', token);
    } catch (error) {
      console.error('Error setting refreshToken in localStorage:', error);
    }
  }

  // Sanitize token before logging (for debugging)
  static sanitizeToken(token) {
    if (!token) return 'null';
    return token.length > 10 ? `${token.substring(0, 10)}...` : '***';
  }
}

export default TokenManager; 