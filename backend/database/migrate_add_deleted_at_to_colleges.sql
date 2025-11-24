-- Migration: Add deleted_at column to colleges table
-- This migration adds deleted_at column to properly support soft deletes

USE lms_platform;

-- Add deleted_at column to colleges table
ALTER TABLE colleges 
ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at;

-- Add index for better performance on soft delete queries
CREATE INDEX idx_colleges_deleted_at ON colleges(deleted_at);

-- Update existing soft-deleted colleges to have deleted_at timestamp
UPDATE colleges 
SET deleted_at = updated_at 
WHERE is_active = FALSE AND deleted_at IS NULL;

-- Create a view for active colleges only
CREATE OR REPLACE VIEW active_colleges AS
SELECT * FROM colleges 
WHERE is_active = TRUE AND deleted_at IS NULL;

-- Create a view for deleted colleges
CREATE OR REPLACE VIEW deleted_colleges AS
SELECT * FROM colleges 
WHERE is_active = FALSE OR deleted_at IS NOT NULL;

-- Note: GRANT statements removed due to permission issues
-- The views will be accessible to the current user

