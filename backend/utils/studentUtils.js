/**
 * Utility functions for student-related operations
 * MEDIUM FIX: Standardize student ID extraction from request
 */

/**
 * Extract student ID from request user object
 * Handles different JWT token structures consistently
 * @param {Object} user - Request user object from JWT
 * @returns {string|null} - Student ID or null if not found
 */
export function extractStudentId(user) {
    if (!user) {
        return null;
    }
    
    // Try all possible field names in order of preference
    return user.id || user.student_id || user.studentId || null;
}

/**
 * Validate that student ID exists
 * @param {string|null} studentId - Student ID to validate
 * @param {string} operation - Operation name for error message
 * @throws {Error} If student ID is missing
 */
export function validateStudentId(studentId, operation = 'operation') {
    if (!studentId) {
        throw new Error(`Student ID is required for ${operation}`);
    }
    return studentId;
}

