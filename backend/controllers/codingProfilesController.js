import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database.js';

// Utility function to add delay between API calls
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Simple in-memory cache for coding profile data
const profileCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache management functions
function getCacheKey(platformId, username) {
  return `${platformId}-${username}`;
}

function getCachedData(platformId, username) {
  const key = getCacheKey(platformId, username);
  const cached = profileCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  // Remove expired cache entry
  if (cached) {
    profileCache.delete(key);
  }
  
  return null;
}

function setCachedData(platformId, username, data) {
  const key = getCacheKey(platformId, username);
  profileCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

// Get all coding platforms
export const getCodingPlatforms = async (req, res) => {
  try {
    const [platforms] = await pool.execute(
      'SELECT * FROM coding_platforms WHERE is_active = TRUE ORDER BY display_name'
    );
    
    res.json({
      success: true,
      data: platforms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coding platforms'
    });
  }
};

// Get user's coding profiles
export const getUserCodingProfiles = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const [profiles] = await pool.execute(`
      SELECT 
        cp.id,
        cp.user_id,
        cp.platform_id,
        cp.username,
        cp.profile_url,
        cp.total_solved,
        cp.last_updated,
        cp.is_active,
        cp.created_at,
        cp.updated_at,
        cpl.name as platform_key,
        cpl.display_name as platform_name,
        cpl.base_url as platform_url
      FROM coding_profiles cp
      JOIN coding_platforms cpl ON cp.platform_id = cpl.id
      WHERE cp.user_id = ? AND cp.is_active = TRUE
      ORDER BY cpl.display_name
    `, [userId]);
    
    res.json({
      success: true,
      data: profiles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coding profiles'
    });
  }
};

// Create or update coding profile
export const upsertCodingProfile = async (req, res) => {
  try {
    const { userId, platformId, username, profileUrl } = req.body;
    
    // Check if profile already exists
    const [existing] = await pool.execute(
      'SELECT id FROM coding_profiles WHERE user_id = ? AND platform_id = ?',
      [userId, platformId]
    );
    
    if (existing.length > 0) {
      // Update existing profile
      await pool.execute(`
        UPDATE coding_profiles 
        SET username = ?, profile_url = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND platform_id = ?
      `, [username, profileUrl, userId, platformId]);
      
      res.json({
        success: true,
        message: 'Coding profile updated successfully'
      });
    } else {
      // Create new profile
      const profileId = uuidv4();
      await pool.execute(`
        INSERT INTO coding_profiles (id, user_id, platform_id, username, profile_url)
        VALUES (?, ?, ?, ?, ?)
      `, [profileId, userId, platformId, username, profileUrl]);
      
      res.json({
        success: true,
        message: 'Coding profile created successfully'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to save coding profile'
    });
  }
};

// Fetch coding profile data from platform (simulated for now)
export const fetchCodingProfileData = async (req, res) => {
  try {
    const { userId, platformId } = req.params;
    
    // Get profile details
    const [profiles] = await pool.execute(
      'SELECT * FROM coding_profiles WHERE user_id = ? AND platform_id = ?',
      [userId, platformId]
    );
    
    if (profiles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Coding profile not found'
      });
    }
    
    const profile = profiles[0];
    
    // Simulate API call to coding platform
    // Fetch real data from the coding platform
    const realData = await fetchPlatformData(profile.platform_id, profile.username);
    
    // Update profile with fetched data - ensure all values are defined
    const updateData = [
      realData.totalSolved || 0,
      realData.easySolved || 0,
      realData.mediumSolved || 0,
      realData.hardSolved || 0,
      realData.acceptanceRate || 0,
      realData.rating || 0,
      realData.rank || 0,
      realData.contributionPoints || 0,
      realData.reputation || 0,
      // Platform-specific fields
      realData.stars || 0,
      realData.country || '',
      realData.institution || '',
      realData.memberSince || '',
      realData.practiceProblems || 0,
      realData.contestProblems || 0,
      realData.school || '',
      realData.company || '',
      realData.jobTitle || '',
      realData.bio || '',
      profile.id
    ];
    
    // Profile data updated successfully
    
    await pool.execute(`
      UPDATE coding_profiles
      SET total_solved = ?, easy_solved = ?, medium_solved = ?, hard_solved = ?,
          acceptance_rate = ?, rating = ?, \`rank\` = ?, 
          contribution_points = ?, reputation = ?, 
          stars = ?, country = ?, institution = ?, member_since = ?,
          practice_problems = ?, contest_problems = ?, school = ?, 
          company = ?, job_title = ?, bio = ?, last_updated = CURRENT_TIMESTAMP
      WHERE id = ?
    `, updateData);
    
    // Log API request - ensure all parameters are defined
    try {
      await pool.execute(`
        INSERT INTO coding_api_logs (id, platform_id, user_id, request_type, status, response_time_ms)
        VALUES (?, ?, ?, 'profile_fetch', 'success', ?)
      `, [uuidv4(), platformId, userId, realData.responseTime || 0]);
    } catch (logError) {
    }
    
    res.json({
      success: true,
      data: realData,
      message: 'Profile data fetched and updated successfully'
    });
  } catch (error) {
    
    // Log failed API request - ensure all parameters are defined
    try {
      await pool.execute(`
        INSERT INTO coding_api_logs (id, platform_id, user_id, request_type, status, error_message)
        VALUES (?, ?, ?, 'profile_fetch', 'failed', ?)
      `, [uuidv4(), req.params.platformId || 'unknown', req.params.userId || 'unknown', error.message || 'Unknown error']);
    } catch (logError) {
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile data'
    });
  }
};

