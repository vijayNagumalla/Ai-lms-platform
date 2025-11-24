-- Migration: Fix College Deletion Issues
-- This migration adds proper soft delete support and fixes existing issues

USE lms_platform;

-- 1. Add deleted_at column to colleges table if it doesn't exist
ALTER TABLE colleges 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at;

-- 2. Add index for better performance on soft delete queries
CREATE INDEX IF NOT EXISTS idx_colleges_deleted_at ON colleges(deleted_at);

-- 3. Update existing soft-deleted colleges to have deleted_at timestamp
UPDATE colleges 
SET deleted_at = updated_at 
WHERE is_active = FALSE AND deleted_at IS NULL;

-- 4. Create a view for active colleges only (excluding soft-deleted ones)
CREATE OR REPLACE VIEW active_colleges AS
SELECT * FROM colleges 
WHERE is_active = TRUE AND (deleted_at IS NULL OR deleted_at = '0000-00-00 00:00:00');

-- 5. Create a view for deleted colleges
CREATE OR REPLACE VIEW deleted_colleges AS
SELECT * FROM colleges 
WHERE is_active = FALSE OR deleted_at IS NOT NULL;

-- 6. Add a unique constraint that excludes soft-deleted colleges
-- This allows reuse of college codes after deletion
ALTER TABLE colleges 
ADD CONSTRAINT unique_active_college_code 
UNIQUE (code, is_active, deleted_at);

-- 7. Update the unique constraint to work with soft deletes
-- Drop the old unique constraint if it exists
ALTER TABLE colleges DROP INDEX IF EXISTS code;

-- Add new unique constraint that allows soft-deleted codes to be reused
CREATE UNIQUE INDEX idx_unique_active_college_code 
ON colleges (code) 
WHERE is_active = TRUE AND (deleted_at IS NULL OR deleted_at = '0000-00-00 00:00:00');

-- 8. Create a function to safely delete colleges
DELIMITER //
CREATE FUNCTION SafeDeleteCollege(college_id_param VARCHAR(36)) 
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE has_active_users INT DEFAULT 0;
    DECLARE has_active_departments INT DEFAULT 0;
    DECLARE college_exists INT DEFAULT 0;
    
    -- Check if college exists and is active
    SELECT COUNT(*) INTO college_exists 
    FROM colleges 
    WHERE id = college_id_param AND is_active = TRUE;
    
    IF college_exists = 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Check for active users
    SELECT COUNT(*) INTO has_active_users 
    FROM users 
    WHERE college_id = college_id_param AND is_active = TRUE;
    
    -- Check for active departments
    SELECT COUNT(*) INTO has_active_departments 
    FROM departments 
    WHERE college_id = college_id_param AND is_active = TRUE;
    
    -- Return TRUE if safe to delete (no active dependencies)
    RETURN (has_active_users = 0 AND has_active_departments = 0);
END //
DELIMITER ;

-- 9. Create a procedure to properly soft delete a college
DELIMITER //
CREATE PROCEDURE SoftDeleteCollege(IN college_id_param VARCHAR(36))
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Check if it's safe to delete
    IF NOT SafeDeleteCollege(college_id_param) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete college with active users or departments';
    END IF;
    
    -- Soft delete the college
    UPDATE colleges 
    SET is_active = FALSE, deleted_at = CURRENT_TIMESTAMP 
    WHERE id = college_id_param;
    
    -- Clean up related data
    UPDATE users 
    SET college_id = NULL 
    WHERE college_id = college_id_param;
    
    UPDATE departments 
    SET is_active = FALSE 
    WHERE college_id = college_id_param;
    
    COMMIT;
    
    SELECT 'College soft deleted successfully' as result;
END //
DELIMITER ;

-- 10. Create a procedure to restore a soft-deleted college
DELIMITER //
CREATE PROCEDURE RestoreCollege(IN college_id_param VARCHAR(36))
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Restore the college
    UPDATE colleges 
    SET is_active = TRUE, deleted_at = NULL 
    WHERE id = college_id_param;
    
    -- Restore departments
    UPDATE departments 
    SET is_active = TRUE 
    WHERE college_id = college_id_param;
    
    COMMIT;
    
    SELECT 'College restored successfully' as result;
END //
DELIMITER ;

-- 11. Create a procedure to permanently delete a college (use with caution)
DELIMITER //
CREATE PROCEDURE HardDeleteCollege(IN college_id_param VARCHAR(36))
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Check if it's safe to delete
    IF NOT SafeDeleteCollege(college_id_param) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete college with active users or departments';
    END IF;
    
    -- Permanently delete the college and all related data
    DELETE FROM users WHERE college_id = college_id_param;
    DELETE FROM departments WHERE college_id = college_id_param;
    DELETE FROM college_departments WHERE college_id = college_id_param;
    DELETE FROM colleges WHERE id = college_id_param;
    
    COMMIT;
    
    SELECT 'College permanently deleted' as result;
END //
DELIMITER ;

-- 12. Show the current status
SELECT 
    'Migration completed successfully' as status,
    COUNT(*) as total_colleges,
    SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_colleges,
    SUM(CASE WHEN is_active = FALSE THEN 1 ELSE 0 END) as deleted_colleges
FROM colleges;

