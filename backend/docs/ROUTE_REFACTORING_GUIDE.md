# Route Refactoring Guide

## LOW PRIORITY FIX: Separating Concerns in Routes

This guide explains how to refactor routes to move business logic to controllers/services.

## Current Pattern (Mixed Concerns)

**Bad Example:**
```javascript
// Route with business logic
router.post('/submit', async (req, res) => {
    const { submissionId, answers } = req.body;
    
    // Business logic in route (BAD)
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    // Complex calculations
    let totalScore = 0;
    for (const answer of answers) {
        // ... scoring logic ...
    }
    
    await connection.query('UPDATE submissions SET score = ?', [totalScore]);
    await connection.commit();
    
    res.json({ success: true });
});
```

## Recommended Pattern (Separated Concerns)

**Good Example:**
```javascript
// Route (thin layer)
router.post('/submit', auth, validateCSRFToken, async (req, res) => {
    try {
        const { submissionId, answers } = req.body;
        const studentId = getUserId(req);
        
        // Delegate to service
        const result = await studentAssessmentService.submitAssessment(
            submissionId, 
            answers, 
            studentId
        );
        
        res.json(result);
    } catch (error) {
        handleError(res, error);
    }
});
```

## Refactoring Steps

1. **Identify Business Logic in Routes**
   - Look for database queries
   - Find calculations and data transformations
   - Locate validation logic beyond input validation

2. **Move to Controllers**
   - Controllers handle request/response
   - Validate input
   - Call services
   - Format responses

3. **Move to Services**
   - Services contain business logic
   - Database operations
   - Calculations
   - External API calls

## Example Refactoring

### Before (Route with Logic)
```javascript
router.get('/analytics', async (req, res) => {
    const { collegeId, dateRange } = req.query;
    
    // Business logic in route
    const connection = await pool.getConnection();
    const [data] = await connection.query(`
        SELECT * FROM assessments 
        WHERE college_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [collegeId, dateRange]);
    
    // Calculations
    const total = data.length;
    const average = data.reduce((sum, item) => sum + item.score, 0) / total;
    
    res.json({ total, average, data });
});
```

### After (Separated Concerns)
```javascript
// Route
router.get('/analytics', auth, async (req, res) => {
    try {
        const filters = req.query;
        const result = await analyticsController.getAnalytics(filters);
        res.json(result);
    } catch (error) {
        handleError(res, error);
    }
});

// Controller
export const getAnalytics = async (filters) => {
    const data = await analyticsService.getAnalyticsData(filters);
    const stats = analyticsService.calculateStats(data);
    return { success: true, data: stats };
};

// Service
export const getAnalyticsData = async (filters) => {
    const connection = await pool.getConnection();
    try {
        const [data] = await connection.query(/* ... */);
        return data;
    } finally {
        connection.release();
    }
};
```

## Benefits

- ✅ **Testability**: Services can be tested independently
- ✅ **Reusability**: Business logic can be reused across routes
- ✅ **Maintainability**: Clear separation of concerns
- ✅ **Scalability**: Easier to add new features

## Current Status

Most routes already delegate to services. Remaining refactoring opportunities:
- Some routes have inline database queries
- A few routes contain calculations
- Some validation logic could be moved to middleware

## Priority

This is a low priority refactoring that can be done incrementally as routes are modified.

