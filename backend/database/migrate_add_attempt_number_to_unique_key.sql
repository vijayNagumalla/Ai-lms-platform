-- Migration: Add attempt_number to unique constraint in student_responses
-- This allows the same question to be answered in different attempts
-- Issue: Current unique constraint on (submission_id, question_id) doesn't account for retakes

DELIMITER $$

DROP PROCEDURE IF EXISTS add_attempt_number_to_unique_key$$

CREATE PROCEDURE add_attempt_number_to_unique_key()
BEGIN
    DECLARE constraint_exists INT DEFAULT 0;
    DECLARE attempt_number_exists INT DEFAULT 0;
    
    -- Check if attempt_number column exists
    SELECT COUNT(*) INTO attempt_number_exists
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'student_responses'
    AND COLUMN_NAME = 'attempt_number';
    
    -- Check if unique constraint exists
    SELECT COUNT(*) INTO constraint_exists
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'student_responses'
    AND CONSTRAINT_TYPE = 'UNIQUE'
    AND CONSTRAINT_NAME = 'unique_submission_question';
    
    -- Add attempt_number column if it doesn't exist
    IF attempt_number_exists = 0 THEN
        ALTER TABLE student_responses 
        ADD COLUMN attempt_number INT DEFAULT NULL;
        
        -- Populate attempt_number from assessment_submissions
        UPDATE student_responses sr
        JOIN assessment_submissions s ON sr.submission_id = s.id
        SET sr.attempt_number = s.attempt_number
        WHERE sr.attempt_number IS NULL;
        
        SELECT 'attempt_number column added to student_responses table' as status;
    ELSE
        SELECT 'attempt_number column already exists in student_responses table' as status;
    END IF;
    
    -- Drop old unique constraint if it exists
    IF constraint_exists > 0 THEN
        ALTER TABLE student_responses
        DROP INDEX unique_submission_question;
        
        SELECT 'Old unique constraint dropped' as status;
    END IF;
    
    -- Add new unique constraint with attempt_number
    -- First check if new constraint already exists
    SELECT COUNT(*) INTO constraint_exists
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'student_responses'
    AND CONSTRAINT_TYPE = 'UNIQUE'
    AND CONSTRAINT_NAME = 'unique_submission_question_attempt';
    
    IF constraint_exists = 0 THEN
        ALTER TABLE student_responses
        ADD UNIQUE KEY unique_submission_question_attempt (submission_id, question_id, attempt_number);
        
        SELECT 'New unique constraint with attempt_number added' as status;
    ELSE
        SELECT 'Unique constraint with attempt_number already exists' as status;
    END IF;
END$$

DELIMITER ;

CALL add_attempt_number_to_unique_key();
DROP PROCEDURE IF EXISTS add_attempt_number_to_unique_key;

