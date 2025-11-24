# API Rate Limiting Documentation

**Last Updated:** 2024  
**Status:** Documentation

## Overview

This document describes the rate limiting policies and implementation for the AI LMS Platform API.

## Rate Limiting Implementation

### Current Status

Rate limiting is implemented using middleware that tracks request counts per IP address and user session.

### Rate Limits by Endpoint

#### Authentication Endpoints
- **Login**: 5 requests per 15 minutes per IP
- **Signup**: 3 requests per 15 minutes per IP
- **Password Reset**: 3 requests per hour per IP

#### Assessment Endpoints
- **Start Assessment**: 10 requests per hour per user
- **Save Answer**: 100 requests per minute per user
- **Submit Assessment**: 5 requests per hour per user
- **Get Assessment Questions**: 20 requests per minute per user

#### Analytics Endpoints
- **Get Analytics Data**: 30 requests per minute per user
- **Export Analytics**: 5 requests per hour per user

#### General API Endpoints
- **Default Rate Limit**: 100 requests per minute per IP
- **Burst Allowance**: Up to 20 requests in a single second

## Rate Limit Headers

All API responses include the following headers:

- `X-RateLimit-Limit`: Maximum number of requests allowed in the time window
- `X-RateLimit-Remaining`: Number of requests remaining in the current window
- `X-RateLimit-Reset`: Unix timestamp when the rate limit window resets

### Example Response Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200
```

## Rate Limit Exceeded Response

When a rate limit is exceeded, the API returns:

**Status Code:** `429 Too Many Requests`

**Response Body:**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please wait a moment and try again.",
    "retryAfter": 60
  }
}
```

**Headers:**
- `Retry-After`: Number of seconds to wait before retrying

## Best Practices

### For API Consumers

1. **Implement Exponential Backoff**: When receiving a 429 response, wait for the `Retry-After` period before retrying
2. **Cache Responses**: Cache frequently accessed data to reduce API calls
3. **Batch Requests**: Combine multiple operations into single requests where possible
4. **Monitor Rate Limit Headers**: Track remaining requests to avoid hitting limits

### Example: Handling Rate Limits

```javascript
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, options);
    
    // Check rate limit headers
    const remaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '0');
    if (remaining < 10) {
      console.warn('Rate limit approaching, remaining:', remaining);
    }
    
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
      console.log(`Rate limit exceeded, retrying after ${retryAfter} seconds`);
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return makeRequest(url, options); // Retry
    }
    
    return response;
  } catch (error) {
    throw error;
  }
}
```

## Rate Limit Configuration

Rate limits can be configured in the following locations:

- **Middleware**: `backend/middleware/rateLimiter.js`
- **Environment Variables**: Set custom limits via `.env` file
- **Per-Route**: Individual routes can override default limits

## Exemptions

The following endpoints are exempt from rate limiting:

- Health check endpoints (`/health`, `/api/health`)
- Static asset serving
- WebSocket connections (separate limits apply)

## Monitoring

Rate limit violations are logged and can be monitored through:

- Application logs
- Error tracking services (if configured)
- API analytics dashboard

## Future Improvements

- [ ] Implement sliding window rate limiting
- [ ] Add user-based rate limiting tiers (premium users get higher limits)
- [ ] Implement distributed rate limiting for multi-server deployments
- [ ] Add rate limit metrics to analytics dashboard

---

**Note:** Rate limiting policies may be adjusted based on system load and abuse patterns. Users will be notified of significant changes.

