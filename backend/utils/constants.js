// LOW PRIORITY FIX: Extract magic numbers/strings to constants
// Makes code more maintainable and easier to configure

// File size limits
export const FILE_SIZE_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_EXPORT_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_DOCUMENT_SIZE: 10 * 1024 * 1024 // 10MB
};

// Time constants (in milliseconds)
export const TIME_CONSTANTS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000
};

// JWT token expiration
export const JWT_EXPIRATION = {
  ACCESS_TOKEN: '7d',
  REFRESH_TOKEN: '30d',
  PASSWORD_RESET: '1h',
  EMAIL_VERIFICATION: '24h'
};

// Rate limiting constants
export const RATE_LIMITS = {
  GLOBAL_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  GLOBAL_MAX_REQUESTS: 100,
  AUTH_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  AUTH_MAX_REQUESTS: 5,
  API_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  API_MAX_REQUESTS: 100
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 1
};

// Database constants
export const DATABASE = {
  DEFAULT_CONNECTION_LIMIT: 10,
  PRODUCTION_CONNECTION_LIMIT: 50,
  QUERY_TIMEOUT: 30000, // 30 seconds
  CONNECTION_TIMEOUT: 10000 // 10 seconds
};

// Cache TTL (Time To Live) in milliseconds
export const CACHE_TTL = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 15 * 60 * 1000, // 15 minutes
  LONG: 60 * 60 * 1000, // 1 hour
  VERY_LONG: 24 * 60 * 60 * 1000 // 24 hours
};

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// User roles
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  FACULTY: 'faculty',
  STUDENT: 'student'
};

// Assessment statuses
export const ASSESSMENT_STATUS = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Submission statuses
export const SUBMISSION_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  GRADED: 'graded',
  LATE: 'late'
};

// Email templates
export const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  PASSWORD_RESET: 'password_reset',
  ASSESSMENT_NOTIFICATION: 'assessment_notification',
  ASSESSMENT_REMINDER: 'assessment_reminder',
  GRADE_NOTIFICATION: 'grade_notification'
};

// Export formats
export const EXPORT_FORMATS = {
  EXCEL: 'excel',
  PDF: 'pdf',
  CSV: 'csv',
  JSON: 'json'
};

// MIME types
export const MIME_TYPES = {
  JSON: 'application/json',
  PDF: 'application/pdf',
  EXCEL: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  CSV: 'text/csv',
  IMAGE_JPEG: 'image/jpeg',
  IMAGE_PNG: 'image/png',
  IMAGE_GIF: 'image/gif'
};

// Allowed file extensions
export const ALLOWED_EXTENSIONS = {
  IMAGES: ['.jpg', '.jpeg', '.png', '.gif'],
  DOCUMENTS: ['.pdf', '.doc', '.docx'],
  SPREADSHEETS: ['.xls', '.xlsx', '.csv'],
  ALL: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv']
};

export default {
  FILE_SIZE_LIMITS,
  TIME_CONSTANTS,
  JWT_EXPIRATION,
  RATE_LIMITS,
  PAGINATION,
  DATABASE,
  CACHE_TTL,
  HTTP_STATUS,
  USER_ROLES,
  ASSESSMENT_STATUS,
  SUBMISSION_STATUS,
  EMAIL_TEMPLATES,
  EXPORT_FORMATS,
  MIME_TYPES,
  ALLOWED_EXTENSIONS
};

