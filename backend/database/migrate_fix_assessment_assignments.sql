-- Migration to fix assessment_assignments table structure
USE lms_platform;

-- Rename existing columns to match backend expectations
ALTER TABLE assessment_assignments CHANGE COLUMN assignee_type assignment_type ENUM('individual', 'group', 'college', 'department', 'course') NOT NULL;
ALTER TABLE assessment_assignments CHANGE COLUMN assignee_id target_id VARCHAR(36) NOT NULL;

-- Add missing columns
ALTER TABLE assessment_assignments ADD COLUMN time_zone VARCHAR(50) DEFAULT 'UTC';
ALTER TABLE assessment_assignments ADD COLUMN early_access_hours INT DEFAULT 0;
ALTER TABLE assessment_assignments ADD COLUMN late_submission_minutes INT DEFAULT 0;
ALTER TABLE assessment_assignments ADD COLUMN password VARCHAR(255);
ALTER TABLE assessment_assignments ADD COLUMN ip_restrictions JSON;
ALTER TABLE assessment_assignments ADD COLUMN device_restrictions JSON;
ALTER TABLE assessment_assignments ADD COLUMN browser_restrictions JSON;

-- Add indexes if they don't exist
ALTER TABLE assessment_assignments ADD INDEX idx_assignment_type (assignment_type);
ALTER TABLE assessment_assignments ADD INDEX idx_target_id (target_id);
ALTER TABLE assessment_assignments ADD INDEX idx_start_date (start_date);
ALTER TABLE assessment_assignments ADD INDEX idx_end_date (end_date);

-- Show the updated table structure
DESCRIBE assessment_assignments; 