// Get user's coding progress summary
export const getUserCodingProgress = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get overall progress summary
    const [summary] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT cp.id) as total_platforms,
        SUM(cp.total_solved) as total_problems_solved,
        AVG(cp.rating) as average_rating,
        MAX(cp.rating) as highest_rating,
        COUNT(DISTINCT CASE WHEN cp.total_solved > 0 THEN cp.id END) as active_platforms
      FROM coding_profiles cp
      WHERE cp.user_id = ? AND cp.is_active = TRUE
    `, [userId]);
    
    // Get platform-specific progress
    const [platformProgress] = await pool.execute(`
      SELECT 
        cp.*,
        cpl.display_name as platform_name,
        cpl.name as platform_key
      FROM coding_profiles cp
      JOIN coding_platforms cpl ON cp.platform_id = cpl.id
      WHERE cp.user_id = ? AND cp.is_active = TRUE
      ORDER BY cp.total_solved DESC
    `, [userId]);
    
    // Get recent achievements
    const [achievements] = await pool.execute(`
      SELECT * FROM coding_achievements 
      WHERE user_id = ? 
      ORDER BY unlocked_at DESC 
      LIMIT 5
    `, [userId]);
    
    res.json({
      success: true,
      data: {
        summary: summary[0] || {},
        platformProgress,
        achievements
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coding progress'
    });
  }
};

// Fetch real data from coding platforms
async function fetchPlatformData(platformId, username) {
  const startTime = Date.now();
  
  try {
    // Check cache first
    const cachedData = getCachedData(platformId, username);
    if (cachedData) {
      return {
        ...cachedData,
        responseTime: Date.now() - startTime
      };
    }
    
    // Get platform details from database
    const [platforms] = await pool.execute(
      'SELECT name, api_endpoint, api_key FROM coding_platforms WHERE id = ?',
      [platformId]
    );
    
    if (platforms.length === 0) {
      throw new Error('Platform not found');
    }
    
    const platform = platforms[0];
    
    // Fetch data based on platform
    let data = {};
    
    try {
      switch (platform.name.toLowerCase()) {
        case 'leetcode':
          data = await fetchLeetCodeData(username);
          break;
        case 'hackerrank':
          data = await fetchHackerRankData(username);
          break;
        case 'codechef':
          data = await fetchCodeChefData(username);
          break;
        case 'geeksforgeeks':
          data = await fetchGeeksForGeeksData(username);
          break;
        case 'atcoder':
          data = await fetchAtCoderData(username);
          break;
        default:
          // For unknown platforms, try generic approach
          data = await fetchGenericPlatformData(platform.api_endpoint, username, platform.api_key);
      }
      
      // Validate the fetched data
      if (!data || typeof data !== 'object') {
        data = getDefaultPlatformData();
      }
      
    } catch (platformError) {
      // Return default data instead of failing completely
      data = getDefaultPlatformData();
    }
    
    const responseTime = Date.now() - startTime;
    
    // Ensure all required fields are present with default values
    const result = {
      totalSolved: data.totalSolved || 0,
      easySolved: data.easySolved || 0,
      mediumSolved: data.mediumSolved || 0,
      hardSolved: data.hardSolved || 0,
      acceptanceRate: data.acceptanceRate || 0,
      rating: data.rating || 0,
      rank: data.rank || 0,
      contributionPoints: data.contributionPoints || 0,
      reputation: data.reputation || 0,
      responseTime
    };
    
    // Cache the result
    setCachedData(platformId, username, result);
    
    return result;
    
      } catch (error) {
      return getDefaultPlatformData();
    }
  }

// Fetch data from LeetCode
async function fetchLeetCodeData(username) {
  try {
    // Clean username - remove spaces and special characters
    const cleanUsername = username.trim().replace(/[^a-zA-Z0-9_-]/g, '');
    
    if (!cleanUsername) {
        return getDefaultLeetCodeData();
    }
    
    // Try multiple LeetCode API endpoints with better error handling
    const endpoints = [
      `https://leetcode-stats-api.herokuapp.com/${cleanUsername}`,
      `https://leetcode-stats-api.vercel.app/${cleanUsername}`,
      `https://leetcode-api.vercel.app/${cleanUsername}`
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetchWithRetry(endpoint, {
          timeout: 6000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Check if the response is valid
          if (data && (data.status === 'success' || data.totalSolved !== undefined)) {
    return {
      totalSolved: data.totalSolved || 0,
      easySolved: data.easySolved || 0,
      mediumSolved: data.mediumSolved || 0,
      hardSolved: data.hardSolved || 0,
      acceptanceRate: data.acceptanceRate || 0,
      rating: data.rating || 0,
      rank: data.ranking || 0,
      contributionPoints: data.contributionPoints || 0,
      reputation: data.reputation || 0
    };
          }
        }
      } catch (endpointError) {
        continue; // Try next endpoint
      }
      
      // Add small delay between endpoints
      await delay(500);
    }
    
    return getDefaultLeetCodeData();
    
  } catch (error) {
    return getDefaultLeetCodeData();
  }
}

