-- Fix platform URLs to use correct profile URLs instead of API endpoints
-- These are the actual profile URLs where users can be found

-- Update LeetCode platform with correct profile URL
UPDATE coding_platforms 
SET base_url = 'https://leetcode.com/u/',
    api_endpoint = 'https://leetcode.com/u/'
WHERE name = 'leetcode';

-- Update CodeChef platform with correct profile URL
UPDATE coding_platforms 
SET base_url = 'https://www.codechef.com/users/',
    api_endpoint = 'https://www.codechef.com/users/'
WHERE name = 'codechef';

-- Update HackerRank platform with correct profile URL
UPDATE coding_platforms 
SET base_url = 'https://www.hackerrank.com/',
    api_endpoint = 'https://www.hackerrank.com/'
WHERE name = 'hackerrank';

-- Update GeeksForGeeks platform with correct profile URL
UPDATE coding_platforms 
SET base_url = 'https://www.geeksforgeeks.org/user/',
    api_endpoint = 'https://www.geeksforgeeks.org/user/'
WHERE name = 'geeksforgeeks';

-- Update AtCoder platform with correct profile URL
UPDATE coding_platforms 
SET base_url = 'https://atcoder.jp/users/',
    api_endpoint = 'https://atcoder.jp/users/'
WHERE name = 'atcoder';

-- Verify the updates
SELECT id, name, display_name, base_url, api_endpoint, is_active 
FROM coding_platforms 
ORDER BY display_name;

















