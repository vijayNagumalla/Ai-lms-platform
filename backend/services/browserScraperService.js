import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

class BrowserScraperService {
  constructor() {
    this.browser = null;
    this.page = null;
    this.browserPool = []; // Pool of browser instances for parallel scraping
    this.maxPoolSize = 20; // Increased for high concurrency
    // CRITICAL FIX: Rate limiting for scraping
    this.lastRequestTime = {}; // Track last request time per platform
    this.minRequestInterval = 1000; // Reduced to 1 second for faster batch processing (still prevents rate limiting)
    this.requestQueue = []; // Queue for rate-limited requests
    // CRITICAL FIX: Browser cleanup tracking
    this.activePages = new Set(); // Track all active pages for cleanup
    this.activeBrowsers = new Set(); // Track all active browsers for cleanup
    this.setupCleanupHandlers();
  }

  // CRITICAL FIX: Setup cleanup handlers for graceful shutdown
  setupCleanupHandlers() {
    const cleanup = async () => {
      console.log('🛑 Shutting down browser scraper service...');
      await this.closeBrowser();
      await this.closeAllBrowsers();
      process.exit(0);
    };

    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);
    process.on('uncaughtException', async (error) => {
      console.error('❌ Uncaught exception, cleaning up browsers:', error);
      await this.closeAllBrowsers();
      process.exit(1);
    });
  }

  // CRITICAL FIX: Rate limiting - wait before making request
  async waitForRateLimit(platform) {
    const now = Date.now();
    const lastTime = this.lastRequestTime[platform] || 0;
    const timeSinceLastRequest = now - lastTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      // Only log if wait time is significant (>500ms) to reduce console noise
      if (waitTime > 500) {
        console.log(`⏳ Rate limiting: waiting ${waitTime}ms before ${platform} request`);
      }
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime[platform] = Date.now();
  }

  // CRITICAL FIX: Close all browsers and pages
  async closeAllBrowsers() {
    // Close all active pages
    for (const page of this.activePages) {
      try {
        if (page && !page.isClosed()) {
          await page.close();
        }
      } catch (error) {
        console.error('Error closing page:', error.message);
      }
    }
    this.activePages.clear();

    // Close all browsers in pool
    for (const browser of this.browserPool) {
      try {
        if (browser && browser.isConnected()) {
          await browser.close();
        }
      } catch (error) {
        console.error('Error closing browser in pool:', error.message);
      }
    }
    this.browserPool = [];

    // Close main browser
    if (this.browser && this.browser.isConnected()) {
      try {
        await this.browser.close();
        this.browser = null;
      } catch (error) {
        console.error('Error closing main browser:', error.message);
      }
    }
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true, // Set to false for debugging
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  async createPage() {
    const browser = await this.initBrowser();
    this.page = await browser.newPage();
    
    // Set page timeouts - increased for slow connections
    this.page.setDefaultTimeout(45000);
    this.page.setDefaultNavigationTimeout(45000);
    
    // CRITICAL FIX: User agent rotation to prevent bot detection
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
    ];
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    
    // Set realistic viewport and user agent
    await this.page.setViewport({ width: 1366, height: 768 });
    await this.page.setUserAgent(randomUserAgent);
    
    // Set extra headers
    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-User': '?1',
      'Sec-Fetch-Dest': 'document'
    });

    return this.page;
  }

  // Get a browser instance from the pool or create a new one
  async getBrowserFromPool() {
    if (this.browserPool.length > 0) {
      return this.browserPool.pop();
    }
    
    if (this.browserPool.length < this.maxPoolSize) {
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
      return browser;
    }
    
    // Wait for a browser to become available
    return new Promise((resolve) => {
      const checkPool = () => {
        if (this.browserPool.length > 0) {
          resolve(this.browserPool.pop());
        } else {
          setTimeout(checkPool, 100);
        }
      };
      checkPool();
    });
  }

  // Helper method to configure a new page with proper timeouts and settings
  async configurePage(page) {
    // CRITICAL FIX: Set default timeouts on each new page (60 seconds for slow connections)
    page.setDefaultTimeout(60000);
    page.setDefaultNavigationTimeout(60000);
    
    // Set realistic viewport
    await page.setViewport({ width: 1366, height: 768 });
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    return page;
  }

  // Return a browser instance to the pool
  returnBrowserToPool(browser) {
    if (this.browserPool.length < this.maxPoolSize) {
      this.browserPool.push(browser);
    } else {
      browser.close();
    }
  }

  async scrapeLeetCode(username) {
    let browser = null;
    let page = null;
    try {
      browser = await this.getBrowserFromPool();
      this.activeBrowsers.add(browser);
      page = await browser.newPage();
      this.activePages.add(page);
      
      // Configure page with proper timeouts
      await this.configurePage(page);
      
      const url = `https://leetcode.com/u/${username}/`;
      
      // Navigate to the page with increased timeout and more lenient wait condition
      await page.goto(url, { 
        waitUntil: 'domcontentloaded', // More lenient than networkidle2 for slow connections
        timeout: 60000 // Increased timeout to 60 seconds for slow connections
      });
      
        // Wait for LeetCode's dynamic content to load
        await new Promise(resolve => setTimeout(resolve, 2000)); // Optimized wait time for faster scraping
      
      // Wait for specific elements to load with multiple selectors
      const waitSelectors = ['.text-label-1', '.text-2xl', '.text-3xl', '.font-medium', '.font-semibold'];
      let elementFound = false;
      
      for (const selector of waitSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 10000 });
          elementFound = true;
          break;
        } catch (e) {
          // Continue to next selector
        }
      }
      
      if (!elementFound) {
        // Wait a bit more for any dynamic content
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Get the full HTML content
      const html = await page.content();
      const $ = cheerio.load(html);
      
      
      // Extract data from the fully rendered page
      let problemsSolved = 0;
      let easySolved = 0;
      let mediumSolved = 0;
      let hardSolved = 0;
      let acceptanceRate = 'N/A';
      
      // Look for Problems Solved - main count using multiple selectors
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
      
      // Fallback: Look for any text containing "Solved" and numbers
      if (!problemsSolved) {
        $('*').each((i, element) => {
          const text = $(element).text();
          if (text.includes('Solved') && !text.includes('Easy') && !text.includes('Medium') && !text.includes('Hard')) {
            const match = text.match(/(\d+)/);
            if (match && !problemsSolved) {
              problemsSolved = parseInt(match[1]);
              // console.log(`✅ Found problems solved (fallback): ${problemsSolved}`);
            }
          }
        });
      }
      
      // Additional fallback: Look for large numbers that could be problems solved
      if (!problemsSolved) {
        $('*').each((i, element) => {
          const text = $(element).text().trim();
          const match = text.match(/^(\d{1,4})$/); // Match numbers 1-4 digits
          if (match && !problemsSolved) {
            const num = parseInt(match[1]);
            if (num > 0 && num < 10000) { // Reasonable range for problems solved
              problemsSolved = num;
              // console.log(`✅ Found problems solved (number fallback): ${problemsSolved}`);
            }
          }
        });
      }
      
      // Look for Easy problems solved - format like "5/901"
      $('.text-sd-easy').each((i, element) => {
        const nextElement = $(element).next();
        const text = nextElement.text();
        const match = text.match(/(\d+)\/\d+/);
        if (match) {
          easySolved = parseInt(match[1]);
          // console.log(`✅ Found easy solved: ${easySolved}`);
        }
      });
      
      // Look for Medium problems solved - format like "5/1920"
      $('.text-sd-medium').each((i, element) => {
        const nextElement = $(element).next();
        const text = nextElement.text();
        const match = text.match(/(\d+)\/\d+/);
        if (match) {
          mediumSolved = parseInt(match[1]);
          // console.log(`✅ Found medium solved: ${mediumSolved}`);
        }
      });
      
      // Look for Hard problems solved - format like "2/870"
      $('.text-sd-hard').each((i, element) => {
        const nextElement = $(element).next();
        const text = nextElement.text();
        const match = text.match(/(\d+)\/\d+/);
        if (match) {
          hardSolved = parseInt(match[1]);
          // console.log(`✅ Found hard solved: ${hardSolved}`);
        }
      });
      
      // Look for Rank - search for specific HTML structure
      let rank = 'N/A';
      
      // Method 1: Look for the exact div structure
      $('div.flex.flex-1.items-end').each((i, element) => {
        const $element = $(element);
        const spans = $element.find('span');
        
        if (spans.length >= 2) {
          const firstSpanText = spans.eq(0).text().trim();
          const secondSpanText = spans.eq(1).text().trim();
          
          if (firstSpanText === 'Rank' && secondSpanText.match(/^\d+(?:,\d+)*$/)) {
            rank = secondSpanText.replace(/,/g, '');
            // console.log(`✅ Found rank from div structure: ${rank}`);
            return false; // Break out of loop
          }
        }
      });
      
      // Method 2: Look for spans with specific classes
      if (rank === 'N/A') {
        $('span.text-label-2, span.dark\\:text-dark-label-2').each((i, element) => {
          const $span = $(element);
          if ($span.text().trim() === 'Rank') {
            const nextSpan = $span.next('span');
            if (nextSpan.length > 0) {
              const rankText = nextSpan.text().trim();
              if (rankText.match(/^\d+(?:,\d+)*$/)) {
                rank = rankText.replace(/,/g, '');
                // console.log(`✅ Found rank from span classes: ${rank}`);
                return false; // Break out of loop
              }
            }
          }
        });
      }
      
      // Method 3: Look for any element containing "Rank" followed by a number
      if (rank === 'N/A') {
        $('*').each((i, element) => {
          const text = $(element).text();
          if (text.includes('Rank') && text.match(/\d/)) {
            const match = text.match(/Rank[^\d]*(\d+(?:,\d+)*)/);
            if (match) {
              rank = match[1].replace(/,/g, '');
              // console.log(`✅ Found rank from text search: ${rank}`);
              return false; // Break out of loop
            }
          }
        });
      }
      
      // Calculate total from individual counts (avoid double counting)
      if (easySolved > 0 || mediumSolved > 0 || hardSolved > 0) {
        const calculatedTotal = easySolved + mediumSolved + hardSolved;
        if (!problemsSolved || problemsSolved !== calculatedTotal) {
          problemsSolved = calculatedTotal;
          // console.log(`✅ Calculated total problems solved: ${problemsSolved} (Easy: ${easySolved}, Medium: ${mediumSolved}, Hard: ${hardSolved})`);
        }
      }
      
      return {
        username: username,
        profile_url: `https://leetcode.com/u/${username}/`,
        problemsSolved: problemsSolved,
        easySolved: easySolved,
        mediumSolved: mediumSolved,
        hardSolved: hardSolved,
        rank: rank,
        source: 'browser-rendered'
      };
      
    } catch (error) {
      // Handle timeout errors gracefully
      if (error.message.includes('timeout') || error.message.includes('Navigation timeout')) {
        console.error(`Error scraping LeetCode with browser: Navigation timeout - ${username}`);
        // Return null instead of throwing to allow batch processing to continue
        return null;
      }
      console.error('Error scraping LeetCode with browser:', error.message);
      if (error.message.includes('404') || error.message.includes('not found')) {
        throw new Error('USER_NOT_FOUND - Please check your username and edit your profile details if needed');
      } else if (error.message.includes('403') || error.message.includes('blocked')) {
        throw new Error('Access denied - profile may be private or blocked');
      } else {
        // Return null for other errors to allow batch processing to continue
        return null;
      }
    } finally {
      // CRITICAL FIX: Ensure cleanup even on errors
      if (page) {
        try {
          this.activePages.delete(page);
          if (!page.isClosed()) {
        await page.close();
          }
        } catch (closeError) {
          console.error('Error closing page:', closeError.message);
        }
      }
      if (browser) {
        this.activeBrowsers.delete(browser);
        this.returnBrowserToPool(browser);
      }
    }
  }

  async scrapeCodeChef(username) {
    // CRITICAL FIX: Rate limiting
    await this.waitForRateLimit('codechef');
    
    let browser = null;
    let page = null;
    try {
      browser = await this.getBrowserFromPool();
      this.activeBrowsers.add(browser);
      page = await browser.newPage();
      this.activePages.add(page);
      
      // Configure page with proper timeouts
      await this.configurePage(page);
      
      const url = `https://www.codechef.com/users/${username}`;
      
      // console.log(`🌐 Loading CodeChef profile: ${url}`);
      
      await page.goto(url, { 
        waitUntil: 'domcontentloaded', // Faster than networkidle2
        timeout: 60000 // Increased timeout to 60 seconds for slow connections
      });
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Aggressively reduced from 2000ms
      
      const html = await page.content();
      const $ = cheerio.load(html);
      
      
      let problemsSolved = 0;
      let currentRating = 0;
      
      // Look for the specific HTML structure you provided
      $('h3').each((i, element) => {
        const text = $(element).text();
        if (text.includes('Total Problems Solved')) {
          const match = text.match(/(\d+)/);
          if (match) {
            problemsSolved = parseInt(match[1]);
            // console.log(`✅ Found problems solved: ${problemsSolved}`);
          }
        }
      });
      
      // Look for current rating
      $('.rating-number, .rating').each((i, element) => {
        const text = $(element).text().trim();
        const match = text.match(/(\d+)/);
        if (match && !currentRating) {
          currentRating = parseInt(match[1]);
          // console.log(`✅ Found current rating: ${currentRating}`);
        }
      });
      
      // Look for highest rating
      let highestRating = currentRating;
      $('*').each((i, element) => {
        const text = $(element).text();
        if (text.includes('Highest Rating') || text.includes('highest rating')) {
          const match = text.match(/(\d+)/);
          if (match) {
            highestRating = parseInt(match[1]);
            // console.log(`✅ Found highest rating: ${highestRating}`);
          }
        }
      });
      
      // Look for global ranking
      let globalRanking = 'N/A';
      $('*').each((i, element) => {
        const text = $(element).text();
        if (text.includes('Global Ranking') || text.includes('Rank')) {
          const match = text.match(/(\d+)/);
          if (match) {
            globalRanking = match[1];
            // console.log(`✅ Found global ranking: ${globalRanking}`);
          }
        }
      });
      
      // Look for contests participated
      let contestsParticipated = 0;
      $('*').each((i, element) => {
        const text = $(element).text();
        if (text.includes('Contests Participated') || text.includes('contests')) {
          const match = text.match(/(\d+)/);
          if (match) {
            contestsParticipated = parseInt(match[1]);
            // console.log(`✅ Found contests participated: ${contestsParticipated}`);
          }
        }
      });
      
      // Look for stars
      let stars = 0;
      $('*').each((i, element) => {
        const text = $(element).text();
        if (text.includes('Stars') || text.includes('stars')) {
          const match = text.match(/(\d+)/);
          if (match) {
            stars = parseInt(match[1]);
            // console.log(`✅ Found stars: ${stars}`);
          }
        }
      });
      
      return {
        username: username,
        profile_url: `https://www.codechef.com/users/${username}`,
        problemsSolved: problemsSolved,
        currentRating: currentRating,
        highestRating: highestRating,
        globalRanking: globalRanking,
        contestsParticipated: contestsParticipated,
        stars: stars,
        source: 'browser-rendered'
      };
      
    } catch (error) {
      // console.error('Error scraping CodeChef with browser:', error.message);
      return {
        username: username,
        profile_url: `https://www.codechef.com/users/${username}`,
        problemsSolved: 0,
        currentRating: 0,
        highestRating: 0,
        globalRanking: 'N/A',
        error: 'Unable to fetch data'
      };
    } finally {
      // CRITICAL FIX: Ensure cleanup even on errors
      if (page) {
        try {
          this.activePages.delete(page);
          if (!page.isClosed()) {
        await page.close();
          }
        } catch (closeError) {
          console.error('Error closing page:', closeError.message);
        }
      }
      if (browser) {
        this.activeBrowsers.delete(browser);
        this.returnBrowserToPool(browser);
      }
    }
  }

  async scrapeHackerEarth(username) {
    // CRITICAL FIX: Rate limiting
    await this.waitForRateLimit('hackerearth');
    
    let browser = null;
    let page = null;
    try {
      browser = await this.getBrowserFromPool();
      this.activeBrowsers.add(browser);
      page = await browser.newPage();
      this.activePages.add(page);
      
      // Configure page with proper timeouts
      await this.configurePage(page);
      
      const url = `https://www.hackerearth.com/@${username}`;
      
      // console.log(`🌐 Loading HackerEarth profile: ${url}`);
      
      await page.goto(url, { 
        waitUntil: 'domcontentloaded', // More lenient than networkidle2 for slow connections
        timeout: 60000 // Increased timeout to 60 seconds for slow connections
      });
      
      // Wait for HackerEarth's dynamic content to load
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Wait for specific elements to load with multiple selectors
      const waitSelectors = [
        '.text-xl.font-semibold', 
        '.text-2xl.font-bold',
        '.rounded-xl.border.bg-card',
        '[class*="text-"]',
        '[class*="font-"]'
      ];
      
      let elementFound = false;
      for (const selector of waitSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 10000 });
          elementFound = true;
          break;
      } catch (e) {
          // Continue to next selector
        }
      }
      
      // Additional wait for dynamic content to fully load
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Wait specifically for the metric containers to load (new structure or old card structure)
      try {
        await Promise.race([
          page.waitForSelector('.h-full.w-full.flex.flex-col.justify-end', { timeout: 15000 }),
          page.waitForSelector('.rounded-xl.border.bg-card', { timeout: 15000 })
        ]).catch(() => {
          // Continue even if selectors not found - will try fallback methods
        });
      } catch (e) {
        // Continue even if selector not found - will try fallback methods
      }
      
      const html = await page.content();
      const $ = cheerio.load(html);
      
      let points = 0, contestRatings = 0, problemsSolved = 0, solutionsSubmitted = 0;
      
      // METHOD 1: Extract from the new HackerEarth structure (flex container with direct value/label)
      // Structure: <div class="h-full w-full flex flex-col justify-end pr-16">
      //   <div class="text-xl font-semibold leading-none">1</div>
      //   <div class="text-sm text-muted-foreground mt-2 w-full whitespace-nowrap">Problems Solved</div>
      // </div>
      const flexContainers = $('.h-full.w-full.flex.flex-col.justify-end');
      flexContainers.each((index, element) => {
        const $container = $(element);
        
        // Find value element with leading-none class
        const valueElement = $container.find('.text-xl.font-semibold.leading-none').first();
        // Find label element
        const labelElement = $container.find('.text-sm.text-muted-foreground').first();
        
        if (valueElement.length > 0 && labelElement.length > 0) {
          const value = parseInt(valueElement.text().trim().replace(/,/g, '')) || 0;
          const label = labelElement.text().trim().toLowerCase();
          
          // Assign value based on label
          if (label.includes('points') && points === 0 && value > 0) {
            points = value;
          } else if (label.includes('contest') && contestRatings === 0 && value > 0) {
            contestRatings = value;
          } else if (label.includes('problems solved') && problemsSolved === 0 && value > 0) {
            problemsSolved = value;
          } else if ((label.includes('solutions submitted') || label.includes('submissions')) && solutionsSubmitted === 0 && value > 0) {
            solutionsSubmitted = value;
          }
        }
      });
      
      // METHOD 2: Extract metrics from the card structure (fallback for older structure)
      const metricCards = $('.rounded-xl.border.bg-card');
      
      metricCards.each((index, element) => {
        const $card = $(element);
        
        // Look for value element with multiple possible selectors
        let valueElement = $card.find('.text-xl.font-semibold.leading-none').first();
        if (valueElement.length === 0) {
          valueElement = $card.find('.text-xl.font-semibold').first();
        }
        if (valueElement.length === 0) {
          // Fallback: try other value selectors
          const fallbackValueSelectors = [
            '.text-2xl.font-bold',
            '.text-xl',
            '.font-semibold',
            'span[class*="text-"]',
            'div[class*="text-"]'
          ];
          
          for (const selector of fallbackValueSelectors) {
            const elem = $card.find(selector).first();
            if (elem.length > 0) {
              valueElement = elem;
              break;
            }
          }
        }
        
        // Look for label element
        let labelElement = $card.find('.text-sm.text-muted-foreground').first();
        if (labelElement.length === 0) {
          // Fallback: try other label selectors
          const fallbackLabelSelectors = [
            '.text-sm',
            '[class*="text-muted"]',
            '[class*="muted"]',
            'p[class*="text-"]',
            'span[class*="text-"]'
          ];
          
          for (const selector of fallbackLabelSelectors) {
            const elem = $card.find(selector).first();
            if (elem.length > 0 && elem.text().trim().length > 0) {
              labelElement = elem;
              break;
            }
          }
        }
        
        if (valueElement.length > 0) {
          const value = parseInt(valueElement.text().trim().replace(/,/g, '')) || 0;
          
          // Get label from label element or card text
          let label = '';
          if (labelElement.length > 0) {
            label = labelElement.text().trim().toLowerCase();
          } else {
            // Fallback: get all text from card and find label
            const cardText = $card.text().toLowerCase();
            if (cardText.includes('points')) label = 'points';
            else if (cardText.includes('contest')) label = 'contest rating';
            else if (cardText.includes('problems solved')) label = 'problems solved';
            else if (cardText.includes('solutions submitted')) label = 'solutions submitted';
          }
          
          // Assign value based on label (only if not already set from METHOD 1)
          if (label.includes('points') && points === 0 && value > 0) {
            points = value;
          } else if (label.includes('contest') && contestRatings === 0 && value > 0) {
            contestRatings = value;
          } else if (label.includes('problems solved') && problemsSolved === 0 && value > 0) {
            problemsSolved = value;
          } else if ((label.includes('solutions submitted') || label.includes('submissions')) && solutionsSubmitted === 0 && value > 0) {
            solutionsSubmitted = value;
          }
        }
      });
      
      // FALLBACK METHOD: If primary method didn't find all values, try text-based search
      if (problemsSolved === 0 || points === 0 || contestRatings === 0 || solutionsSubmitted === 0) {
        $('*').each((i, element) => {
          const $element = $(element);
          const text = $element.text().trim();
          
          // Problems Solved
          if (problemsSolved === 0 && (text.includes('Problems Solved') || text.includes('problems solved'))) {
            const match = text.match(/(\d+(?:,\d+)*)/);
            if (match) {
              problemsSolved = parseInt(match[1].replace(/,/g, '')) || 0;
            }
          }
          
          // Points
          if (points === 0 && (text.includes('Points') || text.includes('points'))) {
            const match = text.match(/(\d+(?:,\d+)*)/);
            if (match) {
              points = parseInt(match[1].replace(/,/g, '')) || 0;
            }
          }
          
          // Contest Rating
          if (contestRatings === 0 && (text.includes('Contest Rating') || text.includes('contest rating') || text.includes('Rating'))) {
            const match = text.match(/(\d+(?:,\d+)*)/);
            if (match) {
              contestRatings = parseInt(match[1].replace(/,/g, '')) || 0;
            }
          }
          
          // Solutions Submitted
          if (solutionsSubmitted === 0 && (text.includes('Solutions Submitted') || text.includes('solutions submitted') || text.includes('Submissions'))) {
            const match = text.match(/(\d+(?:,\d+)*)/);
            if (match) {
              solutionsSubmitted = parseInt(match[1].replace(/,/g, '')) || 0;
            }
          }
        });
      }
      
      
      
      return {
        username: username,
        profile_url: `https://www.hackerearth.com/@${username}`,
        points: points,
        contestRatings: contestRatings,
        problemsSolved: problemsSolved,
        solutionsSubmitted: solutionsSubmitted,
        source: 'browser-rendered'
      };
      
    } catch (error) {
      // Handle timeout errors gracefully
      if (error.message.includes('timeout') || error.message.includes('Navigation timeout')) {
        console.error(`Error scraping HackerEarth with browser: Navigation timeout - ${username}`);
        // Return null instead of throwing to allow batch processing to continue
        return null;
      }
      console.error('Error scraping HackerEarth with browser:', error.message);
      if (error.message.includes('404') || error.message.includes('not found')) {
        throw new Error('USER_NOT_FOUND - Please check your username and edit your profile details if needed');
      } else if (error.message.includes('403') || error.message.includes('blocked')) {
        throw new Error('Access denied - profile may be private or blocked');
      } else {
        // Return null for other errors to allow batch processing to continue
        return null;
      }
    } finally {
      // CRITICAL FIX: Ensure cleanup even on errors
      if (page) {
        try {
          this.activePages.delete(page);
          if (!page.isClosed()) {
        await page.close();
          }
        } catch (closeError) {
          console.error('Error closing page:', closeError.message);
        }
      }
      if (browser) {
        this.activeBrowsers.delete(browser);
        this.returnBrowserToPool(browser);
      }
    }
  }

  async scrapeHackerRank(username) {
    // CRITICAL FIX: Rate limiting
    await this.waitForRateLimit('hackerrank');
    
    let browser = null;
    let page = null;
    try {
      browser = await this.getBrowserFromPool();
      this.activeBrowsers.add(browser);
      page = await browser.newPage();
      this.activePages.add(page);
      
      // Configure page with proper timeouts
      await this.configurePage(page);
      
      const url = `https://www.hackerrank.com/profile/${username}`;
      
      // console.log(`🌐 Loading HackerRank profile: ${url}`);
      
      await page.goto(url, { 
        waitUntil: 'domcontentloaded', // Faster than networkidle2
        timeout: 60000 // Increased timeout to 60 seconds for slow connections
      });
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Aggressively reduced from 2000ms
      
      const html = await page.content();
      const $ = cheerio.load(html);
      
      
      // Extract badges and stars with maximum details from specific HTML structure
      const badges = [];
      let badgesCount = 0;
      
      // Method 1: Look for the specific badges section
      $('section.section-card.hacker-badges').each((i, section) => {
        const $section = $(section);
        
        // Count all hacker-badge elements in this section
        $section.find('.hacker-badge').each((j, badgeElement) => {
          const $badge = $(badgeElement);
          
          // Extract badge title from SVG text element
          const badgeTitleElement = $badge.find('text.badge-title');
          const badgeName = badgeTitleElement.text().trim();
          
          // Count stars in the badge
          const starCount = $badge.find('.badge-star').length;
          
          // Get badge level from class
          const badgeLevelElement = $badge.find('.ui-badge');
          let level = 'Unknown';
          if (badgeLevelElement.length > 0) {
            const badgeClass = badgeLevelElement.attr('class') || '';
            if (badgeClass.includes('level-bronze')) level = 'Bronze';
            else if (badgeClass.includes('level-silver')) level = 'Silver';
            else if (badgeClass.includes('level-gold')) level = 'Gold';
          }
          
          if (badgeName) {
            badges.push({
              name: badgeName,
              stars: starCount,
              level: level
            });
            badgesCount++;
            // console.log(`✅ Found badge: ${badgeName} (${starCount} stars, ${level})`);
          }
        });
      });
      
      // Method 2: Fallback - look for badges anywhere
      if (badgesCount === 0) {
        $('.hacker-badge').each((i, element) => {
          const badgeName = $(element).find('.badge-title').text().trim();
          const stars = $(element).find('.badge-star').length;
          const badgeLevel = $(element).find('.ui-badge').attr('class')?.includes('bronze') ? 'Bronze' : 
                           $(element).find('.ui-badge').attr('class')?.includes('silver') ? 'Silver' : 
                           $(element).find('.ui-badge').attr('class')?.includes('gold') ? 'Gold' : 'Unknown';
          
          if (badgeName) {
            badges.push({ 
              name: badgeName, 
              stars: stars,
              level: badgeLevel
            });
            badgesCount++;
            // console.log(`✅ Found badge (fallback): ${badgeName} (${stars} stars, ${badgeLevel})`);
          }
        });
      }
      
      // Look for problems solved specifically
      let problemsSolved = 0;
      $('*').each((i, element) => {
        const text = $(element).text();
        if (text.includes('Problems Solved') || text.includes('problems solved')) {
          const match = text.match(/(\d+)/);
          if (match && !problemsSolved) {
            problemsSolved = parseInt(match[1]);
            // console.log(`✅ Found problems solved: ${problemsSolved}`);
          }
        }
      });
      
      // Look for skills verified
      let skillsVerified = 0;
      $('*').each((i, element) => {
        const text = $(element).text();
        if (text.includes('Skills Verified') || text.includes('skills verified')) {
          const match = text.match(/(\d+)/);
          if (match) {
            skillsVerified = parseInt(match[1]);
            // console.log(`✅ Found skills verified: ${skillsVerified}`);
          }
        }
      });
      
      // Look for certificates
      let certificates = 0;
      $('*').each((i, element) => {
        const text = $(element).text();
        if (text.includes('Certificate') || text.includes('certificate')) {
          const match = text.match(/(\d+)/);
          if (match) {
            certificates = parseInt(match[1]);
            // console.log(`✅ Found certificates: ${certificates}`);
          }
        }
      });
      
      return {
        username: username,
        profile_url: `https://www.hackerrank.com/profile/${username}`,
        problemsSolved: badgesCount, // Return badge count as the main metric
        badges: badges,
        skillsVerified: skillsVerified,
        totalStars: badges.reduce((sum, badge) => sum + badge.stars, 0),
        certificates: certificates,
        badgeLevels: {
          bronze: badges.filter(b => b.level === 'Bronze').length,
          silver: badges.filter(b => b.level === 'Silver').length,
          gold: badges.filter(b => b.level === 'Gold').length
        },
        source: 'browser-rendered'
      };
      
    } catch (error) {
      // console.error('Error scraping HackerRank with browser:', error.message);
      return {
        username: username,
        profile_url: `https://www.hackerrank.com/profile/${username}`,
        problemsSolved: 0,
        badges: [],
        skillsVerified: 0,
        totalStars: 0,
        error: 'Unable to fetch data'
      };
    } finally {
      // CRITICAL FIX: Ensure cleanup even on errors
      if (page) {
        try {
          this.activePages.delete(page);
          if (!page.isClosed()) {
        await page.close();
          }
        } catch (closeError) {
          console.error('Error closing page:', closeError.message);
        }
      }
      if (browser) {
        this.activeBrowsers.delete(browser);
        this.returnBrowserToPool(browser);
      }
    }
  }

  async scrapeGeeksforGeeks(username) {
    // CRITICAL FIX: Rate limiting
    await this.waitForRateLimit('geeksforgeeks');
    
    let browser = null;
    let page = null;
    try {
      browser = await this.getBrowserFromPool();
      this.activeBrowsers.add(browser);
      page = await browser.newPage();
      this.activePages.add(page);
      
      // Configure page with proper timeouts
      await this.configurePage(page);
      
      const url = `https://www.geeksforgeeks.org/user/${username}`;
      
      // Navigate with increased timeout
      await page.goto(url, { 
        waitUntil: 'domcontentloaded', // Faster than networkidle2
        timeout: 60000 // Increased timeout to 60 seconds for slow connections
      });
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Aggressively reduced from 2000ms
      
      const html = await page.content();
      const $ = cheerio.load(html);
      
      
      // Extract problems solved (NOT coding score)
      let problemsSolved = 0;
      
      // Look for the specific score card structure for "Problems Solved"
      $('.scoreCard_head__nxXR8').each((i, card) => {
        const $card = $(card);
        const cardText = $card.text();
        
        // Only look for "Problem Solved" cards, not "Coding Score" cards
        if (cardText.includes('Problem Solved') && !cardText.includes('Coding Score')) {
          const scoreElement = $card.find('.scoreCard_head_left--score__oSi_x');
          if (scoreElement.length > 0) {
            const value = parseInt(scoreElement.text().trim()) || 0;
            if (value > 0) {
              problemsSolved = value;
              // console.log(`✅ Found problems solved from score card: ${problemsSolved}`);
            }
          }
        }
      });
      
      // Fallback: Look for "Problem Solved" text anywhere (excluding coding score)
      if (!problemsSolved) {
        $('*').each((i, element) => {
          const text = $(element).text();
          if ((text.includes('Problem Solved') || text.includes('Problems Solved')) && 
              !text.includes('Coding Score')) {
            const match = text.match(/(\d+)/);
            if (match && !problemsSolved) {
              problemsSolved = parseInt(match[1]);
              // console.log(`✅ Found problems solved (fallback): ${problemsSolved}`);
            }
          }
        });
      }
      
      // Additional fallback: Look for difficulty breakdown and sum them up
      if (!problemsSolved) {
        let easySolved = 0, mediumSolved = 0, hardSolved = 0;
        
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
        
        problemsSolved = easySolved + mediumSolved + hardSolved;
        if (problemsSolved > 0) {
          // console.log(`✅ Calculated problems solved from difficulty breakdown: ${problemsSolved}`);
        }
      }
      
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
            // console.log(`✅ Found ${difficulty}: ${count}`);
          }
        }
      });
      
      return {
        username: username,
        profile_url: `https://www.geeksforgeeks.org/user/${username}`,
        problemsSolved: problemsSolved,
        easySolved: difficultyStats.easy || 0,
        mediumSolved: difficultyStats.medium || 0,
        hardSolved: difficultyStats.hard || 0,
        rank: 0, // GeeksforGeeks doesn't have ranking like LeetCode
        difficultyBreakdown: difficultyStats,
        articlesWritten: 0, // Would need separate scraping
        source: 'browser-rendered'
      };
      
    } catch (error) {
      // Handle timeout errors gracefully
      if (error.message.includes('timeout') || error.message.includes('Navigation timeout')) {
        console.error(`Error scraping GeeksforGeeks with browser: Navigation timeout - ${username}`);
        // Return null instead of throwing to allow batch processing to continue
        return null;
      }
      console.error('Error scraping GeeksforGeeks with browser:', error.message);
      if (error.message.includes('404') || error.message.includes('not found')) {
        throw new Error('USER_NOT_FOUND - Please check your username and edit your profile details if needed');
      } else if (error.message.includes('403') || error.message.includes('blocked')) {
        throw new Error('Access denied - profile may be private or blocked');
      } else {
        // Return null for other errors to allow batch processing to continue
        return null;
      }
    } finally {
      // CRITICAL FIX: Ensure cleanup even on errors
      if (page) {
        try {
          this.activePages.delete(page);
          if (!page.isClosed()) {
        await page.close();
          }
        } catch (closeError) {
          console.error('Error closing page:', closeError.message);
        }
      }
      if (browser) {
        this.activeBrowsers.delete(browser);
        this.returnBrowserToPool(browser);
      }
    }
  }

  async scrapeAllPlatforms(profiles) {
    const results = {};
    
    // Create array of platform scraping promises
    const scrapingPromises = Object.entries(profiles).map(async ([platform, data]) => {
      if (!data.username) return { platform, result: null };
      
      try {
        // console.log(`\n🚀 Starting async browser scraping for ${platform}...`);
        
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
        
        // console.log(`✅ Completed async scraping for ${platform}`);
        return { platform, result };
        
      } catch (error) {
        // console.error(`❌ Error scraping ${platform} with browser:`, error.message);
        return { platform, result: null };
      }
    });
    
    // Execute all platform scraping in parallel
    // console.log(`🚀 Starting parallel scraping for ${scrapingPromises.length} platforms...`);
    const scrapingResults = await Promise.all(scrapingPromises);
    
    // Organize results
    scrapingResults.forEach(({ platform, result }) => {
      results[platform] = result;
    });
    
    // console.log(`✅ Completed parallel scraping for all platforms`);
    return results;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    
    // Close all browsers in the pool
    for (const browser of this.browserPool) {
      try {
        await browser.close();
      } catch (error) {
        // console.error('Error closing browser in pool:', error);
      }
    }
    this.browserPool = [];
  }
}

export default new BrowserScraperService();
