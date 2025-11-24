// MEDIUM PRIORITY FIX: Centralized configuration management
// Move hardcoded values to environment variables with sensible defaults

import dotenv from 'dotenv';

dotenv.config();

export const appConfig = {
    // Server Configuration
    server: {
        port: parseInt(process.env.PORT) || 5000,
        nodeEnv: process.env.NODE_ENV || 'development',
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
    },
    
    // Database Configuration
    database: {
        connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 
            (process.env.NODE_ENV === 'production' ? 50 : 10),
        poolMonitoringInterval: parseInt(process.env.DB_POOL_MONITORING_INTERVAL) || 30000 // 30 seconds
    },
    
    // Email Configuration
    email: {
        rateLimit: parseInt(process.env.EMAIL_RATE_LIMIT) || 10, // emails per rateDelta
        rateDelta: parseInt(process.env.EMAIL_RATE_DELTA) || 20000, // 20 seconds
        batchSize: parseInt(process.env.EMAIL_BATCH_SIZE) || 10,
        batchDelay: parseInt(process.env.EMAIL_BATCH_DELAY) || 2000 // 2 seconds
    },
    
    // Code Execution Configuration
    codeExecution: {
        timeout: parseInt(process.env.CODE_EXECUTION_TIMEOUT_MS) || 5000, // 5 seconds
        memoryLimit: process.env.CODE_EXECUTION_MEMORY_LIMIT || '128m',
        containerPooling: process.env.DOCKER_CONTAINER_POOLING === 'true',
        maxPoolSize: parseInt(process.env.DOCKER_MAX_POOL_SIZE) || 3
    },
    
    // Proctoring Configuration
    proctoring: {
        dataRetentionDays: parseInt(process.env.PROCTORING_DATA_RETENTION_DAYS) || 90,
        violationThresholds: {
            tabSwitch: {
                maxPerMinute: parseInt(process.env.PROCTORING_TAB_SWITCH_PER_MIN) || 3,
                maxPerSession: parseInt(process.env.PROCTORING_TAB_SWITCH_PER_SESSION) || 20
            },
            copyPaste: {
                maxPerMinute: parseInt(process.env.PROCTORING_COPY_PASTE_PER_MIN) || 2,
                maxPerSession: parseInt(process.env.PROCTORING_COPY_PASTE_PER_SESSION) || 10
            },
            rightClick: {
                maxPerMinute: parseInt(process.env.PROCTORING_RIGHT_CLICK_PER_MIN) || 5,
                maxPerSession: parseInt(process.env.PROCTORING_RIGHT_CLICK_PER_SESSION) || 30
            }
        }
    },
    
    // Attendance Configuration
    attendance: {
        qrCodeExpiryMinutes: parseInt(process.env.ATTENDANCE_QR_EXPIRY_MINUTES) || 15,
        qrCodeOneTimeUse: process.env.ATTENDANCE_QR_ONE_TIME_USE !== 'false', // default true
        gpsAccuracyThreshold: parseFloat(process.env.ATTENDANCE_GPS_ACCURACY_THRESHOLD) || 50.0 // meters
    },
    
    // Export Configuration
    export: {
        maxRecords: parseInt(process.env.EXPORT_MAX_RECORDS) || 10000,
        maxFileSize: parseInt(process.env.EXPORT_MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB
        batchSize: parseInt(process.env.EXPORT_BATCH_SIZE) || 1000,
        cleanupIntervalHours: parseInt(process.env.EXPORT_CLEANUP_INTERVAL_HOURS) || 6,
        fileTTLHours: parseInt(process.env.EXPORT_FILE_TTL_HOURS) || 24
    },
    
    // Analytics Configuration
    analytics: {
        cacheTTL: parseInt(process.env.ANALYTICS_CACHE_TTL) || 5 * 60 * 1000, // 5 minutes
        maxCacheSize: parseInt(process.env.ANALYTICS_MAX_CACHE_SIZE) || 100,
        defaultPageSize: parseInt(process.env.ANALYTICS_DEFAULT_PAGE_SIZE) || 50,
        maxPageSize: parseInt(process.env.ANALYTICS_MAX_PAGE_SIZE) || 100
    },
    
    // Security Configuration
    security: {
        jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
        passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 8,
        csrfTokenExpiry: parseInt(process.env.CSRF_TOKEN_EXPIRY) || 3600000 // 1 hour
    },
    
    // File Upload Configuration
    fileUpload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
        allowedMimeTypes: (process.env.ALLOWED_MIME_TYPES || 
            'image/jpeg,image/png,image/gif,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            .split(',')
    }
};

export default appConfig;

