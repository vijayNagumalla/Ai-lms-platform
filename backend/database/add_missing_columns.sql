-- Add missing columns to coding_api_logs table
-- This fixes the "Unknown column 'batch_id' in 'field list'" error

-- Add batch_id column
ALTER TABLE coding_api_logs 
ADD COLUMN batch_id VARCHAR(36) AFTER user_id;

-- Add request_count column
ALTER TABLE coding_api_logs 
ADD COLUMN request_count INT DEFAULT 1 AFTER response_time_ms;

-- Add success_count column
ALTER TABLE coding_api_logs 
ADD COLUMN success_count INT DEFAULT 0 AFTER request_count;

-- Add failure_count column
ALTER TABLE coding_api_logs 
ADD COLUMN failure_count INT DEFAULT 0 AFTER success_count;

-- Add indexes for better performance
CREATE INDEX idx_coding_api_logs_batch_id ON coding_api_logs(batch_id);
CREATE INDEX idx_coding_api_logs_request_type ON coding_api_logs(request_type);

