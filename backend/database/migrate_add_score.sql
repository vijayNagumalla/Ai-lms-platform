-- Migration: Add score column to coding_problems table
USE lms_platform;

-- Add score column if it doesn't exist
ALTER TABLE coding_problems 
ADD COLUMN IF NOT EXISTS score INT DEFAULT 10;

-- Update existing records to have a default score
UPDATE coding_problems 
SET score = 10 
WHERE score IS NULL; 