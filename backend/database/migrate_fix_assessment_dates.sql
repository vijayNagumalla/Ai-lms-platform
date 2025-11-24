-- Migration to fix assessment date format issues
USE lms_platform;

-- First, let's check the current state of the assessment_assignments table
SELECT 
    id,
    assessment_id,
    assignment_type,
    target_id,
    start_date_only,
    start_time_only,
    end_date_only,
    end_time_only,
    assessment_timezone,
    created_at,
    updated_at
FROM assessment_assignments 
WHERE assessment_id IN (
    '7070e1ea-1b82-4ac8-94de-52584d2b71c4',
    'caa4a27e-6023-4609-b8f3-949bdf3dc4d2'
);

-- Fix the date format issues
-- The problem is that start_date_only and end_date_only are being stored as full datetime objects
-- instead of just dates. We need to extract just the date part.

UPDATE assessment_assignments 
SET 
    start_date_only = DATE(start_date_only),
    end_date_only = DATE(end_date_only),
    updated_at = CURRENT_TIMESTAMP
WHERE assessment_id IN (
    '7070e1ea-1b82-4ac8-94de-52584d2b71c4',
    'caa4a27e-6023-4609-b8f3-949bdf3dc4d2'
)
AND (start_date_only IS NOT NULL OR end_date_only IS NOT NULL);

-- Verify the fix
SELECT 
    id,
    assessment_id,
    assignment_type,
    target_id,
    start_date_only,
    start_time_only,
    end_date_only,
    end_time_only,
    assessment_timezone,
    created_at,
    updated_at
FROM assessment_assignments 
WHERE assessment_id IN (
    '7070e1ea-1b82-4ac8-94de-52584d2b71c4',
    'caa4a27e-6023-4609-b8f3-949bdf3dc4d2'
);

-- Also fix any other assessment assignments that might have the same issue
UPDATE assessment_assignments 
SET 
    start_date_only = DATE(start_date_only),
    end_date_only = DATE(end_date_only),
    updated_at = CURRENT_TIMESTAMP
WHERE 
    (start_date_only IS NOT NULL AND start_date_only != DATE(start_date_only))
    OR (end_date_only IS NOT NULL AND end_date_only != DATE(end_date_only));

-- Show the table structure to confirm the data types
DESCRIBE assessment_assignments; 