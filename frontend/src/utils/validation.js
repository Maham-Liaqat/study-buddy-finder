// Frontend input validation and sanitization utility
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

export const validateName = (name) => {
  if (!name || typeof name !== 'string') return false;
  const sanitizedName = sanitizeInput(name);
  return sanitizedName.length >= 2 && sanitizedName.length <= 50;
};

export const validateUniversity = (university) => {
  if (!university || typeof university !== 'string') return false;
  const sanitizedUniversity = sanitizeInput(university);
  return sanitizedUniversity.length >= 2 && sanitizedUniversity.length <= 100;
};

export const validateBio = (bio) => {
  if (!bio) return true; // Bio is optional
  if (typeof bio !== 'string') return false;
  const sanitizedBio = sanitizeInput(bio);
  return sanitizedBio.length <= 500; // Max 500 characters
};

export const validateLocation = (location) => {
  if (!location) return true; // Location is optional
  if (typeof location !== 'string') return false;
  const sanitizedLocation = sanitizeInput(location);
  return sanitizedLocation.length <= 100;
};

export const validateMessage = (message) => {
  if (!message || typeof message !== 'string') return false;
  const sanitizedMessage = sanitizeInput(message);
  return sanitizedMessage.length >= 1 && sanitizedMessage.length <= 1000;
};

export const validateSubjects = (subjects) => {
  if (!Array.isArray(subjects)) return false;
  return subjects.every(subject => 
    subject && typeof subject === 'object' && 
    subject.name && typeof subject.name === 'string' &&
    sanitizeInput(subject.name).length <= 50
  );
};

export const validateAvailability = (availability) => {
  if (!Array.isArray(availability)) return false;
  const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  return availability.every(day => validDays.includes(day.toLowerCase()));
};

// Form validation helper
export const validateForm = (formData, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const value = formData[field];
    const rule = rules[field];
    
    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      errors[field] = `${field} is required`;
    } else if (value && rule.validator) {
      const isValid = rule.validator(value);
      if (!isValid) {
        errors[field] = rule.message || `${field} is invalid`;
      }
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}; 