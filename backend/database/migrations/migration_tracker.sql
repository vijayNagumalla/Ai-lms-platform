-- LOW PRIORITY FIX: Migration versioning system
-- This table tracks which migrations have been applied

USE lms_platform;

CREATE TABLE IF NOT EXISTS migration_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(64),
    applied_by VARCHAR(100),
    execution_time_ms INT,
    status ENUM('success', 'failed', 'rolled_back') DEFAULT 'success',
    error_message TEXT,
    INDEX idx_migration_name (migration_name),
    INDEX idx_applied_at (applied_at),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Function to check if migration has been applied
-- Drop function if it exists (MySQL doesn't support IF NOT EXISTS for functions)
DELIMITER //
DROP FUNCTION IF EXISTS migration_applied //
CREATE FUNCTION migration_applied(migration_name VARCHAR(255))
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE applied BOOLEAN DEFAULT FALSE;
    SELECT COUNT(*) > 0 INTO applied
    FROM migration_history
    WHERE migration_history.migration_name = migration_name
    AND status = 'success';
    RETURN applied;
END //
DELIMITER ;

-- View to see migration status
CREATE OR REPLACE VIEW migration_status AS
SELECT 
    migration_name,
    applied_at,
    status,
    execution_time_ms,
    applied_by
FROM migration_history
ORDER BY applied_at DESC;

