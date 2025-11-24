/**
 * CRITICAL FIX: Input type validation utilities
 * Validates and sanitizes input types before use
 */

/**
 * Safely parse integer with validation
 */
export const safeParseInt = (value, defaultValue = 0, min = -Infinity, max = Infinity) => {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  
  const parsed = parseInt(value, 10);
  
  if (isNaN(parsed)) {
    return defaultValue;
  }
  
  return Math.max(min, Math.min(max, parsed));
};

/**
 * Safely parse float with validation
 */
export const safeParseFloat = (value, defaultValue = 0, min = -Infinity, max = Infinity) => {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  
  const parsed = parseFloat(value);
  
  if (isNaN(parsed)) {
    return defaultValue;
  }
  
  return Math.max(min, Math.min(max, parsed));
};

/**
 * Safely parse boolean
 */
export const safeParseBoolean = (value, defaultValue = false) => {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  
  if (typeof value === 'boolean') {
    return value;
  }
  
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return lower === 'true' || lower === '1' || lower === 'yes';
  }
  
  return defaultValue;
};

/**
 * Validate and sanitize string
 */
export const safeString = (value, defaultValue = '', maxLength = 1000) => {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  
  const str = String(value).trim();
  
  if (str.length === 0) {
    return defaultValue;
  }
  
  return str.substring(0, maxLength);
};

/**
 * Validate UUID format
 */
export const isValidUUID = (value) => {
  if (!value || typeof value !== 'string') {
    return false;
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

