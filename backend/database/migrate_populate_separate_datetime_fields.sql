-- Migration to populate separate date and time fields for existing records
USE lms_platform;

-- Update existing records to populate the new fields from the combined datetime fields
UPDATE assessment_assignments 
SET 
  start_date_only = DATE(start_date),
  start_time_only = TIME(start_date),
  end_date_only = DATE(end_date),
  end_time_only = TIME(end_date)
WHERE (start_date IS NOT NULL OR end_date IS NOT NULL)
  AND (start_date_only IS NULL OR start_time_only IS NULL OR end_date_only IS NULL OR end_time_only IS NULL);

-- Show some sample data to verify the update
SELECT 
  id,
  start_date,
  start_date_only,
  start_time_only,
  end_date,
  end_date_only,
  end_time_only,
  time_zone
FROM assessment_assignments 
LIMIT 5; 