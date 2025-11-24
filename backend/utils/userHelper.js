// LOW PRIORITY FIX: Standardize user object structure access
// Provides consistent way to access user ID across the application

/**
 * Get user ID from request object
 * Standardizes access to user ID regardless of how it's stored
 * @param {Object} req - Express request object
 * @returns {string|null} - User ID or null if not found
 */
export function getUserId(req) {
  if (!req.user) {
    return null;
  }
  
  // Try different possible property names
  return req.user.id || req.user.student_id || req.user.studentId || req.user.user_id || null;
}

/**
 * Get user role from request object
 * @param {Object} req - Express request object
 * @returns {string|null} - User role or null if not found
 */
export function getUserRole(req) {
  if (!req.user) {
    return null;
  }
  
  return req.user.role || req.user.user_role || null;
}

/**
 * Get user college ID from request object
 * @param {Object} req - Express request object
 * @returns {string|null} - College ID or null if not found
 */
export function getUserCollegeId(req) {
  if (!req.user) {
    return null;
  }
  
  return req.user.college_id || req.user.collegeId || null;
}

/**
 * Get user department from request object
 * @param {Object} req - Express request object
 * @returns {string|null} - Department or null if not found
 */
export function getUserDepartment(req) {
  if (!req.user) {
    return null;
  }
  
  return req.user.department || req.user.department_name || null;
}

/**
 * Check if user is authenticated
 * @param {Object} req - Express request object
 * @returns {boolean} - True if user is authenticated
 */
export function isAuthenticated(req) {
  return !!req.user && !!getUserId(req);
}

/**
 * Require authentication - throws error if not authenticated
 * @param {Object} req - Express request object
 * @throws {Error} - If user is not authenticated
 */
export function requireAuth(req) {
  if (!isAuthenticated(req)) {
    throw new Error('Authentication required');
  }
}

export default {
  getUserId,
  getUserRole,
  getUserCollegeId,
  getUserDepartment,
  isAuthenticated,
  requireAuth
};

