// Security utilities for XSS prevention and other security measures

// Escape HTML to prevent XSS
export const escapeHtml = (text) => {
  if (typeof text !== 'string') return text;
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

// Safe innerHTML alternative
export const setInnerHTML = (element, content) => {
  if (!element) return;
  
  // Use textContent for safe content insertion
  element.textContent = content;
};

// Validate and sanitize URLs
export const sanitizeUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  
  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return '';
    }
    return urlObj.toString();
  } catch {
    return '';
  }
};

// Prevent clickjacking by checking if the page is in an iframe
export const preventClickjacking = () => {
  if (window.self !== window.top) {
    // Page is in an iframe, redirect to top
    window.top.location = window.self.location;
  }
};

// Content Security Policy helper
export const getCSPNonce = () => {
  // Generate a nonce for inline scripts if needed
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Secure random string generator
export const generateSecureRandomString = (length = 32) => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Validate file uploads
export const validateFileUpload = (file, allowedTypes = [], maxSize = 5 * 1024 * 1024) => {
  if (!file) return { valid: false, error: 'No file provided' };
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File too large' };
  }
  
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type' };
  }
  
  return { valid: true };
};

// Secure logout function
export const secureLogout = () => {
  // Clear all storage
  localStorage.clear();
  sessionStorage.clear();
  
  // Clear cookies
  document.cookie.split(";").forEach((c) => {
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
  
  // Redirect to login
  window.location.href = '/login';
};

// Check if the app is running in a secure context
export const isSecureContext = () => {
  return window.isSecureContext || location.protocol === 'https:';
};

// Warn if not in secure context
export const checkSecureContext = () => {
  if (!isSecureContext()) {
    console.warn('Application is not running in a secure context. Some features may not work properly.');
  }
};
