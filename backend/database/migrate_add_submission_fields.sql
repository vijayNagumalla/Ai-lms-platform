-- Add missing columns to assessment_submissions table
ALTER TABLE assessment_submissions 
ADD COLUMN coding_submissions JSON NULL AFTER answers,
ADD COLUMN file_submissions JSON NULL AFTER coding_submissions,
ADD COLUMN updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP AFTER submitted_at;

-- Update existing records to have empty JSON arrays for the new columns
UPDATE assessment_submissions 
SET coding_submissions = '[]', file_submissions = '[]' 
WHERE coding_submissions IS NULL OR file_submissions IS NULL; 