# Student Year Feature Implementation

This document describes the implementation of the student year feature in the AI LMS Platform.

## Overview

The student year feature allows administrators to:
- Set a joining year when creating new students
- Set a final year for expected completion
- Automatically calculate current year based on joining date
- Track student progression through their academic journey
- Support mid-year academic cycles (June/July start)

## Features

### 1. Year Fields for Students
- **Joining Year**: When the student started their academic journey
- **Final Year**: When they're expected to complete their studies
- **Current Year**: Automatically calculated based on joining year and current date
- **Year Start Date**: Tracks when the academic year started (June 1st)

### 2. Automatic Year Calculation
- Current year is automatically calculated as: `joining_year + years_elapsed`
- Years increment after 365 days from start date
- Uses stored procedures `CalculateCurrentYear()` and `UpdateStudentYears()`
- Automatic updates occur annually on June 1st
- Manual updates can be triggered via the "Update Student Years" button

### 3. Database Changes
- Added `joining_year` INT column to users table
- Added `final_year` INT column to users table
- Added `current_year` INT column to users table
- Added `year_start_date` DATE column to track when the year started
- Created indexes for better performance
- Added stored procedures for year calculations and updates

## Implementation Details

### Database Migration
The migration file `backend/database/migrate_add_student_year.sql` adds:
- `joining_year` INT column (nullable)
- `final_year` INT column (nullable)
- `current_year` INT column (nullable)
- `year_start_date` DATE column (nullable)
- Indexes for performance
- Stored procedure `CalculateCurrentYear()`
- Stored procedure `UpdateStudentYears()`
- Annual event for automatic updates

### Backend Changes
- Updated `userManagementController.js` to handle year fields
- Added year validation for students
- Added year calculation logic
- Added year update functionality
- Updated bulk upload to handle year fields

### Frontend Changes
- Added joining year field to user creation form
- Added final year field to user creation form
- Added year fields to user edit form
- Added year display in user list (joining, current, final)
- Added "Update Student Years" button
- Year fields only appear for student role

## Usage

### Creating a New Student
1. Go to User Management → Add User
2. Select role as "Student"
3. Fill in required fields including "Joining Year" and "Final Year"
4. Final year automatically defaults to joining year + 4
5. Current year is automatically calculated

### Updating Student Years
1. Use the "Update Student Years" button to manually trigger updates
2. Years will automatically update annually on June 1st
3. The system calculates current year based on joining date and elapsed time

### Bulk Upload
- Excel templates now include `joining_year` and `final_year` columns
- If years are not specified, defaults to current year + 4 years
- Year format should be just the year number (e.g., 2024)

## API Endpoints

### New Endpoint
- `POST /users/update-student-years` - Manually trigger year updates

### Updated Endpoints
- `POST /users` - Now accepts `joining_year` and `final_year` fields
- `PUT /users/:userId` - Now accepts `joining_year` and `final_year` fields
- `POST /users/bulk-upload` - Now handles year fields

## Database Schema Changes

```sql
-- New columns in users table
ALTER TABLE users 
ADD COLUMN joining_year INT DEFAULT NULL AFTER student_id,
ADD COLUMN final_year INT DEFAULT NULL AFTER joining_year,
ADD COLUMN current_year INT DEFAULT NULL AFTER final_year,
ADD COLUMN year_start_date DATE DEFAULT NULL AFTER current_year;

-- New indexes
CREATE INDEX idx_joining_year ON users(joining_year);
CREATE INDEX idx_final_year ON users(final_year);
CREATE INDEX idx_current_year ON users(current_year);
CREATE INDEX idx_year_start_date ON users(year_start_date);
```

## Stored Procedures

### CalculateCurrentYear()
- Calculates current year based on joining year and elapsed time
- Formula: `current_year = joining_year + (current_date - year_start_date) / 365`
- Ensures current year doesn't exceed final year

### UpdateStudentYears()
- Updates years for students whose year started 365+ days ago
- Increments current year and updates start date
- Only updates students whose current year is less than final year
- Returns count of updated students

## Automatic Updates

The system creates an annual event that runs on June 1st:
```sql
CREATE EVENT annual_student_year_update
ON SCHEDULE EVERY 1 YEAR
STARTS '2025-06-01 00:00:00'
DO CALL UpdateStudentYears();
```

## Running the Migration

1. Ensure your database credentials are set in environment variables
2. Run the migration script:
   ```bash
   cd backend
   node run-student-year-migration.cjs
   ```

## Notes

- **Academic Year**: Assumes June-May academic calendar (mid-year start)
- **Default Years**: Existing students set to joining year 2024, final year 2028
- **Year Calculation**: Current year automatically calculated from joining date
- **Performance**: Indexes added for year queries
- **Backward Compatibility**: Non-student users unaffected
- **Validation**: Joining and final years required for students

## Future Enhancements

- Academic calendar integration
- Semester-based progression
- Year validation based on college policies
- Bulk year updates for specific groups
- Year history tracking
- Program duration customization

