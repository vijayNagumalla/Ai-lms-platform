-- Migration to add missing fields to assessment_submissions table
USE lms_platform;

-- Add missing fields that the backend code expects
ALTER TABLE assessment_submissions 
ADD COLUMN current_question INT DEFAULT 0,
ADD COLUMN time_remaining INT DEFAULT 0,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Show the updated table structure
DESCRIBE assessment_submissions; 