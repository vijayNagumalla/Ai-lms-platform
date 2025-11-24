/**
 * CRITICAL FIX: Retry logic with exponential backoff
 * Handles transient failures for external services
 */

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @returns {Promise} - Result of the function
 */
export const retryWithBackoff = async (fn, options = {}) => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    retryableErrors = [],
    onRetry = null
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      if (retryableErrors.length > 0) {
        const isRetryable = retryableErrors.some(retryableError => {
          if (typeof retryableError === 'function') {
            return retryableError(error);
          }
          if (retryableError instanceof RegExp) {
            return retryableError.test(error.message);
          }
          return error.message.includes(retryableError);
        });

        if (!isRetryable) {
          throw error;
        }
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, error, delay);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));

      // Calculate next delay with exponential backoff
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError;
};

/**
 * Create a retryable function wrapper
 */
export const withRetry = (fn, options) => {
  return async (...args) => {
    return retryWithBackoff(() => fn(...args), options);
  };
};

