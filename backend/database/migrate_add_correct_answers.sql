-- Migration to add correct_answers column to questions table
USE lms_platform;

-- Add correct_answers column (MySQL doesn't support IF NOT EXISTS for ADD COLUMN)
ALTER TABLE questions 
ADD COLUMN correct_answers JSON AFTER correct_answer;

-- Show the updated table structure
DESCRIBE questions; 