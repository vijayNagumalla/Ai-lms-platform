# Platform-Specific Data Retrieval for Coding Progress Platform

## Overview

The Coding Progress Platform now implements platform-specific data retrieval methods instead of using a one-size-fits-all LeetCode-style approach. Each platform (CodeChef, HackerRank, LeetCode, etc.) has its own unique data structure and API endpoints, which are now properly handled.

## Platform-Specific Implementations

### 1. CodeChef

**Data Structure:**
- `totalSolved`: Total problems solved (fully + partially)
- `rating`: Current rating
- `rank`: Global rank or country rank
- `stars`: Star rating system (CodeChef-specific)
- `country`: User's country
- `institution`: Educational institution
- `memberSince`: Membership start date
- `practiceProblems`: Practice problems count
- `contestProblems`: Contest problems count

**API Endpoints Used:**
1. `/api/users/{username}/profile` - New profile API
2. `/api/users/{username}` - Old profile API
3. `/api/users/{username}/practice` - Practice problems API
4. `/api/users/{username}/contests` - Contest participation API
5. Public profile page scraping as fallback

**Key Features:**
- Multiple API fallback methods
- Rate limiting protection (1-second delays)
- HTML scraping for robust data extraction
- Platform-specific field mapping

### 2. HackerRank

**Data Structure:**
- `totalSolved`: Total challenges solved
- `rating`: Current rating
- `rank`: Current rank
- `country`: User's country
- `school`: Educational institution
- `company`: Company affiliation
- `jobTitle`: Job title
- `bio`: User biography

**API Endpoints Used:**
1. `/rest/contests/master/hackers/{username}/profile` - Profile API
2. `/rest/contests/master/hackers/{username}/submissions` - Submissions API
3. `/rest/contests/master/hackers/{username}/contest_participation` - Contest API
4. Public profile page scraping as fallback

**Key Features:**
- Submissions-based problem counting
- Contest participation tracking
- Professional profile information
- Multiple data source fallbacks

### 3. LeetCode

**Data Structure:**
- `totalSolved`: Total problems solved
- `easySolved`: Easy problems solved
- `mediumSolved`: Medium problems solved
- `hardSolved`: Hard problems solved
- `acceptanceRate`: Problem acceptance rate
- `rating`: Current rating
- `rank`: Current ranking
- `contributionPoints`: Contribution points
- `reputation`: User reputation

**API Endpoints Used:**
- `https://leetcode-stats-api.herokuapp.com/{username}` - LeetCode Stats API

**Key Features:**
- Difficulty-based problem categorization
- Acceptance rate tracking
- Comprehensive problem statistics

## Database Schema Updates

### New Fields Added

```sql
-- CodeChef-specific fields
ALTER TABLE coding_profiles 
ADD COLUMN stars INT DEFAULT 0,
ADD COLUMN country VARCHAR(100) DEFAULT '',
ADD COLUMN institution VARCHAR(255) DEFAULT '',
ADD COLUMN member_since VARCHAR(100) DEFAULT '',
ADD COLUMN practice_problems INT DEFAULT 0,
ADD COLUMN contest_problems INT DEFAULT 0;

-- HackerRank-specific fields
ALTER TABLE coding_profiles 
ADD COLUMN school VARCHAR(255) DEFAULT '',
ADD COLUMN company VARCHAR(255) DEFAULT '',
ADD COLUMN job_title VARCHAR(255) DEFAULT '',
ADD COLUMN bio TEXT;

-- Generic platform-specific data
ADD COLUMN platform_specific_data JSON DEFAULT NULL;
```

### Database View

A new view `coding_profiles_platform_view` provides platform-specific data in JSON format:

```sql
CREATE OR REPLACE VIEW coding_profiles_platform_view AS
SELECT 
    cp.*,
    cpl.name as platform_name,
    cpl.display_name as platform_display_name,
    CASE 
        WHEN cpl.name = 'codechef' THEN JSON_OBJECT(
            'stars', cp.stars,
            'country', cp.country,
            'institution', cp.institution,
            'member_since', cp.member_since,
            'practice_problems', cp.practice_problems,
            'contest_problems', cp.contest_problems
        )
        WHEN cpl.name = 'hackerrank' THEN JSON_OBJECT(
            'country', cp.country,
            'school', cp.school,
            'company', cp.company,
            'job_title', cp.job_title,
            'bio', cp.bio
        )
        WHEN cpl.name = 'leetcode' THEN JSON_OBJECT(
            'easy_solved', cp.easy_solved,
            'medium_solved', cp.medium_solved,
            'hard_solved', cp.hard_solved,
            'acceptance_rate', cp.acceptance_rate
        )
        ELSE cp.platform_specific_data
    END as platform_data
FROM coding_profiles cp
JOIN coding_platforms cpl ON cp.platform_id = cpl.id;
```

## API Response Structure

### User Coding Profiles Response

```json
{
  "success": true,
  "data": [
    {
      "id": "profile-id",
      "user_id": "user-id",
      "platform_id": "platform-id",
      "username": "username",
      "total_solved": 150,
      "rating": 1800,
      "rank": 5000,
      "platform_key": "codechef",
      "platform_name": "CodeChef",
      "platform_specific_data": {
        "stars": 4,
        "country": "India",
        "institution": "IIT Delhi",
        "member_since": "2020-01-01",
        "practice_problems": 120,
        "contest_problems": 30
      }
    }
  ]
}
```

## Implementation Benefits

### 1. Platform-Aware Data Retrieval
- Each platform uses its native API structure
- No more forcing LeetCode patterns on other platforms
- Accurate data representation per platform

### 2. Robust Fallback Mechanisms
- Multiple API endpoints per platform
- HTML scraping as last resort
- Rate limiting protection

### 3. Rich Data Storage
- Platform-specific fields stored separately
- JSON aggregation for easy access
- Maintains backward compatibility

### 4. Performance Optimization
- Proper indexing on new fields
- Efficient data retrieval with views
- Minimal API calls with smart fallbacks

## Migration Instructions

1. **Run the migration:**
   ```bash
   mysql -u username -p database_name < backend/database/migrate_add_platform_specific_fields.sql
   ```

2. **Update existing profiles:**
   - The system will automatically populate new fields with default values
   - Existing data remains intact

3. **Test the new endpoints:**
   - `/api/coding-profiles/user/:userId` - Get user profiles with platform data
   - `/api/coding-profiles/fetch/:userId/:platformId` - Fetch fresh platform data

## Error Handling

- **API Failures**: Graceful fallback to alternative methods
- **Rate Limiting**: Built-in delays between API calls
- **Data Validation**: Ensures all required fields have default values
- **Logging**: Comprehensive logging for debugging and monitoring

## Future Enhancements

1. **Additional Platforms**: Easy to add new platforms with custom data structures
2. **Real-time Updates**: Webhook support for automatic data updates
3. **Analytics**: Platform-specific performance metrics
4. **Achievement System**: Platform-specific badges and milestones

## Troubleshooting

### Common Issues

1. **API Rate Limiting**: Check logs for rate limit errors, increase delays if needed
2. **Data Not Updating**: Verify API endpoints are accessible, check network connectivity
3. **Missing Fields**: Ensure migration has been run successfully
4. **Platform-Specific Data**: Verify the platform is correctly identified in the database

### Debug Mode

Enable detailed logging by setting environment variable:
```bash
DEBUG_CODING_PROFILES=true
```

This will provide detailed API call logs and data extraction information.
