-- Fix platform API endpoints to use working URLs
-- The current endpoints in the database are not working properly

-- Update LeetCode platform with working API endpoints
UPDATE coding_platforms 
SET api_endpoint = 'https://leetcode-stats-api.herokuapp.com'
WHERE name = 'leetcode';

-- Update CodeChef platform with working API endpoints  
UPDATE coding_platforms 
SET api_endpoint = 'https://www.codechef.com/api'
WHERE name = 'codechef';

-- Update HackerRank platform with working API endpoints
UPDATE coding_platforms 
SET api_endpoint = 'https://www.hackerrank.com/rest'
WHERE name = 'hackerrank';

-- Update GeeksForGeeks platform with working API endpoints
UPDATE coding_platforms 
SET api_endpoint = 'https://www.geeksforgeeks.org'
WHERE name = 'geeksforgeeks';

-- Update AtCoder platform with working API endpoints
UPDATE coding_platforms 
SET api_endpoint = 'https://atcoder.jp'
WHERE name = 'atcoder';

-- Verify the updates
SELECT id, name, display_name, base_url, api_endpoint, is_active 
FROM coding_platforms 
ORDER BY display_name;