// Fetch data from HackerRank (optimized version)
async function fetchHackerRankData(username) {
  try {
    let data = {};
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Referer': 'https://www.hackerrank.com/',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };
    
    // Method 1: Try HackerRank's public profile API (most reliable)
    try {
      const response = await fetchWithRetry(`https://www.hackerrank.com/rest/contests/master/hackers/${username}/profile`, {
        headers,
        timeout: 8000
      });
      
      if (response.ok) {
        const responseData = await response.json();
        
        if (responseData.model) {
          data = {
            totalSolved: responseData.model.solved_challenges || 0,
            rating: responseData.model.rating || 0,
            rank: responseData.model.rank || 0,
            country: responseData.model.country || '',
            school: responseData.model.school || '',
            company: responseData.model.company || '',
            jobTitle: responseData.model.job_title || '',
            bio: responseData.model.bio || ''
          };
        }
      }
    } catch (e) {
      // API failed silently
    }
    
    // Only try additional methods if we don't have data yet
    if (!data.totalSolved || data.totalSolved === 0) {
      // Method 2: Try GraphQL API with shorter timeout
    try {
      const graphqlQuery = {
        query: `
          query getUserProfile($username: String!) {
            user(username: $username) {
              username
              name
              country
              school
              company
              jobTitle
              bio
              profile {
                totalSolved
                rating
                rank
                stars
              }
            }
          }
        `,
        variables: { username }
      };
      
        const response = await fetchWithRetry('https://www.hackerrank.com/api/graphql', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(graphqlQuery),
          timeout: 5000
      });
      
      if (response.ok) {
        const responseData = await response.json();
        
        if (responseData.data && responseData.data.user) {
          const user = responseData.data.user;
          data = {
              totalSolved: user.profile?.totalSolved || data.totalSolved || 0,
              rating: user.profile?.rating || data.rating || 0,
              rank: user.profile?.rank || data.rank || 0,
            stars: user.profile?.stars || 0,
              country: user.country || data.country || '',
              school: user.school || data.school || '',
              company: user.company || data.company || '',
              jobTitle: user.jobTitle || data.jobTitle || '',
              bio: user.bio || data.bio || ''
          };
        }
      }
    } catch (e) {
      // API failed silently
    }
    }
    
    // Return data structure
    return {
      totalSolved: data.totalSolved || 0,
      easySolved: 0, // HackerRank doesn't provide difficulty breakdown
      mediumSolved: 0,
      hardSolved: 0,
      acceptanceRate: 0, // HackerRank doesn't provide acceptance rate
      rating: data.rating || 0,
      rank: data.rank || 0,
      contributionPoints: 0,
      reputation: 0,
      // Platform-specific fields
      stars: data.stars || 0,
      country: data.country || '',
      school: data.school || '',
      company: data.company || '',
      jobTitle: data.jobTitle || '',
      bio: data.bio || ''
    };
    
  } catch (error) {
    return getDefaultHackerRankData();
  }
}

