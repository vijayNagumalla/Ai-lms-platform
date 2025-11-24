-- Migration to add scheduling column to assessment_templates table
USE lms_platform;

-- Add scheduling column if it doesn't exist
ALTER TABLE assessment_templates 
ADD COLUMN IF NOT EXISTS scheduling JSON AFTER proctoring_settings;

-- Show the updated table structure
DESCRIBE assessment_templates;
