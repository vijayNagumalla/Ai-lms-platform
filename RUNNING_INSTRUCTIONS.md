# Running Instructions

## Prerequisites
- Node.js (v16 or higher)
- Docker Desktop (for coding assessments)
- MySQL database

## Starting the Application

### Option 1: Using PowerShell Scripts (Recommended for Windows)

1. **Start Backend Server:**
   ```powershell
   .\start-backend.ps1
   ```

2. **Start Frontend Server (in a new terminal):**
   ```powershell
   .\start-frontend.ps1
   ```

### Option 2: Manual Commands

1. **Start Backend Server:**
   ```powershell
   cd backend
   npm start
   ```

2. **Start Frontend Server (in a new terminal):**
   ```powershell
   npm run dev
   ```

## Docker Service Issues

If you encounter Docker-related errors:

1. **Ensure Docker Desktop is running**
2. **Check Docker images are available:**
   ```powershell
   docker images
   ```

3. **Pull required images if missing:**
   ```powershell
   docker pull python:3.9-alpine
   docker pull node:18-alpine
   docker pull openjdk:17-jdk-alpine
   docker pull gcc:latest
   ```

4. **Test Docker service:**
   ```powershell
   node test-docker.js
   ```

5. **Test coding evaluation:**
   ```powershell
   node test-coding-evaluation.js
   ```

6. **Test results display:**
    ```powershell
    node test-results-display.js
    ```

7. **Test stored coding results:**
    ```powershell
    node test-stored-results.js
    ```

## Assessment Attempt Limits

The system now properly enforces:
- Maximum attempt limits per assessment
- Time between attempts
- Proper attempt counting and validation

## Coding Assessment Results

The system now:
- Evaluates coding questions during submission and stores results
- Uses stored results for display instead of re-evaluating
- Properly detects and stores the programming language used
- Shows test case summary (passed/total) and score
- Displays the submitted code without re-execution

## Troubleshooting

### PowerShell Syntax Issues
- Use `;` instead of `&&` for command chaining
- Use the provided PowerShell scripts

### Docker Issues
- Ensure Docker Desktop is running
- Check that required images are pulled
- Verify Docker service has proper permissions

### Database Issues
- Ensure MySQL is running
- Check database connection settings in `backend/config/database.js`
- Run database migrations if needed 