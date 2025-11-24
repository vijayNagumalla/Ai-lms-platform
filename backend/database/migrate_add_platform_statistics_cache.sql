-- Migration to add platform statistics cache table

-- Platform statistics cache table
CREATE TABLE IF NOT EXISTS platform_statistics_cache (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    platform_name VARCHAR(100) NOT NULL,
    username VARCHAR(100) NOT NULL,
    statistics_data JSON NOT NULL,
    last_fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_platform_username (student_id, platform_name, username),
    INDEX idx_student_id (student_id),
    INDEX idx_platform_name (platform_name),
    INDEX idx_last_fetched_at (last_fetched_at)
);

-- Batch platform statistics cache table (for bulk operations)
CREATE TABLE IF NOT EXISTS batch_platform_statistics_cache (
    id VARCHAR(36) PRIMARY KEY,
    batch_id VARCHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    platform_name VARCHAR(100) NOT NULL,
    username VARCHAR(100) NOT NULL,
    statistics_data JSON NOT NULL,
    last_fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_batch_id (batch_id),
    INDEX idx_student_id (student_id),
    INDEX idx_platform_name (platform_name),
    INDEX idx_last_fetched_at (last_fetched_at)
);

-- Show the created tables structure
SHOW TABLES LIKE '%platform_statistics%';
DESCRIBE platform_statistics_cache;
DESCRIBE batch_platform_statistics_cache;
