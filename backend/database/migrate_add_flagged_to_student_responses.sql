-- Migration to add is_flagged column to student_responses table
USE lms_platform;

-- Check if column exists and add if it doesn't
DELIMITER $$

DROP PROCEDURE IF EXISTS add_is_flagged_column_if_not_exists$$

CREATE PROCEDURE add_is_flagged_column_if_not_exists()
BEGIN
    DECLARE column_count INT DEFAULT 0;
    
    -- Check if column exists
    SELECT COUNT(*) INTO column_count
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'student_responses'
    AND COLUMN_NAME = 'is_flagged';
    
    -- Add column if it doesn't exist
    IF column_count = 0 THEN
        ALTER TABLE student_responses 
        ADD COLUMN is_flagged BOOLEAN DEFAULT FALSE;
        
        SELECT 'is_flagged column added to student_responses table' as status;
    ELSE
        SELECT 'is_flagged column already exists in student_responses table' as status;
    END IF;
END$$

DELIMITER ;

-- Execute the procedure
CALL add_is_flagged_column_if_not_exists();

-- Clean up the procedure
DROP PROCEDURE IF EXISTS add_is_flagged_column_if_not_exists;

-- Add index for better query performance (ignore error if index exists)
DELIMITER $$

DROP PROCEDURE IF EXISTS create_index_if_not_exists$$

CREATE PROCEDURE create_index_if_not_exists()
BEGIN
    DECLARE index_count INT DEFAULT 0;
    
    -- Check if index exists
    SELECT COUNT(*) INTO index_count
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'student_responses'
    AND INDEX_NAME = 'idx_is_flagged';
    
    -- Create index if it doesn't exist
    IF index_count = 0 THEN
        CREATE INDEX idx_is_flagged ON student_responses(is_flagged);
        SELECT 'Index idx_is_flagged created successfully' as status;
    ELSE
        SELECT 'Index idx_is_flagged already exists' as status;
    END IF;
END$$

DELIMITER ;

-- Execute the procedure
CALL create_index_if_not_exists();

-- Clean up the procedure
DROP PROCEDURE IF EXISTS create_index_if_not_exists;

-- Final status
SELECT 'Migration completed successfully' as status;

