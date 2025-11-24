-- Migration to add scraping_failures table for monitoring scraping issues
-- This enables tracking of failed scraping attempts for debugging and monitoring

USE lms_platform;

-- Check if table exists, if not create it
CREATE TABLE IF NOT EXISTS scraping_failures (
    id VARCHAR(36) PRIMARY KEY,
    platform VARCHAR(50) NOT NULL,
    username VARCHAR(255) NOT NULL,
    error_message TEXT,
    failure_count INT DEFAULT 1,
    failed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_platform_username (platform, username),
    INDEX idx_failed_at (failed_at),
    INDEX idx_failure_count (failure_count),
    UNIQUE KEY unique_platform_username (platform, username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: This table tracks scraping failures for monitoring and debugging
-- Failed scrapes are logged here to help identify patterns and issues

