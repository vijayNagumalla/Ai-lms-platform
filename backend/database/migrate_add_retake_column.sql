-- Migration to add is_retake column to assessment_submissions table
USE lms_platform;

-- Add is_retake column if it doesn't exist
ALTER TABLE assessment_submissions 
ADD COLUMN IF NOT EXISTS is_retake BOOLEAN DEFAULT FALSE;

-- Show the updated table structure
DESCRIBE assessment_submissions;

