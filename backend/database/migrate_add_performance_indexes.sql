-- MEDIUM PRIORITY FIX: Add missing database indexes for frequently queried columns
-- This improves query performance for assessment_submissions.status, student_responses.submission_id, and assessment_assignments.assessment_id
-- MySQL-compatible version (MySQL doesn't support IF NOT EXISTS for CREATE INDEX)

-- Helper procedure to create index only if it doesn't exist
-- Using DELIMITER to handle stored procedure creation
DELIMITER $$

DROP PROCEDURE IF EXISTS create_index_if_not_exists$$

CREATE PROCEDURE create_index_if_not_exists(
    IN p_table_name VARCHAR(128),
    IN p_index_name VARCHAR(128),
    IN p_index_columns VARCHAR(512)
)
BEGIN
    DECLARE v_index_exists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO v_index_exists
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = p_table_name
      AND index_name = p_index_name;
    
    IF v_index_exists = 0 THEN
        SET @sql = CONCAT('CREATE INDEX ', p_index_name, ' ON ', p_table_name, '(', p_index_columns, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

DELIMITER ;

-- Index for assessment_submissions.status (frequently queried for filtering)
CALL create_index_if_not_exists('assessment_submissions', 'idx_assessment_submissions_status', 'status');

-- Index for student_responses.submission_id (frequently joined)
CALL create_index_if_not_exists('student_responses', 'idx_student_responses_submission_id', 'submission_id');

-- Composite index for assessment_assignments.assessment_id (frequently queried with target_id)
CALL create_index_if_not_exists('assessment_assignments', 'idx_assessment_assignments_assessment_id', 'assessment_id');
CALL create_index_if_not_exists('assessment_assignments', 'idx_assessment_assignments_target_id', 'target_id');
CALL create_index_if_not_exists('assessment_assignments', 'idx_assessment_assignments_composite', 'assessment_id, target_id');

-- Additional performance indexes for common query patterns
CALL create_index_if_not_exists('assessment_submissions', 'idx_assessment_submissions_student_assessment', 'student_id, assessment_id');
CALL create_index_if_not_exists('assessment_submissions', 'idx_assessment_submissions_assessment_status', 'assessment_id, status');
CALL create_index_if_not_exists('student_responses', 'idx_student_responses_question_id', 'question_id');

-- Index for assessment_questions (frequently joined)
-- Note: assessment_id index may already exist, but this ensures it's there
CALL create_index_if_not_exists('assessment_questions', 'idx_assessment_questions_assessment_id', 'assessment_id');

-- Index for users table (common filters)
-- Note: college_id and role indexes may already exist, but this ensures they're there
CALL create_index_if_not_exists('users', 'idx_users_college_id', 'college_id');
CALL create_index_if_not_exists('users', 'idx_users_batch', 'batch');
CALL create_index_if_not_exists('users', 'idx_users_role', 'role');

-- Index for coding profiles (frequently queried)
CALL create_index_if_not_exists('student_coding_profiles', 'idx_student_coding_profiles_student_id', 'student_id');
CALL create_index_if_not_exists('student_coding_profiles', 'idx_student_coding_profiles_platform_id', 'platform_id');

-- Index for attendance (if tables exist)
CALL create_index_if_not_exists('attendance_records', 'idx_attendance_records_session_id', 'session_id');
CALL create_index_if_not_exists('attendance_records', 'idx_attendance_records_student_id', 'student_id');
CALL create_index_if_not_exists('attendance_sessions', 'idx_attendance_sessions_class_id', 'class_id');

-- Clean up the helper procedure
DROP PROCEDURE IF EXISTS create_index_if_not_exists;

