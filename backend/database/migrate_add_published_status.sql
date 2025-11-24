-- Migration to add 'published' status to assessment_templates table
USE lms_platform;

-- Add 'published' to the status ENUM
ALTER TABLE assessment_templates 
MODIFY COLUMN status ENUM('draft', 'active', 'archived', 'published') DEFAULT 'draft';

-- Show the updated table structure
DESCRIBE assessment_templates;
