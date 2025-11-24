-- Migration to fix existing assessment times that were stored incorrectly
USE lms_platform;

-- Fix start_date_only and end_date_only fields
-- Extract the date part from the full datetime strings
UPDATE assessment_assignments 
SET 
    start_date_only = DATE(start_date),
    end_date_only = DATE(end_date)
WHERE start_date IS NOT NULL 
AND (start_date_only IS NULL OR start_date_only NOT REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}$');

-- Show the corrected data
SELECT 
    aa.id,
    at.title,
    aa.start_date,
    aa.end_date,
    aa.start_date_only,
    aa.start_time_only,
    aa.end_date_only,
    aa.end_time_only,
    aa.time_zone,
    CONCAT(aa.start_date_only, 'T', aa.start_time_only) as combined_start,
    CONCAT(aa.end_date_only, 'T', aa.end_time_only) as combined_end
FROM assessment_assignments aa
JOIN assessment_templates at ON aa.assessment_id = at.id
WHERE aa.start_date IS NOT NULL 
ORDER BY aa.created_at DESC
LIMIT 10; 