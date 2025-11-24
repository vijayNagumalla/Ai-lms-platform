-- Migration to add missing columns to assessment_templates table
USE lms_platform;

-- Add missing columns to assessment_templates table
ALTER TABLE assessment_templates ADD COLUMN time_between_attempts_hours INT DEFAULT 0;
ALTER TABLE assessment_templates ADD COLUMN show_correct_answers BOOLEAN DEFAULT FALSE;
ALTER TABLE assessment_templates ADD COLUMN proctoring_type ENUM('none', 'basic', 'advanced', 'ai') DEFAULT 'none';
ALTER TABLE assessment_templates ADD COLUMN proctoring_settings JSON;
ALTER TABLE assessment_templates ADD COLUMN scheduling JSON;
ALTER TABLE assessment_templates ADD COLUMN access_control JSON;
ALTER TABLE assessment_templates ADD COLUMN assignment_settings JSON;
ALTER TABLE assessment_templates ADD COLUMN sections JSON;
ALTER TABLE assessment_templates ADD COLUMN tags JSON;

-- Show the updated table structure
DESCRIBE assessment_templates; 