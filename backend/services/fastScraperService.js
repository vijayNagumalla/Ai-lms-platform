import axios from 'axios';
import * as cheerio from 'cheerio';

class FastScraperService {
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
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
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
      // Try multiple GraphQL endpoints and queries
      const queries = [
        {
          query: `
            query userProblemsSolved($username: String!) {
              matchedUser(username: $username) {
                submitStatsGlobal {
                  acSubmissionNum {
                    difficulty
                    count
                    submissions
                  }
                }
                profile {
                  ranking
                }
              }
            }
          `,
          variables: { username }
        },
        {
          query: `
            query getUserProfile($username: String!) {
              allQuestionsCount {
                difficulty
                count
              }
              matchedUser(username: $username) {
                submitStatsGlobal {
                  acSubmissionNum {
                    difficulty
                    count
                    submissions
                  }
                }
                profile {
                  ranking
                }
              }
            }
          `,
          variables: { username }
        }
      ];

      // Try each GraphQL query
      for (const graphqlQuery of queries) {
        try {
          const response = await axios.post('https://leetcode.com/graphql/', graphqlQuery, {
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': this.getRandomUserAgent(),
              'Referer': `https://leetcode.com/u/${username}/`,
              'Origin': 'https://leetcode.com',
              'Accept': 'application/json',
              'Accept-Language': 'en-US,en;q=0.9',
              'Accept-Encoding': 'gzip, deflate, br',
              'Connection': 'keep-alive',
              'Sec-Fetch-Dest': 'empty',
              'Sec-Fetch-Mode': 'cors',
              'Sec-Fetch-Site': 'same-origin',
              'X-Requested-With': 'XMLHttpRequest'
            },
            timeout: 15000
          });

          if (response.data?.data?.matchedUser) {
            const user = response.data.data.matchedUser;
            const stats = user.submitStatsGlobal?.acSubmissionNum || [];
            
            let problemsSolved = 0;
            let easySolved = 0;
            let mediumSolved = 0;
            let hardSolved = 0;
            let rank = user.profile?.ranking || 'N/A';

            stats.forEach(stat => {
              const count = stat.count || 0;
              
              switch (stat.difficulty) {
                case 'Easy':
                  easySolved = count;
                  break;
                case 'Medium':
                  mediumSolved = count;
                  break;
                case 'Hard':
                  hardSolved = count;
                  break;
              }
            });
            
            // Calculate total from individual counts
            problemsSolved = easySolved + mediumSolved + hardSolved;

            // Only return if we got valid data
            if (problemsSolved > 0 || easySolved > 0 || mediumSolved > 0 || hardSolved > 0) {
              return {
                username: username,
                profile_url: `https://leetcode.com/u/${username}/`,
                problemsSolved,
                easySolved,
                mediumSolved,
                hardSolved,
                rank: rank.toString(),
                source: 'leetcode-graphql'
              };
            }
          }
        } catch (graphqlError) {
          // Continue to next query
          continue;
        }
      }

      // Fallback: Try direct HTML scraping with better selectors
      const htmlResponse = await axios.get(`https://leetcode.com/u/${username}/`, {
        headers: this.getHeaders(),
        timeout: 15000,
        maxRedirects: 5
      });

      const $ = cheerio.load(htmlResponse.data);
      
      let problemsSolved = 0;
      let easySolved = 0;
      let mediumSolved = 0;
      let hardSolved = 0;
      let rank = 'N/A';

      // Look for data in script tags (LeetCode loads data dynamically)
      $('script').each((i, script) => {
        const scriptContent = $(script).html();
        if (scriptContent) {
          // Try to extract data from JavaScript variables
          const problemsMatch = scriptContent.match(/problemsSolved["\s]*:["\s]*(\d+)/i);
          if (problemsMatch) problemsSolved = parseInt(problemsMatch[1]);
          
          const easyMatch = scriptContent.match(/easySolved["\s]*:["\s]*(\d+)/i);
          if (easyMatch) easySolved = parseInt(easyMatch[1]);
          
          const mediumMatch = scriptContent.match(/mediumSolved["\s]*:["\s]*(\d+)/i);
          if (mediumMatch) mediumSolved = parseInt(mediumMatch[1]);
          
          const hardMatch = scriptContent.match(/hardSolved["\s]*:["\s]*(\d+)/i);
          if (hardMatch) hardSolved = parseInt(hardMatch[1]);
          
          const rankMatch = scriptContent.match(/ranking["\s]*:["\s]*(\d+)/i);
          if (rankMatch) rank = rankMatch[1];
        }
      });

      // Fallback: Look for HTML elements with multiple selectors
      if (problemsSolved === 0) {
        // Try different selectors for problems solved
        const selectors = ['.text-label-1', '.text-2xl', '.text-3xl', '.font-medium', '.font-semibold'];
        
        for (const selector of selectors) {
          $(selector).each((i, element) => {
            const text = $(element).text();
            const match = text.match(/(\d+)/);
            if (match && !problemsSolved) {
              problemsSolved = parseInt(match[1]);
            }
          });
          if (problemsSolved > 0) break;
        }
      }

      // Extract difficulty breakdown with multiple selectors
      if (easySolved === 0 || mediumSolved === 0 || hardSolved === 0) {
        // Try different selectors for difficulty breakdown
        const difficultySelectors = ['.text-sd-easy', '.text-green-600', '.text-green-500'];
        const mediumSelectors = ['.text-sd-medium', '.text-yellow-600', '.text-yellow-500'];
        const hardSelectors = ['.text-sd-hard', '.text-red-600', '.text-red-500'];
        
        // Easy problems
        for (const selector of difficultySelectors) {
          $(selector).next().each((i, element) => {
            const text = $(element).text();
            const match = text.match(/(\d+)\/\d+/);
            if (match && !easySolved) {
              easySolved = parseInt(match[1]);
            }
          });
          if (easySolved > 0) break;
        }
        
        // Medium problems
        for (const selector of mediumSelectors) {
          $(selector).next().each((i, element) => {
            const text = $(element).text();
            const match = text.match(/(\d+)\/\d+/);
            if (match && !mediumSolved) {
              mediumSolved = parseInt(match[1]);
            }
          });
          if (mediumSolved > 0) break;
        }
        
        // Hard problems
        for (const selector of hardSelectors) {
          $(selector).next().each((i, element) => {
            const text = $(element).text();
            const match = text.match(/(\d+)\/\d+/);
            if (match && !hardSolved) {
              hardSolved = parseInt(match[1]);
            }
          });
          if (hardSolved > 0) break;
        }
      }

      // Extract rank with multiple methods
      if (rank === 'N/A') {
        // Method 1: Look for spans with "Rank" text
        $('span:contains("Rank")').next('span').each((i, element) => {
          const text = $(element).text().trim();
          if (text.match(/^\d+(?:,\d+)*$/)) {
            rank = text.replace(/,/g, '');
          }
        });
        
        // Method 2: Look for any element containing rank data
        if (rank === 'N/A') {
          $('*').each((i, element) => {
            const text = $(element).text();
            if (text.includes('Rank') && text.match(/\d+/)) {
              const match = text.match(/(\d+(?:,\d+)*)/);
              if (match) {
                rank = match[1].replace(/,/g, '');
              }
            }
          });
        }
      }

      return {
        username: username,
        profile_url: `https://leetcode.com/u/${username}/`,
        problemsSolved,
        easySolved,
        mediumSolved,
        hardSolved,
        rank,
        source: 'leetcode-http'
      };
    } catch (error) {
      return {
        username: username,
        profile_url: `https://leetcode.com/u/${username}/`,
        problemsSolved: 0,
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 0,
        rank: 'N/A',
        error: 'Unable to fetch data'
      };
    }
  }

  async scrapeCodeChef(username) {
    try {
      const url = `https://www.codechef.com/users/${username}`;
      const response = await axios.get(url, {
        headers: this.getHeaders(),
        timeout: 10000,
        maxRedirects: 5
      });

      const $ = cheerio.load(response.data);
      
      let problemsSolved = 0;
      let currentRating = 0;

      // Fast extraction
      $('h3:contains("Total Problems Solved")').each((i, element) => {
        const text = $(element).text();
        const match = text.match(/(\d+)/);
        if (match) problemsSolved = parseInt(match[1]);
      });

      $('.rating-number').each((i, element) => {
        const text = $(element).text().trim();
        const match = text.match(/(\d+)/);
        if (match) currentRating = parseInt(match[1]);
      });

      return {
        username: username,
        profile_url: `https://www.codechef.com/users/${username}`,
        problemsSolved,
        currentRating,
        source: 'fast-http'
      };
    } catch (error) {
      return {
        username: username,
        profile_url: `https://www.codechef.com/users/${username}`,
        problemsSolved: 0,
        currentRating: 0,
        error: 'Unable to fetch data'
      };
    }
  }

  async scrapeHackerRank(username) {
    try {
      const url = `https://www.hackerrank.com/profile/${username}`;
      const response = await axios.get(url, {
        headers: this.getHeaders(),
        timeout: 10000,
        maxRedirects: 5
      });

      const $ = cheerio.load(response.data);
      
      const badges = [];
      let badgesCount = 0;

      // Fast badge extraction
      $('.hacker-badge').each((i, element) => {
        const badgeName = $(element).find('.badge-title').text().trim();
        const stars = $(element).find('.badge-star').length;
        const level = $(element).find('.ui-badge').attr('class')?.includes('bronze') ? 'Bronze' : 
                     $(element).find('.ui-badge').attr('class')?.includes('silver') ? 'Silver' : 
                     $(element).find('.ui-badge').attr('class')?.includes('gold') ? 'Gold' : 'Unknown';
        
        if (badgeName) {
          badges.push({ name: badgeName, stars, level });
          badgesCount++;
        }
      });

      return {
        username: username,
        profile_url: `https://www.hackerrank.com/profile/${username}`,
        problemsSolved: badgesCount,
        badges,
        totalStars: badges.reduce((sum, badge) => sum + badge.stars, 0),
        source: 'fast-http'
      };
    } catch (error) {
      return {
        username: username,
        profile_url: `https://www.hackerrank.com/profile/${username}`,
        problemsSolved: 0,
        badges: [],
        totalStars: 0,
        error: 'Unable to fetch data'
      };
    }
  }

  async scrapeHackerEarth(username) {
    try {
      const apiUrl = `https://www.hackerearth.com/@${username}`;
      
      const response = await axios.get(apiUrl, {
        headers: this.getHeaders(),
        timeout: 20000,
        maxRedirects: 5
      });

      const $ = cheerio.load(response.data);
      
      let problemsSolved = 0;
      let points = 0;
      let contestRatings = 0;
      let solutionsSubmitted = 0;

      // First try to find stats in HTML content
      $('*').each((i, element) => {
        const text = $(element).text();
        
        if (text.includes('Problems Solved') || text.includes('problems solved')) {
          const match = text.match(/(\d+)/);
          if (match && parseInt(match[1]) > 0 && !problemsSolved) {
            problemsSolved = parseInt(match[1]);
          }
        }
        
        if (text.includes('Points') || text.includes('points')) {
          const match = text.match(/(\d+)/);
          if (match && parseInt(match[1]) > 0 && !points) {
            points = parseInt(match[1]);
          }
        }
        
        if (text.includes('Contest Rating') || text.includes('Rating')) {
          const match = text.match(/(\d+)/);
          if (match && parseInt(match[1]) > 0 && !contestRatings) {
            contestRatings = parseInt(match[1]);
          }
        }
        
        if (text.includes('Solutions Submitted') || text.includes('Submissions')) {
          const match = text.match(/(\d+)/);
          if (match && parseInt(match[1]) > 0 && !solutionsSubmitted) {
            solutionsSubmitted = parseInt(match[1]);
          }
        }
      });

      // Look for data in script tags (HackerEarth loads data dynamically)
      $('script').each((i, script) => {
        const scriptContent = $(script).html();
        if (scriptContent) {
          // Try multiple patterns for problems solved
          const patterns = [
            /problems_solved["\s]*:["\s]*(\d+)/i,
            /problemsSolved["\s]*:["\s]*(\d+)/i,
            /"problems_solved"["\s]*:["\s]*(\d+)/i,
            /"problemsSolved"["\s]*:["\s]*(\d+)/i
          ];
          
          for (const pattern of patterns) {
            const match = scriptContent.match(pattern);
            if (match) {
              problemsSolved = parseInt(match[1]);
              break;
            }
          }
          
          // Try patterns for points
          const pointPatterns = [
            /points["\s]*:["\s]*(\d+)/i,
            /"points"["\s]*:["\s]*(\d+)/i,
            /total_points["\s]*:["\s]*(\d+)/i
          ];
          
          for (const pattern of pointPatterns) {
            const match = scriptContent.match(pattern);
            if (match) {
              points = parseInt(match[1]);
              break;
            }
          }
        }
      });

      // Look for data using multiple approaches
      if (problemsSolved === 0) {
        // Try different card selectors
        const cardSelectors = [
          '.rounded-xl.border.bg-card',
          '.bg-card',
          '.rounded-xl',
          '[class*="card"]',
          '[class*="stat"]',
          '[class*="metric"]',
          'div[class*="rounded"]',
          'div[class*="border"]'
        ];
        
        for (const selector of cardSelectors) {
          const cards = $(selector);
          
          cards.each((i, card) => {
            const $card = $(card);
            const cardText = $card.text();
            
            if (cardText.includes('Problems Solved')) {
              // Try different number selectors
              const numberSelectors = [
                '.text-xl.font-semibold.leading-none',
                '.text-xl.font-semibold',
                '.text-xl',
                '.font-semibold',
                '.text-2xl',
                '.text-lg',
                'span',
                'div'
              ];
              
              for (const numSelector of numberSelectors) {
                const numberElement = $card.find(numSelector);
                if (numberElement.length > 0) {
                  const text = numberElement.text().trim();
                  const value = parseInt(text) || 0;
                  if (value > 0 && value < 10000) {
                    problemsSolved = value;
                    return false; // Break the loop
                  }
                }
              }
            }
          });
          
          if (problemsSolved > 0) break;
        }
      }

      // Look for other stats using multiple approaches
      const cardSelectors = [
        '.rounded-xl.border.bg-card',
        '.bg-card',
        '.rounded-xl',
        '[class*="card"]',
        '[class*="stat"]',
        '[class*="metric"]',
        'div[class*="rounded"]',
        'div[class*="border"]'
      ];
      
      for (const selector of cardSelectors) {
        const cards = $(selector);
        
        cards.each((i, card) => {
          const $card = $(card);
          const cardText = $card.text();
          
          if (cardText.includes('Points') && points === 0) {
            const numberSelectors = [
              '.text-xl.font-semibold.leading-none',
              '.text-xl.font-semibold',
              '.text-xl',
              '.font-semibold',
              '.text-2xl',
              '.text-lg',
              'span',
              'div'
            ];
            
            for (const numSelector of numberSelectors) {
              const numberElement = $card.find(numSelector);
              if (numberElement.length > 0) {
                const text = numberElement.text().trim();
                const value = parseInt(text) || 0;
                if (value > 0 && value < 100000) {
                  points = value;
                  break;
                }
              }
            }
          } else if (cardText.includes('Contest Rating') && contestRatings === 0) {
            const numberSelectors = [
              '.text-xl.font-semibold.leading-none',
              '.text-xl.font-semibold',
              '.text-xl',
              '.font-semibold',
              '.text-2xl',
              '.text-lg',
              'span',
              'div'
            ];
            
            for (const numSelector of numberSelectors) {
              const numberElement = $card.find(numSelector);
              if (numberElement.length > 0) {
                const text = numberElement.text().trim();
                const value = parseInt(text) || 0;
                if (value > 0 && value < 100000) {
                  contestRatings = value;
                  break;
                }
              }
            }
          } else if (cardText.includes('Solutions Submitted') && solutionsSubmitted === 0) {
            const numberSelectors = [
              '.text-xl.font-semibold.leading-none',
              '.text-xl.font-semibold',
              '.text-xl',
              '.font-semibold',
              '.text-2xl',
              '.text-lg',
              'span',
              'div'
            ];
            
            for (const numSelector of numberSelectors) {
              const numberElement = $card.find(numSelector);
              if (numberElement.length > 0) {
                const text = numberElement.text().trim();
                const value = parseInt(text) || 0;
                if (value > 0 && value < 100000) {
                  solutionsSubmitted = value;
                  break;
                }
              }
            }
          }
        });
      }
      
      // If no data found with HTTP scraper, return error to trigger browser fallback
      if (problemsSolved === 0 && points === 0 && contestRatings === 0 && solutionsSubmitted === 0) {
        return {
          problemsSolved: 0,
          points: 0,
          contestRatings: 0,
          solutionsSubmitted: 0,
          error: 'No data found - requires browser rendering'
        };
      }

      return {
        username: username,
        profile_url: `https://www.hackerearth.com/@${username}`,
        problemsSolved,
        points,
        contestRatings,
        solutionsSubmitted,
        source: 'hackerearth-http'
      };
    } catch (error) {
      return {
        username: username,
        profile_url: `https://www.hackerearth.com/@${username}`,
        problemsSolved: 0,
        points: 0,
        contestRatings: 0,
        solutionsSubmitted: 0,
        error: 'Unable to fetch data'
      };
    }
  }

  async scrapeGeeksforGeeks(username) {
    try {
      const url = `https://www.geeksforgeeks.org/user/${username}`;
      const response = await axios.get(url, {
        headers: this.getHeaders(),
        timeout: 10000,
        maxRedirects: 5
      });

      const $ = cheerio.load(response.data);
      
      let problemsSolved = 0;
      let easySolved = 0;
      let mediumSolved = 0;
      let hardSolved = 0;

      // Look for data in script tags first (GeeksforGeeks uses dynamic content)
      $('script').each((i, script) => {
        const scriptContent = $(script).html();
        if (scriptContent) {
          // Try to extract problems solved data from JavaScript variables or JSON
          const problemsMatch = scriptContent.match(/problemsSolved["\s]*:["\s]*(\d+)/i);
          if (problemsMatch) problemsSolved = parseInt(problemsMatch[1]);
          
          const easyMatch = scriptContent.match(/easySolved["\s]*:["\s]*(\d+)/i);
          if (easyMatch) easySolved = parseInt(easyMatch[1]);
          
          const mediumMatch = scriptContent.match(/mediumSolved["\s]*:["\s]*(\d+)/i);
          if (mediumMatch) mediumSolved = parseInt(mediumMatch[1]);
          
          const hardMatch = scriptContent.match(/hardSolved["\s]*:["\s]*(\d+)/i);
          if (hardMatch) hardSolved = parseInt(hardMatch[1]);
        }
      });

      // Look for problems solved in HTML elements (not coding score)
      if (problemsSolved === 0) {
        // Look for "Problems Solved" text specifically
        $('*').each((i, element) => {
          const text = $(element).text().trim();
          if (text.includes('Problems Solved') || text.includes('Problem Solved')) {
            // Find the number associated with this text
            const parent = $(element).parent();
            const siblings = parent.find('*');
            siblings.each((j, sibling) => {
              const siblingText = $(sibling).text().trim();
              const match = siblingText.match(/^(\d+)$/);
              if (match) {
                problemsSolved = parseInt(match[1]);
                return false; // Break the loop
              }
            });
          }
        });
      }

      // Look for difficulty breakdown in navbar or cards
      if (easySolved === 0 || mediumSolved === 0 || hardSolved === 0) {
        $('.problemNavbar_head_nav--text__UaGCx').each((i, element) => {
          const text = $(element).text();
          const match = text.match(/(\w+)\s*\((\d+)\)/);
          if (match) {
            const difficulty = match[1].toLowerCase();
            const count = parseInt(match[2]);
            if (difficulty === 'easy') easySolved = count;
            else if (difficulty === 'medium') mediumSolved = count;
            else if (difficulty === 'hard') hardSolved = count;
          }
        });
      }

      // Additional fallback: look for difficulty breakdown in other elements
      if (easySolved === 0 || mediumSolved === 0 || hardSolved === 0) {
        $('*').each((i, element) => {
          const text = $(element).text();
          if (text.includes('Easy') || text.includes('Medium') || text.includes('Hard')) {
            const match = text.match(/(\w+)\s*[:\-]?\s*(\d+)/i);
            if (match) {
              const difficulty = match[1].toLowerCase();
              const count = parseInt(match[2]);
              if (difficulty === 'easy' && easySolved === 0) easySolved = count;
              else if (difficulty === 'medium' && mediumSolved === 0) mediumSolved = count;
              else if (difficulty === 'hard' && hardSolved === 0) hardSolved = count;
            }
          }
        });
      }

      // Calculate total if individual difficulties are found but total is missing
      if (problemsSolved === 0 && (easySolved > 0 || mediumSolved > 0 || hardSolved > 0)) {
        problemsSolved = easySolved + mediumSolved + hardSolved;
      }

      return {
        username: username,
        profile_url: `https://www.geeksforgeeks.org/user/${username}`,
        problemsSolved,
        easySolved,
        mediumSolved,
        hardSolved,
        source: 'geeksforgeeks-http'
      };
    } catch (error) {
      return {
        username: username,
        profile_url: `https://www.geeksforgeeks.org/user/${username}`,
        problemsSolved: 0,
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 0,
        error: 'Unable to fetch data'
      };
    }
  }

  async scrapeAllPlatforms(profiles) {
    const results = {};
    
    // Create array of platform scraping promises
    const scrapingPromises = Object.entries(profiles).map(async ([platform, data]) => {
      if (!data.username) return { platform, result: null };
      
      try {
        let result = null;
        switch (platform.toLowerCase()) {
          case 'leetcode':
            result = await this.scrapeLeetCode(data.username);
            break;
          case 'codechef':
            result = await this.scrapeCodeChef(data.username);
            break;
          case 'hackerearth':
            result = await this.scrapeHackerEarth(data.username);
            break;
          case 'hackerrank':
            result = await this.scrapeHackerRank(data.username);
            break;
          case 'geeksforgeeks':
            result = await this.scrapeGeeksforGeeks(data.username);
            break;
        }
        
        return { platform, result };
        
      } catch (error) {
        return { platform, result: null };
      }
    });
    
    // Execute all platform scraping in parallel
    const scrapingResults = await Promise.all(scrapingPromises);
    
    // Organize results
    scrapingResults.forEach(({ platform, result }) => {
      results[platform] = result;
    });
    
    return results;
  }
}

export default new FastScraperService();
