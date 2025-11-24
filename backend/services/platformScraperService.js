import axios from 'axios';
import * as cheerio from 'cheerio';

class PlatformScraperService {
  constructor() {
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
    ];
    this.currentUserAgentIndex = 0;
  }

  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  getHeaders() {
    return {
      'User-Agent': this.getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0'
    };
  }

  async scrapeLeetCode(username) {
    try {
      const url = `https://leetcode.com/u/${username}/`;
      
      // Try multiple approaches for LeetCode
      const approaches = [
        // Approach 1: Direct profile URL
        () => axios.get(url, {
          headers: this.getHeaders(),
          timeout: 15000,
          maxRedirects: 5
        }),
        // Approach 2: GraphQL API endpoint (if available)
        () => axios.post('https://leetcode.com/graphql', {
          query: `
            query userProfile($username: String!) {
              userProfile(username: $username) {
                username
                profile {
                  userAvatar
                  ranking
                  realName
                }
                submitStats {
                  acSubmissionNum {
                    difficulty
                    count
                  }
                }
              }
            }
          `,
          variables: { username }
        }, {
          headers: {
            ...this.getHeaders(),
            'Content-Type': 'application/json',
            'Referer': 'https://leetcode.com/',
            'Origin': 'https://leetcode.com'
          },
          timeout: 15000
        })
      ];

      let response;
      let isGraphQL = false;

      for (let i = 0; i < approaches.length; i++) {
        try {
          response = await approaches[i]();
          isGraphQL = i === 1;
          break;
        } catch (error) {
          if (i === approaches.length - 1) throw error;
          // console.log(`LeetCode approach ${i + 1} failed, trying next...`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait before retry
        }
      }

      if (isGraphQL && response.data?.data?.userProfile) {
        // Parse GraphQL response
        const profile = response.data.data.userProfile;
        const submitStats = profile.submitStats?.acSubmissionNum || [];
        const totalSolved = submitStats.reduce((sum, stat) => sum + stat.count, 0);
        
        return {
          problemsSolved: totalSolved,
          contestRating: 0, // Would need separate API call
          acceptanceRate: 'N/A',
          ranking: profile.profile?.ranking || 'N/A'
        };
      } else {
        // Parse HTML response
        const $ = cheerio.load(response.data);
        
        // Try multiple selectors for LeetCode data
        let problemsSolved = 0;
        let contestRating = 0;
        
        // Look for problems solved in various possible locations
        $('.text-2xl.font-semibold, .text-xl.font-semibold, [data-testid="problems-solved"]').each((i, element) => {
          const text = $(element).text().trim();
          const match = text.match(/(\d+)/);
          if (match && !problemsSolved) {
            problemsSolved = parseInt(match[1]);
          }
        });
        
        // Look for contest rating
        $('.text-lg.font-medium, [data-testid="contest-rating"]').each((i, element) => {
          const text = $(element).text().trim();
          const match = text.match(/(\d+)/);
          if (match && !contestRating) {
            contestRating = parseInt(match[1]);
          }
        });
        
        return {
          problemsSolved: problemsSolved,
          contestRating: contestRating,
          acceptanceRate: 'N/A',
          ranking: 'N/A'
        };
      }
    } catch (error) {
      // console.error('Error scraping LeetCode:', error.message);
      
      // Return fallback data with a note that scraping failed
      return {
        problemsSolved: 0,
        contestRating: 0,
        acceptanceRate: 'N/A',
        ranking: 'N/A',
        error: 'Unable to fetch data - profile may be private or blocked'
      };
    }
  }

  async scrapeCodeChef(username) {
    try {
      const url = `https://www.codechef.com/users/${username}`;
      const response = await axios.get(url, {
        headers: this.getHeaders(),
        timeout: 15000,
        maxRedirects: 5
      });

      const $ = cheerio.load(response.data);
      
      // Extract data from CodeChef profile - looking for the specific HTML structure you provided
      let problemsSolved = 0;
      $('h3').each((i, element) => {
        const text = $(element).text();
        if (text.includes('Total Problems Solved')) {
          const match = text.match(/(\d+)/);
          if (match) {
            problemsSolved = parseInt(match[1]);
          }
        }
      });
      
      const currentRating = $('.rating-number').text().trim() || '0';
      
      return {
        problemsSolved: problemsSolved,
        currentRating: parseInt(currentRating) || 0,
        highestRating: parseInt(currentRating) || 0, // Would need separate scraping
        globalRanking: 'N/A' // Would need separate scraping
      };
    } catch (error) {
      // console.error('Error scraping CodeChef:', error.message);
      return {
        problemsSolved: 0,
        currentRating: 0,
        highestRating: 0,
        globalRanking: 'N/A'
      };
    }
  }

  async scrapeHackerEarth(username) {
    try {
      const url = `https://www.hackerearth.com/@${username}`;
      const response = await axios.get(url, {
        headers: this.getHeaders(),
        timeout: 15000,
        maxRedirects: 5
      });

      const $ = cheerio.load(response.data);
      
      // Extract data from HackerEarth profile based on your HTML structure
      let points = 0, contestRatings = 0, problemsSolved = 0, solutionsSubmitted = 0;
      
      // Look for the specific card structure you provided
      $('.text-xl.font-semibold').each((i, element) => {
        const value = parseInt($(element).text().trim()) || 0;
        const parentText = $(element).parent().text();
        
        if (parentText.includes('Points')) {
          points = value;
        } else if (parentText.includes('Contest Ratings')) {
          contestRatings = value;
        } else if (parentText.includes('Problems Solved')) {
          problemsSolved = value;
        } else if (parentText.includes('Solutions Submitted')) {
          solutionsSubmitted = value;
        }
      });
      
      return {
        points: points,
        contestRatings: contestRatings,
        problemsSolved: problemsSolved,
        solutionsSubmitted: solutionsSubmitted
      };
    } catch (error) {
      // console.error('Error scraping HackerEarth:', error.message);
      return {
        points: 0,
        contestRatings: 0,
        problemsSolved: 0,
        solutionsSubmitted: 0
      };
    }
  }

  async scrapeHackerRank(username) {
    try {
      const url = `https://www.hackerrank.com/profile/${username}`;
      const response = await axios.get(url, {
        headers: this.getHeaders(),
        timeout: 15000,
        maxRedirects: 5
      });

      const $ = cheerio.load(response.data);
      
      // Extract badges and stars
      const badges = [];
      $('.hacker-badge').each((i, element) => {
        const badgeName = $(element).find('.badge-title').text().trim();
        const stars = $(element).find('.badge-star').length;
        if (badgeName) {
          badges.push({ name: badgeName, stars });
        }
      });
      
      return {
        problemsSolved: badges.length * 10, // Estimate based on badges
        badges: badges,
        skillsVerified: badges.length,
        totalStars: badges.reduce((sum, badge) => sum + badge.stars, 0)
      };
    } catch (error) {
      // console.error('Error scraping HackerRank:', error.message);
      return {
        problemsSolved: 0,
        badges: [],
        skillsVerified: 0,
        totalStars: 0
      };
    }
  }

  async scrapeGeeksforGeeks(username) {
    try {
      const url = `https://www.geeksforgeeks.org/user/${username}`;
      const response = await axios.get(url, {
        headers: this.getHeaders(),
        timeout: 15000,
        maxRedirects: 5
      });

      const $ = cheerio.load(response.data);
      
      // Extract problems solved by difficulty based on your HTML structure
      let problemsSolved = 0;
      $('.scoreCard_head_left--score__oSi_x').each((i, element) => {
        const value = parseInt($(element).text().trim()) || 0;
        if (i === 0) { // First score card is usually total problems solved
          problemsSolved = value;
        }
      });
      
      // Extract difficulty breakdown from the navbar structure you provided
      const difficultyStats = {
        school: 0,
        basic: 0,
        easy: 0,
        medium: 0,
        hard: 0
      };
      
      $('.problemNavbar_head_nav--text__UaGCx').each((i, element) => {
        const text = $(element).text();
        const match = text.match(/(\w+)\s*\((\d+)\)/);
        if (match) {
          const difficulty = match[1].toLowerCase();
          const count = parseInt(match[2]);
          if (difficultyStats.hasOwnProperty(difficulty)) {
            difficultyStats[difficulty] = count;
          }
        }
      });
      
      return {
        problemsSolved: problemsSolved,
        difficultyBreakdown: difficultyStats,
        articlesWritten: 0 // Would need separate scraping
      };
    } catch (error) {
      // console.error('Error scraping GeeksforGeeks:', error.message);
      return {
        problemsSolved: 0,
        difficultyBreakdown: {
          school: 0,
          basic: 0,
          easy: 0,
          medium: 0,
          hard: 0
        },
        articlesWritten: 0
      };
    }
  }

  async scrapeAllPlatforms(profiles) {
    const results = {};
    
    for (const [platform, data] of Object.entries(profiles)) {
      if (!data.username) continue;
      
      try {
        switch (platform.toLowerCase()) {
          case 'leetcode':
            results[platform] = await this.scrapeLeetCode(data.username);
            break;
          case 'codechef':
            results[platform] = await this.scrapeCodeChef(data.username);
            break;
          case 'hackerearth':
            results[platform] = await this.scrapeHackerEarth(data.username);
            break;
          case 'hackerrank':
            results[platform] = await this.scrapeHackerRank(data.username);
            break;
          case 'geeksforgeeks':
            results[platform] = await this.scrapeGeeksforGeeks(data.username);
            break;
        }
        
        // Add delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        // console.error(`Error scraping ${platform}:`, error.message);
        results[platform] = null;
      }
    }
    
    return results;
  }
}

export default new PlatformScraperService();
