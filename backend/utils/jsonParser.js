/**
 * CRITICAL FIX: Safe JSON parser with error handling
 * Prevents application crashes on malformed JSON
 */
export const safeJsonParse = (jsonString, defaultValue = null) => {
  if (!jsonString || typeof jsonString !== 'string') {
    return defaultValue;
  }

  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON parse error:', error.message, 'Input:', jsonString.substring(0, 100));
    return defaultValue;
  }
};

/**
 * Parse JSON array safely
 */
export const safeJsonParseArray = (jsonString, defaultValue = []) => {
  const parsed = safeJsonParse(jsonString, defaultValue);
  return Array.isArray(parsed) ? parsed : defaultValue;
};

/**
 * Parse JSON object safely
 */
export const safeJsonParseObject = (jsonString, defaultValue = {}) => {
  const parsed = safeJsonParse(jsonString, defaultValue);
  return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) 
    ? parsed 
    : defaultValue;
};

