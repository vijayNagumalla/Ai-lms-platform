/**
 * LOW FIX: Centralized logging utility
 * Wraps console methods and provides structured logging
 * Only logs in development mode for production safety
 */

const isDevelopment = process.env.NODE_ENV === 'development';

class Logger {
  log(...args) {
    if (isDevelopment) {
      console.log('[LOG]', ...args);
    }
  }

  error(...args) {
    // Always log errors, but format them consistently
    if (isDevelopment) {
      console.error('[ERROR]', ...args);
    } else {
      // In production, could send to error tracking service
      // Example: Sentry.captureException(new Error(args.join(' ')));
      console.error('[ERROR]', ...args);
    }
  }

  warn(...args) {
    if (isDevelopment) {
      console.warn('[WARN]', ...args);
    }
  }

  debug(...args) {
    if (isDevelopment) {
      console.debug('[DEBUG]', ...args);
    }
  }

  info(...args) {
    if (isDevelopment) {
      console.info('[INFO]', ...args);
    }
  }
}

const logger = new Logger();
export default logger;

