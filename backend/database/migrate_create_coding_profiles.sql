-- Migration to create coding profiles management tables
USE lms_platform;

-- Coding platforms configuration table
CREATE TABLE IF NOT EXISTS coding_platforms (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    base_url VARCHAR(255) NOT NULL,
    profile_url_pattern VARCHAR(255) NOT NULL,
    api_endpoint VARCHAR(255),
    scraping_config JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default coding platforms
INSERT INTO coding_platforms (id, name, display_name, base_url, profile_url_pattern, scraping_config) VALUES
(UUID(), 'leetcode', 'LeetCode', 'https://leetcode.com', 'https://leetcode.com/u/{username}', '{"selectors": {"total_solved": ".text-label-1", "easy_solved": ".text-difficulty-easy", "medium_solved": ".text-difficulty-medium", "hard_solved": ".text-difficulty-hard", "ranking": ".ttext-label-1"}}'),
(UUID(), 'codechef', 'CodeChef', 'https://www.codechef.com', 'https://www.codechef.com/users/{username}', '{"selectors": {"total_problems": "h3:contains(\"Total Problems Solved\")"}}'),
(UUID(), 'hackerearth', 'HackerEarth', 'https://www.hackerearth.com', 'https://www.hackerearth.com/@{username}', '{"selectors": {"points": ".text-xl.font-semibold", "contest_ratings": ".text-xl.font-semibold", "problems_solved": ".text-xl.font-semibold", "solutions_submitted": ".text-xl.font-semibold"}}'),
(UUID(), 'hackerrank', 'HackerRank', 'https://www.hackerrank.com', 'https://www.hackerrank.com/profile/{username}', '{"selectors": {"badges": ".hacker-badge", "badge_name": ".badge-title", "badge_stars": ".badge-star"}}'),
(UUID(), 'geeksforgeeks', 'GeeksforGeeks', 'https://www.geeksforgeeks.org', 'https://www.geeksforgeeks.org/user/{username}', '{"selectors": {"total_problems": ".scoreCard_head_left--score__oSi_x", "school_problems": ".problemNavbar_head_nav--text__UaGCx:contains(\"SCHOOL\")", "basic_problems": ".problemNavbar_head_nav--text__UaGCx:contains(\"BASIC\")", "easy_problems": ".problemNavbar_head_nav--text__UaGCx:contains(\"EASY\")", "medium_problems": ".problemNavbar_head_nav--text__UaGCx:contains(\"MEDIUM\")", "hard_problems": ".problemNavbar_head_nav--text__UaGCx:contains(\"HARD\")"}}');

-- Student coding profiles table
CREATE TABLE IF NOT EXISTS student_coding_profiles (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    platform_id VARCHAR(36) NOT NULL,
    username VARCHAR(100) NOT NULL,
    profile_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    last_synced_at TIMESTAMP NULL,
    sync_status ENUM('pending', 'syncing', 'success', 'failed') DEFAULT 'pending',
    sync_error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (platform_id) REFERENCES coding_platforms(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_platform (student_id, platform_id),
    INDEX idx_student_id (student_id),
    INDEX idx_platform_id (platform_id),
    INDEX idx_username (username),
    INDEX idx_sync_status (sync_status)
);

-- Coding platform performance data table
CREATE TABLE IF NOT EXISTS coding_platform_data (
    id VARCHAR(36) PRIMARY KEY,
    profile_id VARCHAR(36) NOT NULL,
    platform_id VARCHAR(36) NOT NULL,
    data_type ENUM('problems_solved', 'rating', 'ranking', 'badges', 'achievements', 'contest_participation') NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value VARCHAR(255),
    numeric_value DECIMAL(10,2),
    difficulty_level ENUM('school', 'basic', 'easy', 'medium', 'hard') NULL,
    additional_data JSON,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES student_coding_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (platform_id) REFERENCES coding_platforms(id) ON DELETE CASCADE,
    INDEX idx_profile_id (profile_id),
    INDEX idx_platform_id (platform_id),
    INDEX idx_data_type (data_type),
    INDEX idx_metric_name (metric_name),
    INDEX idx_recorded_at (recorded_at)
);

-- Coding achievements table (for badges, stars, certificates)
CREATE TABLE IF NOT EXISTS coding_achievements (
    id VARCHAR(36) PRIMARY KEY,
    profile_id VARCHAR(36) NOT NULL,
    platform_id VARCHAR(36) NOT NULL,
    achievement_type ENUM('badge', 'certificate', 'star', 'medal', 'trophy') NOT NULL,
    achievement_name VARCHAR(255) NOT NULL,
    achievement_description TEXT,
    achievement_level ENUM('bronze', 'silver', 'gold', 'platinum') NULL,
    stars_count INT DEFAULT 0,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    achievement_data JSON,
    FOREIGN KEY (profile_id) REFERENCES student_coding_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (platform_id) REFERENCES coding_platforms(id) ON DELETE CASCADE,
    INDEX idx_profile_id (profile_id),
    INDEX idx_platform_id (platform_id),
    INDEX idx_achievement_type (achievement_type),
    INDEX idx_achievement_level (achievement_level),
    INDEX idx_earned_at (earned_at)
);

-- Coding profile sync logs table
CREATE TABLE IF NOT EXISTS coding_profile_sync_logs (
    id VARCHAR(36) PRIMARY KEY,
    profile_id VARCHAR(36) NOT NULL,
    sync_type ENUM('manual', 'scheduled', 'bulk') NOT NULL,
    sync_status ENUM('started', 'in_progress', 'completed', 'failed') NOT NULL,
    sync_started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_completed_at TIMESTAMP NULL,
    data_fetched JSON,
    error_message TEXT,
    records_updated INT DEFAULT 0,
    FOREIGN KEY (profile_id) REFERENCES student_coding_profiles(id) ON DELETE CASCADE,
    INDEX idx_profile_id (profile_id),
    INDEX idx_sync_status (sync_status),
    INDEX idx_sync_started_at (sync_started_at)
);

-- Show the created tables structure
SHOW TABLES LIKE '%coding%';
DESCRIBE coding_platforms;
DESCRIBE student_coding_profiles;
DESCRIBE coding_platform_data;
DESCRIBE coding_achievements;
DESCRIBE coding_profile_sync_logs;
