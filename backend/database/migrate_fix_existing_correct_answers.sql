-- Migration to fix existing multiple choice questions with correct answers
USE lms_platform;

-- First, let's see what we have
SELECT 
    id, 
    content, 
    question_type, 
    options, 
    correct_answer, 
    correct_answers,
    created_at
FROM questions 
WHERE question_type = 'multiple_choice' 
ORDER BY created_at DESC 
LIMIT 5;

-- Update questions that have correct_answer but not correct_answers
-- For multiple choice questions, move correct_answer to correct_answers if it's not null
UPDATE questions 
SET correct_answers = correct_answer 
WHERE question_type = 'multiple_choice' 
  AND correct_answer IS NOT NULL 
  AND correct_answer != 'null'
  AND correct_answers IS NULL;

-- For questions that have correct_answer as 'null' string, set it to actual null
UPDATE questions 
SET correct_answer = NULL 
WHERE question_type = 'multiple_choice' 
  AND correct_answer = 'null';

-- Show the results after migration
SELECT 
    id, 
    content, 
    question_type, 
    options, 
    correct_answer, 
    correct_answers,
    created_at
FROM questions 
WHERE question_type = 'multiple_choice' 
ORDER BY created_at DESC 
LIMIT 5; 