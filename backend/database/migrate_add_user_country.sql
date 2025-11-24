-- Migration: Add country column to users table
-- This migration adds a country field to store user's country for timezone purposes

USE lms_platform;

-- Add country column to users table
ALTER TABLE users ADD COLUMN country VARCHAR(100) DEFAULT NULL;

-- Add index for better query performance
CREATE INDEX idx_users_country ON users(country);

-- Update existing users to have a default country if needed
-- UPDATE users SET country = 'India' WHERE country IS NULL; 