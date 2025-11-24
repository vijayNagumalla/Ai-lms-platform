-- Migration to add subcategory_id column to questions table
USE lms_platform;

-- Check if subcategory_id column exists
SELECT COUNT(*) as column_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'lms_platform' 
  AND TABLE_NAME = 'questions' 
  AND COLUMN_NAME = 'subcategory_id';

-- Add subcategory_id column if it doesn't exist
ALTER TABLE questions 
ADD COLUMN subcategory_id VARCHAR(36) AFTER category_id;

-- Add foreign key constraint
ALTER TABLE questions 
ADD CONSTRAINT fk_questions_subcategory 
FOREIGN KEY (subcategory_id) REFERENCES question_categories(id) ON DELETE SET NULL;

-- Add index for subcategory_id
ALTER TABLE questions 
ADD INDEX idx_subcategory_id (subcategory_id);

-- Show the updated table structure
DESCRIBE questions; 