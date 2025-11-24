-- Migration: Add assessment_notifications table
-- Date: 2025-01-27

-- Create assessment_notifications table
CREATE TABLE IF NOT EXISTS assessment_notifications (
    id VARCHAR(36) PRIMARY KEY,
    assessment_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    notification_type ENUM('assignment_created', 'assessment_started', 'assessment_ending_soon', 'assessment_completed', 'result_available', 'reminder') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assessment_id) REFERENCES assessment_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_assessment_id (assessment_id),
    INDEX idx_user_id (user_id),
    INDEX idx_notification_type (notification_type),
    INDEX idx_is_read (is_read)
);

-- Add any additional indexes if needed
CREATE INDEX IF NOT EXISTS idx_sent_at ON assessment_notifications(sent_at); 