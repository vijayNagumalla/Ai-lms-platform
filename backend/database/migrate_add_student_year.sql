-- Migration: Add year fields for students
-- This migration adds joining_year and final_year fields to track the academic journey of students
-- The current_year will be automatically calculated based on these fields

USE lms_platform;

-- Add year columns to users table for students
ALTER TABLE users 
ADD COLUMN joining_year INT DEFAULT NULL AFTER student_id,
ADD COLUMN final_year INT DEFAULT NULL AFTER joining_year,
ADD COLUMN current_year INT DEFAULT NULL AFTER final_year,
ADD COLUMN year_start_date DATE DEFAULT NULL AFTER current_year;

-- Add indexes for better performance
CREATE INDEX idx_joining_year ON users(joining_year);
CREATE INDEX idx_final_year ON users(final_year);
CREATE INDEX idx_current_year ON users(current_year);
CREATE INDEX idx_year_start_date ON users(year_start_date);

-- Update existing students to have current year as joining year (assuming 2024 as base year)
-- This is a reasonable default for existing data
UPDATE users 
SET joining_year = 2024, 
    final_year = 2028, 
    current_year = 2024, 
    year_start_date = '2024-06-01' 
WHERE role = 'student' AND joining_year IS NULL;

-- Create a stored procedure to automatically update student years
DELIMITER //
CREATE PROCEDURE UpdateStudentYears()
BEGIN
    DECLARE current_date DATE;
    DECLARE current_year INT;
    
    SET current_date = CURDATE();
    SET current_year = YEAR(current_date);
    
    -- Update students whose year_start_date is more than 1 year ago
    -- and whose current_year is less than final_year
    UPDATE users 
    SET current_year = current_year + 1,
        year_start_date = DATE_ADD(year_start_date, INTERVAL 1 YEAR)
    WHERE role = 'student' 
      AND year_start_date IS NOT NULL 
      AND DATEDIFF(current_date, year_start_date) >= 365
      AND current_year < final_year;
      
    SELECT CONCAT('Updated ', ROW_COUNT(), ' students to year ', current_year) as result;
END //
DELIMITER ;

-- Create a stored procedure to calculate current year based on joining and final years
DELIMITER //
CREATE PROCEDURE CalculateCurrentYear()
BEGIN
    DECLARE current_date DATE;
    DECLARE current_year INT;
    
    SET current_date = CURDATE();
    SET current_year = YEAR(current_date);
    
    -- Calculate current year for students based on joining year and current date
    -- Formula: current_year = joining_year + (current_date - year_start_date) / 365
    UPDATE users 
    SET current_year = LEAST(
        joining_year + FLOOR(DATEDIFF(current_date, year_start_date) / 365),
        final_year
    )
    WHERE role = 'student' 
      AND joining_year IS NOT NULL 
      AND final_year IS NOT NULL 
      AND year_start_date IS NOT NULL;
      
    SELECT CONCAT('Calculated current year for ', ROW_COUNT(), ' students') as result;
END //
DELIMITER ;

-- Create an event to run this procedure annually (optional - can be run manually)
-- This event will run every year on June 1st
CREATE EVENT IF NOT EXISTS annual_student_year_update
ON SCHEDULE EVERY 1 YEAR
STARTS '2025-06-01 00:00:00'
DO CALL UpdateStudentYears();

