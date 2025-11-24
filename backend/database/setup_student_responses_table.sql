-- ============================================================================
-- Setup Student Responses Table
-- ============================================================================
-- This script creates or updates the student_responses table with all
-- necessary question types, indexes, and constraints.
-- 
-- It handles both scenarios:
-- 1. Creates the table if it doesn't exist
-- 2. Updates the table if it already exists
-- ============================================================================

USE lms_platform;

-- ============================================================================
-- Step 1: Check if table exists and drop if needed (optional, for clean setup)
-- ============================================================================
-- Uncomment the line below only if you want to completely recreate the table
-- DROP TABLE IF EXISTS student_responses;

-- ============================================================================
-- Step 2: Create table if it doesn't exist
-- ============================================================================

CREATE TABLE IF NOT EXISTS student_responses (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    submission_id VARCHAR(36) NOT NULL,
    question_id VARCHAR(36) NOT NULL,
    section_id VARCHAR(36) NULL,
    
    -- Question types based on questions table and assessment_questions table
    -- From questions: multiple_choice, single_choice, true_false, short_answer, essay, coding, fill_blanks
    -- From assessment_questions: matching, ordering, hotspot, file_upload
    question_type ENUM(
        'multiple_choice', 
        'single_choice', 
        'true_false', 
        'short_answer', 
        'essay', 
        'coding', 
        'fill_blanks', 
        'matching', 
        'ordering', 
        'hotspot', 
        'file_upload'
    ) NOT NULL,
    
    student_answer TEXT NULL, -- Stores the answer as text or JSON string (for coding questions)
    selected_options JSON NULL, -- For multiple choice/single choice questions
    time_spent INT DEFAULT 0, -- Time spent on question in seconds
    is_correct BOOLEAN NULL, -- Null for ungraded questions (essay, coding, etc.)
    points_earned DECIMAL(10,2) DEFAULT 0, -- Points earned for this question
    auto_saved BOOLEAN DEFAULT FALSE, -- Whether answer was auto-saved
    submitted_at DATETIME NULL, -- When answer was submitted
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (submission_id) REFERENCES assessment_submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_response (submission_id, question_id)
);

-- ============================================================================
-- Step 3: Update table if it already exists (modify ENUM and add missing columns)
-- ============================================================================

-- Update question_type ENUM to include all question types
-- This will work even if the table already exists
ALTER TABLE student_responses 
MODIFY COLUMN question_type ENUM(
    'multiple_choice', 
    'single_choice', 
    'true_false', 
    'short_answer', 
    'essay', 
    'coding', 
    'fill_blanks', 
    'matching', 
    'ordering', 
    'hotspot', 
    'file_upload'
) NOT NULL;

-- ============================================================================
-- Step 4: Create indexes for better query performance
-- ============================================================================
-- Note: MySQL doesn't support "IF NOT EXISTS" for CREATE INDEX
-- We'll use a stored procedure approach or simple error handling
-- If an index already exists, MySQL will show an error which can be safely ignored

-- Helper procedure to safely create index
DELIMITER $$

DROP PROCEDURE IF EXISTS create_index_if_not_exists$$

CREATE PROCEDURE create_index_if_not_exists(
    IN p_index_name VARCHAR(255),
    IN p_table_name VARCHAR(255),
    IN p_columns VARCHAR(255)
)
BEGIN
    DECLARE index_count INT DEFAULT 0;
    
    SELECT COUNT(*) INTO index_count
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE table_schema = DATABASE()
    AND table_name = p_table_name
    AND index_name = p_index_name;
    
    IF index_count = 0 THEN
        SET @sql = CONCAT('CREATE INDEX ', p_index_name, ' ON ', p_table_name, '(', p_columns, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

DELIMITER ;

-- Create indexes using the helper procedure
CALL create_index_if_not_exists('idx_submission_id', 'student_responses', 'submission_id');
CALL create_index_if_not_exists('idx_question_id', 'student_responses', 'question_id');
CALL create_index_if_not_exists('idx_question_type', 'student_responses', 'question_type');
CALL create_index_if_not_exists('idx_is_correct', 'student_responses', 'is_correct');
CALL create_index_if_not_exists('idx_created_at', 'student_responses', 'created_at');
CALL create_index_if_not_exists('idx_submission_question', 'student_responses', 'submission_id, question_id');

-- Clean up the temporary procedure
DROP PROCEDURE IF EXISTS create_index_if_not_exists;

-- ============================================================================
-- Step 5: Verify table structure
-- ============================================================================

SELECT 'student_responses table setup completed successfully' as status;

-- Show table structure
DESCRIBE student_responses;

-- Show indexes
SHOW INDEXES FROM student_responses;

