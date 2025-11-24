-- Migration script to add new columns to colleges table
-- Run this script to update existing database

USE lms_platform;

-- Add new columns to colleges table
ALTER TABLE colleges 
ADD COLUMN city VARCHAR(100) AFTER address,
ADD COLUMN state VARCHAR(100) AFTER city,
ADD COLUMN country VARCHAR(100) DEFAULT 'India' AFTER state,
ADD COLUMN postal_code VARCHAR(20) AFTER country,
ADD COLUMN established_year INT AFTER logo_url,
ADD COLUMN accreditation VARCHAR(255) AFTER established_year,
ADD COLUMN contact_person VARCHAR(255) AFTER accreditation,
ADD COLUMN contact_person_phone VARCHAR(20) AFTER contact_person,
ADD COLUMN contact_person_email VARCHAR(255) AFTER contact_person_phone,
ADD COLUMN description TEXT AFTER contact_person_email;

-- Add indexes for better performance
CREATE INDEX idx_code ON colleges(code);
CREATE INDEX idx_city ON colleges(city);
CREATE INDEX idx_state ON colleges(state);
CREATE INDEX idx_country ON colleges(country);
CREATE INDEX idx_is_active ON colleges(is_active);

-- Update existing records with default values if needed
UPDATE colleges SET country = 'India' WHERE country IS NULL; 