                                                                                                                                                                                                            -- Database optimization for coding profiles performance
-- This script adds indexes and optimizes queries for better performance with 5000+ students

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_student_coding_profiles_student_id ON student_coding_profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_student_coding_profiles_platform_id ON student_coding_profiles(platform_id);
CREATE INDEX IF NOT EXISTS idx_student_coding_profiles_sync_status ON student_coding_profiles(sync_status);
CREATE INDEX IF NOT EXISTS idx_student_coding_profiles_last_synced ON student_coding_profiles(last_synced_at);

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_student_coding_profiles_student_platform ON student_coding_profiles(student_id, platform_id);
CREATE INDEX IF NOT EXISTS idx_users_role_college ON users(role, college_id);
CREATE INDEX IF NOT EXISTS idx_users_name_email ON users(name, email);
CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);

-- Add indexes for coding platform data queries
CREATE INDEX IF NOT EXISTS idx_coding_platform_data_profile_id ON coding_platform_data(profile_id);
CREATE INDEX IF NOT EXISTS idx_coding_platform_data_type ON coding_platform_data(data_type);
CREATE INDEX IF NOT EXISTS idx_coding_platform_data_recorded_at ON coding_platform_data(recorded_at);

-- Add indexes for coding achievements
CREATE INDEX IF NOT EXISTS idx_coding_achievements_profile_id ON coding_achievements(profile_id);
CREATE INDEX IF NOT EXISTS idx_coding_achievements_earned_at ON coding_achievements(earned_at);

-- Optimize the main students query with better indexing
-- The existing query will now use these indexes for faster execution

-- Add a materialized view for frequently accessed analytics (optional)
-- This can be refreshed periodically to avoid expensive joins
CREATE OR REPLACE VIEW student_coding_profiles_summary AS
SELECT 
    u.id as student_id,
    u.name as student_name,
    u.email as student_email,
    u.student_id as student_roll_number,
    u.batch,
    c.name as college_name,
    u.department,
    COUNT(scp.id) as total_profiles,
    COUNT(CASE WHEN scp.is_verified = TRUE THEN 1 END) as verified_profiles,
    MAX(scp.last_synced_at) as last_sync_date
FROM users u
LEFT JOIN colleges c ON u.college_id = c.id
LEFT JOIN student_coding_profiles scp ON u.id = scp.student_id
WHERE u.role = 'student'
GROUP BY u.id, u.name, u.email, u.student_id, u.batch, c.name, u.department;

-- Add index on the view for better performance
CREATE INDEX IF NOT EXISTS idx_student_coding_profiles_summary_student_id ON student_coding_profiles_summary(student_id);
CREATE INDEX IF NOT EXISTS idx_student_coding_profiles_summary_college ON student_coding_profiles_summary(college_name);
CREATE INDEX IF NOT EXISTS idx_student_coding_profiles_summary_batch ON student_coding_profiles_summary(batch);

-- Optimize the platform statistics query
-- Add a function to get platform statistics efficiently
DELIMITER //
CREATE PROCEDURE GetStudentPlatformStats(IN student_id_param INT)
BEGIN
    SELECT 
        cp.name as platform_name,
        scp.username,
        scp.profile_url,
        scp.sync_status,
        scp.last_synced_at,
        cp.base_url as platform_url
    FROM student_coding_profiles scp
    LEFT JOIN coding_platforms cp ON scp.platform_id = cp.id
    WHERE scp.student_id = student_id_param
    ORDER BY cp.name;
END //
DELIMITER ;

-- Add a procedure for batch platform statistics
DELIMITER //
CREATE PROCEDURE GetBatchStudentPlatformStats(IN student_ids JSON)
BEGIN
    SELECT 
        scp.student_id,
        cp.name as platform_name,
        scp.username,
        scp.profile_url,
        scp.sync_status,
        scp.last_synced_at,
        cp.base_url as platform_url
    FROM student_coding_profiles scp
    LEFT JOIN coding_platforms cp ON scp.platform_id = cp.id
    WHERE JSON_CONTAINS(student_ids, CAST(scp.student_id AS JSON))
    ORDER BY scp.student_id, cp.name;
END //
DELIMITER ;

-- Add a trigger to update the summary view when profiles change
DELIMITER //
CREATE TRIGGER update_student_coding_profiles_summary_insert
AFTER INSERT ON student_coding_profiles
FOR EACH ROW
BEGIN
    -- The view will automatically reflect the changes
    -- This trigger can be used for additional logging or cache invalidation
    INSERT INTO coding_profiles_audit_log (action, student_id, platform_id, timestamp)
    VALUES ('INSERT', NEW.student_id, NEW.platform_id, NOW());
END //
DELIMITER ;

DELIMITER //
CREATE TRIGGER update_student_coding_profiles_summary_update
AFTER UPDATE ON student_coding_profiles
FOR EACH ROW
BEGIN
    INSERT INTO coding_profiles_audit_log (action, student_id, platform_id, timestamp)
    VALUES ('UPDATE', NEW.student_id, NEW.platform_id, NOW());
END //
DELIMITER ;

DELIMITER //
CREATE TRIGGER update_student_coding_profiles_summary_delete
AFTER DELETE ON student_coding_profiles
FOR EACH ROW
BEGIN
    INSERT INTO coding_profiles_audit_log (action, student_id, platform_id, timestamp)
    VALUES ('DELETE', OLD.student_id, OLD.platform_id, NOW());
END //
DELIMITER ;

-- Create audit log table for tracking changes
CREATE TABLE IF NOT EXISTS coding_profiles_audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(20) NOT NULL,
    student_id INT NOT NULL,
    platform_id INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_log_student_id (student_id),
    INDEX idx_audit_log_timestamp (timestamp)
);

-- Add query hints for better performance
-- These can be used in the application code for specific queries

-- Example optimized query for getting students with pagination
-- This query uses the new indexes for better performance
/*
SELECT DISTINCT
    u.id as student_id,
    u.name as student_name,
    u.email as student_email,
    u.student_id as student_roll_number,
    u.role as user_role,
    u.batch,
    c.name as college_name,
    u.department
FROM users u USE INDEX (idx_users_role_college)
LEFT JOIN colleges c ON u.college_id = c.id
INNER JOIN student_coding_profiles scp USE INDEX (idx_student_coding_profiles_student_id) ON u.id = scp.student_id
WHERE u.role = 'student'
ORDER BY u.name
LIMIT ? OFFSET ?;
*/

-- Performance monitoring queries
-- Use these to monitor query performance

-- Check index usage
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    CARDINALITY,
    SUB_PART,
    PACKED,
    NULLABLE,
    INDEX_TYPE
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME IN ('users', 'student_coding_profiles', 'coding_platforms', 'colleges')
ORDER BY TABLE_NAME, INDEX_NAME;

-- Check slow queries (enable slow query log first)
-- SET GLOBAL slow_query_log = 'ON';
-- SET GLOBAL long_query_time = 1;

-- Analyze table statistics for better query planning
ANALYZE TABLE users, student_coding_profiles, coding_platforms, colleges;

-- Optimize tables to reclaim space and improve performance
OPTIMIZE TABLE users, student_coding_profiles, coding_platforms, colleges;
