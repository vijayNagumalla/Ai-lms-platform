-- Migration to add missing columns to assessment_questions table
USE lms_platform;

-- Add missing columns if they don't exist
ALTER TABLE assessment_questions 
ADD COLUMN IF NOT EXISTS correct_answers JSON,
ADD COLUMN IF NOT EXISTS explanation TEXT,
ADD COLUMN IF NOT EXISTS difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT TRUE;

-- Update existing questions to have default values
UPDATE assessment_questions 
SET difficulty_level = 'medium' 
WHERE difficulty_level IS NULL;

UPDATE assessment_questions 
SET is_required = TRUE 
WHERE is_required IS NULL;

-- Show the updated table structure
DESCRIBE assessment_questions; 