// Fetch data from CodeChef (optimized version)
async function fetchCodeChefData(username) {
  try {
    let data = {};
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Referer': 'https://www.codechef.com/',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };
    
    // Method 1: Try CodeChef's main API endpoint
    try {
      const response = await fetchWithRetry(`https://www.codechef.com/api/users/${username}`, {
        headers,
        timeout: 8000
      });
      
              if (response.ok) {
          const responseData = await response.json();
        
        if (responseData.result && responseData.result.data && responseData.result.data.content) {
          const content = responseData.result.data.content;
          data = {
            totalSolved: content.fully_solved || content.partially_solved || 0,
            rating: content.rating || 0,
            rank: content.global_rank || content.country_rank || 0,
            stars: content.stars || 0,
            country: content.country || '',
            institution: content.institution || '',
            memberSince: content.member_since || '',
            practiceProblems: content.practice_problems || 0,
            contestProblems: content.contest_problems || 0
          };
        }
      }
          } catch (e) {
        // API failed silently
      }
    
    // Only try additional method if we don't have data yet
    if (!data.totalSolved || data.totalSolved === 0) {
      // Method 2: Try profile API with shorter timeout
      try {
        const response = await fetchWithRetry(`https://www.codechef.com/api/users/${username}/profile`, {
          headers,
          timeout: 5000
        });
        
        if (response.ok) {
          const responseData = await response.json();
          
          if (responseData.result && responseData.result.data && responseData.result.data.content) {
            const content = responseData.result.data.content;
            data = {
              totalSolved: content.fully_solved || content.partially_solved || data.totalSolved || 0,
              rating: content.rating || data.rating || 0,
              rank: content.global_rank || content.country_rank || data.rank || 0,
              stars: content.stars || data.stars || 0,
              country: content.country || data.country || '',
              institution: content.institution || data.institution || '',
              memberSince: content.member_since || data.memberSince || '',
              practiceProblems: content.practice_problems || data.practiceProblems || 0,
              contestProblems: content.contest_problems || data.contestProblems || 0
            };
          }
                             }
     } catch (e) {
       // API failed silently
     }
    }
    
    // Return simplified data structure
    return {
      totalSolved: data.totalSolved || 0,
      easySolved: 0,
      mediumSolved: 0,
      hardSolved: 0,
      acceptanceRate: 0,
      rating: data.rating || 0,
      rank: data.rank || 0,
      contributionPoints: 0,
      reputation: 0,
      stars: data.stars || 0,
      country: data.country || '',
      institution: data.institution || '',
      memberSince: data.memberSince || '',
      practiceProblems: data.practiceProblems || 0,
      contestProblems: data.contestProblems || 0
    };
    
  } catch (error) {
    return {
      totalSolved: 0,
      easySolved: 0,
      mediumSolved: 0,
      hardSolved: 0,
      acceptanceRate: 0,
      rating: 0,
      rank: 0,
      contributionPoints: 0,
      reputation: 0,
      stars: 0,
      country: '',
      institution: '',
      memberSince: '',
      practiceProblems: 0,
      contestProblems: 0
    };
  }
}

// Fetch data from GeeksForGeeks
async function fetchGeeksForGeeksData(username) {
  try {
    // Try multiple GeeksForGeeks endpoints for better data retrieval
    let data = {};
    
    // Method 1: Try the main user profile page
    try {
      const response = await fetchWithRetry(`https://www.geeksforgeeks.org/user/${username}`, {
        timeout: 15000
      });
      
      if (response.ok) {
        const html = await response.text();
        
        // Enhanced pattern matching for GeeksForGeeks
        const patterns = [
          /Problems Solved[^>]*>(\d+)/i,
          /Total Problems Solved[^>]*>(\d+)/i,
          /Coding Score[^>]*>(\d+)/i,
          /Rating[^>]*>(\d+)/i
        ];
        
        for (const pattern of patterns) {
          const match = html.match(pattern);
          if (match) {
            const number = parseInt(match[1]);
            if (pattern.toString().includes('Problems') || pattern.toString().includes('Solved')) {
              data.totalSolved = number;
            } else if (pattern.toString().includes('Score') || pattern.toString().includes('Rating')) {
              data.rating = number;
            }
          }
        }
      }
    } catch (e) {
      // Main profile page failed, try alternative
    }
    
    // Method 2: Try the practice page if no data found
    if (!data.totalSolved || data.totalSolved === 0) {
      try {
        const practiceResponse = await fetchWithRetry(`https://practice.geeksforgeeks.org/user/${username}`, {
          timeout: 15000
        });
        
        if (practiceResponse.ok) {
          const practiceHtml = await practiceResponse.text();
          
          // Look for practice-specific patterns
          const practiceMatch = practiceHtml.match(/Problems Solved[^>]*>(\d+)/i);
          if (practiceMatch) {
            data.totalSolved = parseInt(practiceMatch[1]);
          }
        }
      } catch (e) {
        // Practice page failed
      }
    }
    
    // Method 3: Try the auth.geeksforgeeks.org endpoint as fallback
    if (!data.totalSolved || data.totalSolved === 0) {
      try {
        const authResponse = await fetchWithRetry(`https://auth.geeksforgeeks.org/user/${username}/?tab=profile`, {
          timeout: 15000
        });
        
        if (authResponse.ok) {
          const authHtml = await authResponse.text();
          
          // Parse auth endpoint HTML
          const totalSolvedMatch = authHtml.match(/Problems Solved<\/span>\s*<span[^>]*>(\d+)/);
          const ratingMatch = authHtml.match(/Coding Score<\/span>\s*<span[^>]*>(\d+)/);
          
          if (totalSolvedMatch) {
            data.totalSolved = parseInt(totalSolvedMatch[1]);
          }
          if (ratingMatch) {
            data.rating = parseInt(ratingMatch[1]);
          }
        }
      } catch (e) {
        // Auth endpoint failed
      }
    }
    
    return {
      totalSolved: data.totalSolved || 0,
      easySolved: 0, // GeeksForGeeks doesn't provide difficulty breakdown
      mediumSolved: 0,
      hardSolved: 0,
      acceptanceRate: 0, // GeeksForGeeks doesn't provide acceptance rate
      rating: data.rating || 0,
      rank: 0, // GeeksForGeeks doesn't provide rank
      contributionPoints: 0,
      reputation: 0
    };
    
  } catch (error) {
    return getDefaultGeeksForGeeksData();
  }
}

