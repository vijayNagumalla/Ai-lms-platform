-- Migration to add encrypted_metadata column to proctoring_logs table
-- This enables encryption at rest for sensitive proctoring data

USE lms_platform;

-- First, ensure the proctoring_logs table exists
-- If it doesn't exist, create it with the encrypted_metadata column included
CREATE TABLE IF NOT EXISTS proctoring_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    submission_id VARCHAR(36) NOT NULL,
    violation_type ENUM('tab_switch', 'right_click', 'copy_paste', 'dev_tools', 'window_focus', 'fullscreen_exit', 'keyboard_shortcut', 'webcam_disconnect', 'suspicious_activity') NOT NULL,
    timestamp DATETIME NOT NULL,
    description TEXT NULL,
    severity_level ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
    metadata JSON NULL,
    encrypted_metadata JSON NULL COMMENT 'Encrypted sensitive metadata (webcam_data, audio_data, etc.)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (submission_id) REFERENCES assessment_submissions(id) ON DELETE CASCADE,
    INDEX idx_submission_violations (submission_id, violation_type),
    INDEX idx_timestamp (timestamp)
);

-- Add encrypted_metadata column only if table exists but column doesn't
-- This uses a stored procedure approach to check column existence
SET @dbname = DATABASE();
SET @tablename = 'proctoring_logs';
SET @columnname = 'encrypted_metadata';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = @dbname
        AND TABLE_NAME = @tablename
        AND COLUMN_NAME = @columnname
    ) > 0,
    'SELECT 1', -- Column exists, do nothing
    CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' JSON NULL COMMENT ''Encrypted sensitive metadata (webcam_data, audio_data, etc.)''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Note: Indexing is NOT added to encrypted_metadata because:
-- 1. MySQL doesn't support direct indexing on JSON columns (requires generated columns on JSON paths)
-- 2. Since this is encrypted data, indexing it doesn't provide query benefits
-- 3. Existing indexes on submission_id, violation_type, and timestamp are sufficient for queries
-- The encryption/decryption is handled in backend/services/proctoringService.js
-- This column stores JSON-encoded encrypted data from SecurityService.encrypt()

