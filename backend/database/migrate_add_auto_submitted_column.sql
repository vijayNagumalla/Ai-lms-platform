-- Migration to add auto_submitted column to assessment_submissions table
USE lms_platform;

-- Add auto_submitted column if it doesn't exist
ALTER TABLE assessment_submissions 
ADD COLUMN IF NOT EXISTS auto_submitted BOOLEAN DEFAULT FALSE;

-- Show the updated table structure
DESCRIBE assessment_submissions;