// Helper function to get default GeeksForGeeks data
function getDefaultGeeksForGeeksData() {
  return {
    totalSolved: 0,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
    acceptanceRate: 0,
    rating: 0,
    rank: 0,
    contributionPoints: 0,
    reputation: 0
  };
}

// Fetch data from AtCoder
async function fetchAtCoderData(username) {
  try {
    // AtCoder public profile API
    const response = await fetch(`https://atcoder.jp/users/${username}`);
    
    if (!response.ok) {
      throw new Error(`AtCoder API error: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Parse HTML to extract data
    const ratingMatch = html.match(/<th[^>]*>Rating<\/th>\s*<td[^>]*>(\d+)/);
    const rankMatch = html.match(/<th[^>]*>Rank<\/th>\s*<td[^>]*>(\d+)/);
    
    return {
      totalSolved: 0, // AtCoder doesn't provide total solved count easily
      easySolved: 0, // AtCoder doesn't provide difficulty breakdown
      mediumSolved: 0,
      hardSolved: 0,
      acceptanceRate: 0, // AtCoder doesn't provide acceptance rate
      rating: ratingMatch ? parseInt(ratingMatch[1]) : 0,
      rank: rankMatch ? parseInt(rankMatch[1]) : 0,
      contributionPoints: 0,
      reputation: 0
    };
    
  } catch (error) {
    // Return complete default values for consistency
    return {
      totalSolved: 0,
      easySolved: 0,
      mediumSolved: 0,
      hardSolved: 0,
      acceptanceRate: 0,
      rating: 0,
      rank: 0,
      contributionPoints: 0,
      reputation: 0
    };
  }
}

// Generic platform data fetcher
async function fetchGenericPlatformData(apiEndpoint, username, apiKey) {
  try {
    if (!apiEndpoint) {
      throw new Error('No API endpoint provided');
    }
    
    const headers = {
      'Content-Type': 'application/json'
  };
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    const response = await fetch(`${apiEndpoint}/user/${username}`, {
      headers
    });
    
    const data = await response.json();
    
    return {
      totalSolved: data.totalSolved || data.problems_solved || data.solved_count || 0,
      easySolved: data.easySolved || data.easy_solved || 0,
      mediumSolved: data.mediumSolved || data.medium_solved || 0,
      hardSolved: data.hardSolved || data.hard_solved || 0,
      acceptanceRate: data.acceptanceRate || data.acceptance_rate || 0,
      rating: data.rating || data.score || 0,
      rank: data.rank || data.position || 0,
      contributionPoints: data.contributionPoints || data.contribution_points || 0,
      reputation: data.reputation || 0
    };
    
  } catch (error) {
    // Return complete default values for consistency
    return {
      totalSolved: 0,
      easySolved: 0,
      mediumSolved: 0,
      hardSolved: 0,
      acceptanceRate: 0,
      rating: 0,
      rank: 0,
      contributionPoints: 0,
      reputation: 0
    };
  }
}

// Bulk upload coding profiles (Super Admin only)
export const bulkUploadCodingProfiles = async (req, res) => {
  try {
    const { profiles } = req.body; // Array of {userId, platformId, username, profileUrl}
    
    if (!Array.isArray(profiles) || profiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid profiles data'
      });
    }
    
    const results = [];
    
    for (const profile of profiles) {
      try {
        // Create a mock request and response object for upsertCodingProfile
        const mockReq = { body: profile };
        const mockRes = {
          json: (data) => {
            results.push({
              success: true,
              profile: profile,
              data: data
            });
          },
          status: (code) => ({
            json: (data) => {
              results.push({
                success: false,
                profile: profile,
                error: data.message || 'Failed to create profile'
              });
            }
          })
        };
        
        await upsertCodingProfile(mockReq, mockRes);
      } catch (error) {
        results.push({
          success: false,
          profile: profile,
          error: error.message || 'Unknown error occurred'
        });
      }
    }
    
    // Count successful and failed operations
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    res.json({
      success: true,
      message: `Bulk upload completed. ${successful} profiles created/updated, ${failed} failed.`,
      results: results,
      summary: {
        total: profiles.length,
        successful: successful,
        failed: failed
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process bulk upload'
    });
  }
};

// Delete coding profile (Super Admin only)
export const deleteCodingProfile = async (req, res) => {
  try {
    const { profileId } = req.params;
    
    // Check if profile exists
    const [existing] = await pool.execute(
      'SELECT id, user_id, platform_id FROM coding_profiles WHERE id = ?',
      [profileId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Coding profile not found'
      });
    }
    
    // Delete the profile
    await pool.execute(
      'DELETE FROM coding_profiles WHERE id = ?',
      [profileId]
    );
    
    res.json({
      success: true,
      message: 'Coding profile deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete coding profile'
    });
  }
};

// Get coding profiles for Super Admin
export const getAllCodingProfiles = async (req, res) => {
  try {
    const [profiles] = await pool.execute(`
      SELECT 
        cp.id,
        cp.user_id,
        cp.platform_id,
        cp.username,
        cp.profile_url,
        cp.total_solved,
        cp.easy_solved,
        cp.medium_solved,
        cp.hard_solved,
        cp.last_updated,
        cp.is_active,
        cp.created_at,
        cp.updated_at,
        u.name as user_name,
        u.email as user_email,
        u.student_id,
        u.college_id,
        u.department as department_name,
        u.batch,
        c.name as college_name,
        cpl.display_name as platform_name,
        cpl.name as platform_key,
        cpl.base_url as platform_url
      FROM coding_profiles cp
      JOIN users u ON cp.user_id = u.id
      LEFT JOIN colleges c ON u.college_id = c.id
      JOIN coding_platforms cpl ON cp.platform_id = cpl.id
      WHERE cp.is_active = TRUE
      ORDER BY u.name, cpl.display_name
    `);
    
    res.json({
      success: true,
      data: profiles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coding profiles'
    });
  }
};

// Helper function to get default HackerRank data
function getDefaultHackerRankData() {
  return {
    totalSolved: 0,
    rating: 0,
    rank: 0,
    stars: 0,
    country: '',
    school: '',
    company: '',
    jobTitle: '',
    bio: ''
  };
}

// Retry mechanism for fetch requests
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          ...options.headers
        }
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      
      if (attempt === maxRetries) {
        throw new Error(`Failed to fetch ${url} after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Exponential backoff with jitter
      const delay = Math.min(1000 * Math.pow(2, attempt - 1) + Math.random() * 1000, 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Helper function to get default LeetCode data
function getDefaultLeetCodeData() {
  return {
    totalSolved: 0,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
    acceptanceRate: 0,
    rating: 0,
    rank: 0,
    contributionPoints: 0,
    reputation: 0
  };
}

// Helper function to get default platform data
function getDefaultPlatformData() {
  return {
    totalSolved: 0,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
    acceptanceRate: 0,
    rating: 0,
    rank: 0,
    contributionPoints: 0,
    reputation: 0,
    responseTime: 0
  };
}

// High-performance bulk refresh for 5000+ profiles
export const bulkRefreshCodingProfiles = async (req, res) => {
  try {
    const { profileIds, maxConcurrency = 100 } = req.body; // High concurrency for large datasets
    
    if (!Array.isArray(profileIds) || profileIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid profile IDs provided'
      });
    }
    
    
    // Get profiles to refresh
    const [profiles] = await pool.execute(`
      SELECT cp.id, cp.user_id, cp.platform_id, cp.username, cpl.name as platform_name
      FROM coding_profiles cp
      JOIN coding_platforms cpl ON cp.platform_id = cpl.id
      WHERE cp.id IN (${profileIds.map(() => '?').join(',')}) AND cp.is_active = TRUE
    `, profileIds);
    
    if (profiles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No valid profiles found to refresh'
      });
    }
    
    // Process all profiles with controlled concurrency
    const results = await processProfilesWithConcurrency(profiles, maxConcurrency);
    
    // Count successful and failed operations
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    
    res.json({
      success: true,
      message: `Bulk refresh completed. ${successful} profiles refreshed successfully, ${failed} failed.`,
      results: results,
      summary: {
        total: profiles.length,
        successful: successful,
        failed: failed
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process bulk refresh'
    });
  }
};

// Process profiles with controlled concurrency for high performance
async function processProfilesWithConcurrency(profiles, maxConcurrency) {
  const results = [];
  const executing = new Set();
  let completed = 0;
  
  
  for (const profile of profiles) {
    // Wait if we've reached max concurrency
    if (executing.size >= maxConcurrency) {
      await Promise.race(executing);
    }
    
    const promise = processProfile(profile).finally(() => {
      executing.delete(promise);
      completed++;
    });
    
    executing.add(promise);
    results.push(promise);
  }
  
  // Wait for all remaining promises to complete
  return Promise.allSettled(results).then(settledResults => 
    settledResults.map(result => result.status === 'fulfilled' ? result.value : {
      success: false,
      error: 'Promise rejected'
    })
  );
}

// Process individual profile with optimized database operations
async function processProfile(profile) {
  try {
    const startTime = Date.now();
    
    // Validate profile data
    if (!profile.username || !profile.platform_id) {
      throw new Error('Invalid profile data: missing username or platform_id');
    }
    
    // Clean username
    const cleanUsername = profile.username.trim();
    if (!cleanUsername) {
      throw new Error('Empty username');
    }
    
    // Fetch data from platform
    const realData = await fetchPlatformData(profile.platform_id, cleanUsername);
    
    // Update profile with fetched data using prepared statement
    const updateData = [
      realData.totalSolved || 0,
      realData.easySolved || 0,
      realData.mediumSolved || 0,
      realData.hardSolved || 0,
      realData.acceptanceRate || 0,
      realData.rating || 0,
      realData.rank || 0,
      realData.contributionPoints || 0,
      realData.reputation || 0,
      realData.stars || 0,
      realData.country || '',
      realData.institution || '',
      realData.memberSince || '',
      realData.practiceProblems || 0,
      realData.contestProblems || 0,
      realData.school || '',
      realData.company || '',
      realData.jobTitle || '',
      realData.bio || '',
      profile.id
    ];
    
    await pool.execute(`
      UPDATE coding_profiles
      SET total_solved = ?, easy_solved = ?, medium_solved = ?, hard_solved = ?,
          acceptance_rate = ?, rating = ?, \`rank\` = ?, 
          contribution_points = ?, reputation = ?, 
          stars = ?, country = ?, institution = ?, member_since = ?,
          practice_problems = ?, contest_problems = ?, school = ?, 
          company = ?, job_title = ?, bio = ?, last_updated = CURRENT_TIMESTAMP
      WHERE id = ?
    `, updateData);
    
    const responseTime = Date.now() - startTime;
    
    // Log successful API request (async, don't wait)
    pool.execute(`
      INSERT INTO coding_api_logs (id, platform_id, user_id, request_type, status, response_time_ms)
      VALUES (?, ?, ?, 'bulk', 'success', ?)
    `, [uuidv4(), profile.platform_id, profile.user_id, responseTime]).catch(err => 
    );
    
    return {
      success: true,
      profileId: profile.id,
      platformName: profile.platform_name,
      username: profile.username,
      responseTime,
      data: realData
    };
  } catch (error) {
    
    // Log failed API request (async, don't wait)
    pool.execute(`
      INSERT INTO coding_api_logs (id, platform_id, user_id, request_type, status, error_message)
      VALUES (?, ?, ?, 'bulk', 'failed', ?)
    `, [uuidv4(), profile.platform_id, profile.user_id, error.message || 'Unknown error']).catch(err => 
    );
    
    return {
      success: false,
      profileId: profile.id,
      platformName: profile.platform_name,
      username: profile.username,
      error: error.message || 'Failed to refresh profile'
    };
  }
}

// Streaming bulk refresh with real-time progress updates
export const streamingBulkRefresh = async (req, res) => {
  try {
    const { profileIds, maxConcurrency = 100 } = req.body;
    
    if (!Array.isArray(profileIds) || profileIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid profile IDs provided'
      });
    }
    
    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });
    
    // Send initial progress
    res.write(`data: ${JSON.stringify({
      type: 'start',
      total: profileIds.length,
      message: 'Starting bulk refresh...'
    })}\n\n`);
    
    // Get profiles to refresh
    const [profiles] = await pool.execute(`
      SELECT cp.id, cp.user_id, cp.platform_id, cp.username, cpl.name as platform_name
      FROM coding_profiles cp
      JOIN coding_platforms cpl ON cp.platform_id = cpl.id
      WHERE cp.id IN (${profileIds.map(() => '?').join(',')}) AND cp.is_active = TRUE
    `, profileIds);
    
    if (profiles.length === 0) {
      res.write(`data: ${JSON.stringify({
        type: 'error',
        message: 'No valid profiles found to refresh'
      })}\n\n`);
      res.end();
      return;
    }
    
    // Process profiles with streaming updates
    const results = await processProfilesWithStreaming(profiles, maxConcurrency, res);
    
    // Send final results
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    res.write(`data: ${JSON.stringify({
      type: 'complete',
      summary: {
        total: profiles.length,
        successful: successful,
        failed: failed
      },
      message: `Bulk refresh completed. ${successful} profiles refreshed successfully, ${failed} failed.`
    })}\n\n`);
    
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({
      type: 'error',
      message: 'Failed to process bulk refresh',
      error: error.message
    })}\n\n`);
    res.end();
  }
};

// Process profiles with streaming progress updates
async function processProfilesWithStreaming(profiles, maxConcurrency, res) {
  const results = [];
  const executing = new Set();
  let completed = 0;
  let successful = 0;
  let failed = 0;
  
  for (const profile of profiles) {
    // Wait if we've reached max concurrency
    if (executing.size >= maxConcurrency) {
      await Promise.race(executing);
    }
    
    const promise = processProfile(profile).then(result => {
      completed++;
      if (result.success) successful++;
      else failed++;
      
      // Send progress update every 10 profiles or at completion
      if (completed % 10 === 0 || completed === profiles.length) {
        res.write(`data: ${JSON.stringify({
          type: 'progress',
          completed: completed,
          total: profiles.length,
          successful: successful,
          failed: failed,
          percentage: Math.round((completed / profiles.length) * 100)
        })}\n\n`);
      }
      
      return result;
    }).finally(() => {
      executing.delete(promise);
    });
    
    executing.add(promise);
    results.push(promise);
  }
  
  // Wait for all remaining promises to complete
  return Promise.allSettled(results).then(settledResults => 
    settledResults.map(result => result.status === 'fulfilled' ? result.value : {
      success: false,
      error: 'Promise rejected'
    })
  );
}

// Test data fetching for a specific profile
export const testProfileFetch = async (req, res) => {
  try {
    const { platformId, username } = req.params;
    
    if (!platformId || !username) {
      return res.status(400).json({
        success: false,
        message: 'Platform ID and username are required'
      });
    }
    
    
    const startTime = Date.now();
    const data = await fetchPlatformData(platformId, username);
    const responseTime = Date.now() - startTime;
    
    res.json({
      success: true,
      data: {
        platformId,
        username,
        fetchedData: data,
        responseTime,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to test profile fetch',
      error: error.message
    });
  }
};

// Health check for coding platforms
export const checkPlatformHealth = async (req, res) => {
  try {
    const platforms = ['leetcode', 'hackerrank', 'codechef', 'geeksforgeeks'];
    const healthStatus = {};
    
    for (const platform of platforms) {
      try {
        const startTime = Date.now();
        let testResponse;
        
        // Test each platform with a known endpoint
        switch (platform) {
          case 'leetcode':
            testResponse = await fetchWithRetry('https://leetcode-stats-api.herokuapp.com/testuser', {
              timeout: 5000
            });
            break;
          case 'hackerrank':
            testResponse = await fetchWithRetry('https://www.hackerrank.com/rest/contests/master/hackers/testuser/profile', {
              timeout: 5000
            });
            break;
                  case 'codechef':
          testResponse = await fetchWithRetry('https://www.codechef.com/api/users/testuser', {
            timeout: 5000
          });
          break;
        case 'geeksforgeeks':
          testResponse = await fetchWithRetry('https://www.geeksforgeeks.org/user/testuser', {
            timeout: 5000
          });
          break;
        }
        
        const responseTime = Date.now() - startTime;
        
        healthStatus[platform] = {
          status: testResponse.ok ? 'healthy' : 'unhealthy',
          responseTime,
          lastChecked: new Date().toISOString()
        };
      } catch (error) {
        healthStatus[platform] = {
          status: 'down',
          error: error.message,
          lastChecked: new Date().toISOString()
        };
      }
    }
    
    res.json({
      success: true,
      data: healthStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check platform health'
    });
  }
};
