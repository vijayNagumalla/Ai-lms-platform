-- Migration to add separate date and time fields for better timezone handling
USE lms_platform;

-- Add separate date and time fields to assessment_assignments table
ALTER TABLE assessment_assignments 
ADD COLUMN start_date_only DATE AFTER start_date,
ADD COLUMN start_time_only TIME AFTER start_date_only,
ADD COLUMN end_date_only DATE AFTER end_date,
ADD COLUMN end_time_only TIME AFTER end_date_only;

-- Update existing records to populate the new fields
UPDATE assessment_assignments 
SET 
  start_date_only = DATE(start_date),
  start_time_only = TIME(start_date),
  end_date_only = DATE(end_date),
  end_time_only = TIME(end_date)
WHERE start_date IS NOT NULL OR end_date IS NOT NULL;

-- Show the updated table structure
DESCRIBE assessment_assignments; 