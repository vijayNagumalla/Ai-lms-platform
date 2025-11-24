-- Migration to add 'expired' status to assessment_submissions table
USE lms_platform;

-- Add 'expired' to the status ENUM
ALTER TABLE assessment_submissions 
MODIFY COLUMN status ENUM('in_progress', 'submitted', 'graded', 'late', 'disqualified', 'expired') DEFAULT 'in_progress';

-- Show the updated table structure
DESCRIBE assessment_submissions;
