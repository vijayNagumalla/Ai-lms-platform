-- Migration: Add Batch Fields
-- This migration adds batch management capabilities to the system

-- Add batch field to colleges table
ALTER TABLE colleges ADD COLUMN batch VARCHAR(100) DEFAULT NULL AFTER description;
ALTER TABLE colleges ADD INDEX idx_batch (batch);

-- Add batch field to users table
ALTER TABLE users ADD COLUMN batch VARCHAR(100) DEFAULT NULL AFTER department;
ALTER TABLE users ADD INDEX idx_batch (batch);

-- Create batches table for centralized batch management
CREATE TABLE IF NOT EXISTS batches (
    id VARCHAR(36) PRIMARY KEY,
    college_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    start_year INT,
    end_year INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    UNIQUE KEY unique_batch_code (college_id, code),
    INDEX idx_college_id (college_id),
    INDEX idx_batch_code (code),
    INDEX idx_is_active (is_active)
);

-- Insert some default batches for existing colleges
INSERT INTO batches (id, college_id, name, code, description, start_year, end_year, is_active)
SELECT 
    UUID() as id,
    c.id as college_id,
    '2024-2028' as name,
    '2024' as code,
    'Default batch for 2024 intake' as description,
    2024 as start_year,
    2028 as end_year,
    TRUE as is_active
FROM colleges c
WHERE c.is_active = TRUE
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;



