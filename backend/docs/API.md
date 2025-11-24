# API Documentation

## LOW PRIORITY FIX: API Documentation Structure

This document provides an overview of the API endpoints. For detailed Swagger/OpenAPI documentation, see the `/api-docs` endpoint when the server is running.

## Base URL

```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Common Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": { ... }
  }
}
```

## Endpoints

### Authentication (`/api/auth`)

#### POST `/api/auth/login`
Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt-token",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "role": "student"
    }
  }
}
```

#### POST `/api/auth/register`
Register a new user (role-specific).

### Assessments (`/api/assessments`)

#### GET `/api/assessments`
Get list of assessments (with filters).

**Query Parameters:**
- `collegeId` - Filter by college
- `department` - Filter by department
- `status` - Filter by status (draft, scheduled, active, completed)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)

#### GET `/api/assessments/:id`
Get assessment details by ID.

#### POST `/api/assessments`
Create a new assessment (requires faculty/admin role).

**Request:**
```json
{
  "title": "Assessment Title",
  "description": "Description",
  "time_limit_minutes": 60,
  "total_points": 100,
  "questions": [...]
}
```

### Student Assessments (`/api/student-assessments`)

#### GET `/api/student-assessments`
Get assessments assigned to the authenticated student.

#### POST `/api/student-assessments/:id/start`
Start an assessment.

#### POST `/api/student-assessments/:id/submit`
Submit an assessment.

### Analytics (`/api/analytics`)

#### GET `/api/analytics/data`
Get analytics data with filters.

**Query Parameters:**
- `viewType` - Type of view (college, department, student)
- `collegeId` - Filter by college
- `departmentId` - Filter by department
- `dateRange` - Date range filter (30, 60, 90, all)
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)

### Health Check

#### GET `/health`
Health check endpoint (no authentication required).

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "environment": "development",
  "checks": {
    "database": "connected",
    "memory": {
      "used": 100,
      "total": 512
    }
  }
}
```

## Error Codes

See `backend/utils/errorCodes.js` for complete list of error codes.

Common error codes:
- `AUTH_1001` - Authentication required
- `AUTH_1002` - Invalid or expired token
- `VAL_2001` - Invalid input
- `RES_3001` - Resource not found
- `SRV_5001` - Internal server error

## Rate Limiting

- Global: 100 requests per 15 minutes per IP
- Authentication: 5 requests per 15 minutes per IP
- API endpoints: 100 requests per 15 minutes per IP

## Pagination

All list endpoints support pagination:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50, max: 100)

## File Uploads

Maximum file size: 10MB

Allowed file types:
- Images: JPEG, PNG, GIF
- Documents: PDF, DOC, DOCX
- Spreadsheets: XLS, XLSX, CSV

## Notes

- All timestamps are in ISO 8601 format
- All IDs are UUIDs
- All monetary values are in the base currency unit
- Date ranges use ISO 8601 format (YYYY-MM-DD)

