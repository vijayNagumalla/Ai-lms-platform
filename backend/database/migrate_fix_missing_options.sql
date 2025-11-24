-- Migration to fix missing options in old questions
USE lms_platform;

-- Update questions with missing options to have default options
UPDATE questions 
SET options = '["Option 1", "Option 2"]'
WHERE (question_type = 'multiple_choice' OR question_type = 'single_choice')
  AND (options IS NULL OR JSON_LENGTH(options) < 2);

-- Show the results
SELECT 
    id, 
    question_type, 
    options,
    JSON_LENGTH(options) as options_count
FROM questions 
WHERE question_type IN ('multiple_choice', 'single_choice')
ORDER BY created_at DESC; 