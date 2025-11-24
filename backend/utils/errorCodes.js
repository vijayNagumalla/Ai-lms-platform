// MEDIUM PRIORITY FIX: Standardized error codes and messages
// This ensures consistent error handling across the application

export const ErrorCodes = {
    // Authentication & Authorization (1xxx)
    AUTH_REQUIRED: {
        code: 'AUTH_1001',
        message: 'Authentication required',
        statusCode: 401
    },
    AUTH_INVALID_TOKEN: {
        code: 'AUTH_1002',
        message: 'Invalid or expired authentication token',
        statusCode: 401
    },
    AUTH_INSUFFICIENT_PERMISSIONS: {
        code: 'AUTH_1003',
        message: 'Insufficient permissions to perform this action',
        statusCode: 403
    },
    
    // Validation Errors (2xxx)
    VALIDATION_INVALID_INPUT: {
        code: 'VAL_2001',
        message: 'Invalid input provided',
        statusCode: 400
    },
    VALIDATION_MISSING_REQUIRED: {
        code: 'VAL_2002',
        message: 'Missing required fields',
        statusCode: 400
    },
    VALIDATION_INVALID_FORMAT: {
        code: 'VAL_2003',
        message: 'Invalid format for provided data',
        statusCode: 400
    },
    
    // Resource Errors (3xxx)
    RESOURCE_NOT_FOUND: {
        code: 'RES_3001',
        message: 'Resource not found',
        statusCode: 404
    },
    RESOURCE_ALREADY_EXISTS: {
        code: 'RES_3002',
        message: 'Resource already exists',
        statusCode: 409
    },
    RESOURCE_CONFLICT: {
        code: 'RES_3003',
        message: 'Resource conflict detected',
        statusCode: 409
    },
    
    // Business Logic Errors (4xxx)
    BUSINESS_INVALID_STATE: {
        code: 'BIZ_4001',
        message: 'Invalid state for this operation',
        statusCode: 400
    },
    BUSINESS_OPERATION_FAILED: {
        code: 'BIZ_4002',
        message: 'Operation failed due to business rules',
        statusCode: 400
    },
    BUSINESS_LIMIT_EXCEEDED: {
        code: 'BIZ_4003',
        message: 'Operation limit exceeded',
        statusCode: 429
    },
    
    // Server Errors (5xxx)
    SERVER_INTERNAL_ERROR: {
        code: 'SRV_5001',
        message: 'Internal server error',
        statusCode: 500
    },
    SERVER_DATABASE_ERROR: {
        code: 'SRV_5002',
        message: 'Database operation failed',
        statusCode: 500
    },
    SERVER_EXTERNAL_SERVICE_ERROR: {
        code: 'SRV_5003',
        message: 'External service unavailable',
        statusCode: 503
    },
    
    // Attendance Specific (6xxx)
    ATTENDANCE_SESSION_NOT_FOUND: {
        code: 'ATT_6001',
        message: 'Attendance session not found',
        statusCode: 404
    },
    ATTENDANCE_QR_EXPIRED: {
        code: 'ATT_6002',
        message: 'QR code has expired. Please request a new one.',
        statusCode: 400
    },
    ATTENDANCE_QR_ALREADY_USED: {
        code: 'ATT_6003',
        message: 'QR code has already been used. Each QR code can only be used once.',
        statusCode: 400
    },
    ATTENDANCE_NOT_ENROLLED: {
        code: 'ATT_6004',
        message: 'Student is not enrolled in this course. Cannot mark attendance.',
        statusCode: 403
    },
    
    // Proctoring Specific (7xxx)
    PROCTORING_VIOLATION_THRESHOLD: {
        code: 'PROC_7001',
        message: 'Proctoring violation threshold exceeded',
        statusCode: 400
    },
    PROCTORING_SETUP_FAILED: {
        code: 'PROC_7002',
        message: 'Proctoring setup failed',
        statusCode: 500
    },
    
    // Code Execution (8xxx)
    CODE_EXECUTION_TIMEOUT: {
        code: 'CODE_8001',
        message: 'Code execution timeout',
        statusCode: 408
    },
    CODE_EXECUTION_FAILED: {
        code: 'CODE_8002',
        message: 'Code execution failed',
        statusCode: 500
    },
    CODE_EXECUTION_SERVICE_UNAVAILABLE: {
        code: 'CODE_8003',
        message: 'Code execution service unavailable',
        statusCode: 503
    }
};

// Helper function to create standardized error response
export function createErrorResponse(errorCode, details = null) {
    const error = ErrorCodes[errorCode] || ErrorCodes.SERVER_INTERNAL_ERROR;
    
    return {
        success: false,
        error: {
            code: error.code,
            message: error.message,
            ...(details && { details })
        }
    };
}

// Helper function to get HTTP status code
export function getStatusCode(errorCode) {
    const error = ErrorCodes[errorCode] || ErrorCodes.SERVER_INTERNAL_ERROR;
    return error.statusCode;
}

