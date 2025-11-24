-- Migration: Add admission type field for students
-- This migration adds admission_type field to distinguish between Regular and Lateral students
-- Lateral students get +1 year added to their joining year for calculations

USE lms_platform;

-- Add admission_type column to users table for students
ALTER TABLE users 
ADD COLUMN admission_type ENUM('regular', 'lateral') DEFAULT 'regular' AFTER student_id;

-- Add index for better performance
CREATE INDEX idx_admission_type ON users(admission_type);

-- Update existing students to have 'regular' as default admission type
UPDATE users 
SET admission_type = 'regular' 
WHERE role = 'student' AND admission_type IS NULL;

-- Create a stored procedure to automatically calculate years for lateral students
DELIMITER //
CREATE PROCEDURE CalculateLateralStudentYears()
BEGIN
    DECLARE current_date DATE;
    DECLARE current_year INT;
    
    SET current_date = CURDATE();
    SET current_year = YEAR(current_date);
    
    -- Update lateral students: add +1 year to joining year for calculations
    UPDATE users 
    SET joining_year = joining_year + 1,
        final_year = final_year + 1,
        current_year = LEAST(
            (joining_year + 1) + FLOOR(DATEDIFF(current_date, year_start_date) / 365),
            final_year + 1
        )
    WHERE role = 'student' 
      AND admission_type = 'lateral'
      AND joining_year IS NOT NULL 
      AND final_year IS NOT NULL 
      AND year_start_date IS NOT NULL;
      
    SELECT CONCAT('Updated lateral students: ', ROW_COUNT(), ' records modified') as result;
END //
DELIMITER ;

-- Create a view to easily identify lateral vs regular students
CREATE OR REPLACE VIEW student_admission_summary AS
SELECT 
    id,
    name,
    student_id,
    admission_type,
    joining_year,
    final_year,
    current_year,
    department,
    college_id,
    CASE 
        WHEN admission_type = 'lateral' THEN joining_year + 1
        ELSE joining_year
    END as effective_joining_year,
    CASE 
        WHEN admission_type = 'lateral' THEN final_year + 1
        ELSE final_year
    END as effective_final_year
FROM users 
WHERE role = 'student';

-- Grant permissions for the view
GRANT SELECT ON lms_platform.student_admission_summary TO 'lms_user'@'localhost';
