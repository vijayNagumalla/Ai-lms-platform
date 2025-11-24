# 🚀 Supabase Migration Guide

This guide will help you migrate your AI LMS Platform from MySQL to Supabase (PostgreSQL) for deployment.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setting Up Supabase](#setting-up-supabase)
3. [Database Schema Migration](#database-schema-migration)
4. [Environment Configuration](#environment-configuration)
5. [Code Changes](#code-changes)
6. [Testing the Migration](#testing-the-migration)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Node.js and npm installed
- Your existing MySQL database (for data migration if needed)

## Setting Up Supabase

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in your project details:
   - **Name**: AI LMS Platform (or your preferred name)
   - **Database Password**: Choose a strong password (save it securely)
   - **Region**: Choose the region closest to your users
4. Click "Create new project"
5. Wait for the project to be set up (takes 1-2 minutes)

### Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (this is your `SUPABASE_URL`)
   - **anon/public key** (this is your `SUPABASE_ANON_KEY`)
   - **service_role key** (this is your `SUPABASE_SERVICE_ROLE_KEY`)

⚠️ **Security Note**: The service role key has admin privileges. Never expose it in client-side code!

## Database Schema Migration

### Step 1: Run the PostgreSQL Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. **First, run the main schema:**
   - Open the file `backend/database/schema-supabase.sql`
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click "Run" to execute the schema

3. **Then, run the extended schema (optional but recommended):**
   - Open the file `backend/database/schema-supabase-extended.sql`
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click "Run" to execute the extended schema

This will create all the necessary tables, indexes, and triggers including:
- Core tables (users, colleges, courses, assessments, etc.)
- Question bank tables
- Coding profiles tables
- Project management tables
- And more...

### Step 2: Verify Tables

1. Go to **Table Editor** in your Supabase dashboard
2. Verify that all tables are created:
   - `colleges`
   - `users`
   - `departments`
   - `courses`
   - `course_enrollments`
   - `course_modules`
   - `course_content`
   - `assessments`
   - `assessment_questions`
   - `assessment_submissions`
   - `questions`
   - `question_categories`
   - And other tables...

### Step 3: (Optional) Migrate Existing Data

If you have existing data in MySQL that you want to migrate:

1. Export your MySQL data to CSV or SQL format
2. Convert the data format to match PostgreSQL (UUIDs, timestamps, etc.)
3. Use Supabase's Table Editor or SQL Editor to import the data

**Note**: For production migrations, consider using a data migration script or tool.

## Environment Configuration

### Step 1: Update Your .env File

Add the following to your `backend/.env` file:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

Replace the placeholder values with your actual Supabase credentials.

### Step 2: Install Dependencies

```bash
cd backend
npm install
```

This will install the `@supabase/supabase-js` package.

## Code Changes

### What Has Changed

The migration maintains backward compatibility with your existing code:

1. **Database Configuration** (`backend/config/database.js`):
   - Now uses Supabase client instead of MySQL
   - Provides a compatibility layer that mimics `pool.execute()`
   - Automatically converts MySQL-style queries to Supabase queries

2. **Query Compatibility**:
   - Most `pool.execute()` calls will work without changes
   - Simple SELECT, INSERT, UPDATE, DELETE queries are automatically converted
   - Complex queries may need manual conversion

### Query Patterns That Work Automatically

✅ **These work automatically:**
```javascript
// SELECT queries
const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);

// INSERT queries
const [result] = await pool.execute(
  'INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)',
  [id, email, password, name, role]
);

// UPDATE queries
const [result] = await pool.execute(
  'UPDATE users SET name = ? WHERE id = ?',
  [newName, userId]
);

// DELETE queries
const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
```

### Query Patterns That Need Manual Conversion

❌ **These need to be converted to Supabase queries:**

1. **Complex JOINs**: Convert to Supabase's `.select()` with joins
2. **Stored Procedures**: Convert to Supabase RPC functions
3. **Transactions**: Supabase handles transactions automatically
4. **Raw SQL with functions**: May need to use Supabase RPC

**Example Conversion:**

```javascript
// MySQL (old)
const [rows] = await pool.execute(`
  SELECT u.*, c.name as college_name 
  FROM users u 
  LEFT JOIN colleges c ON u.college_id = c.id 
  WHERE u.role = ?
`, ['student']);

// Supabase (new)
const { data, error } = await supabase
  .from('users')
  .select('*, colleges(name)')
  .eq('role', 'student');
```

## Testing the Migration

### Step 1: Test Database Connection

```bash
cd backend
npm start
```

Check the logs for:
```
✅ Supabase connected successfully
```

### Step 2: Test Basic Operations

1. **Test User Registration**:
   - Use your registration endpoint
   - Verify a user is created in Supabase

2. **Test User Login**:
   - Login with the created user
   - Verify JWT token is generated

3. **Test CRUD Operations**:
   - Create, read, update, delete operations
   - Check Supabase dashboard to verify data

### Step 3: Test All Features

Go through your application and test:
- ✅ User authentication
- ✅ College management
- ✅ Course management
- ✅ Assessment creation
- ✅ Question bank
- ✅ Submissions
- ✅ Analytics

## Deployment

### Vercel Deployment

1. **Add Environment Variables**:
   - Go to your Vercel project settings
   - Add the Supabase environment variables:
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`

2. **Deploy**:
   ```bash
   vercel --prod
   ```

### Other Platforms

For other deployment platforms (Railway, Render, etc.):
1. Add the Supabase environment variables
2. Deploy as usual

## Troubleshooting

### Common Issues

#### 1. "Missing Supabase configuration" Error

**Solution**: Make sure you've added `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to your `.env` file.

#### 2. "relation does not exist" Error

**Solution**: Run the schema migration SQL in Supabase SQL Editor.

#### 3. Query Not Working

**Solution**: 
- Check if the query is too complex for automatic conversion
- Convert it manually to use Supabase's query builder
- Or use Supabase RPC functions for complex queries

#### 4. UUID vs VARCHAR Issues

**Solution**: The schema uses UUIDs. Make sure your code generates UUIDs (not MySQL auto-increment IDs).

#### 5. Timestamp Issues

**Solution**: Supabase uses `TIMESTAMP WITH TIME ZONE`. The compatibility layer handles this automatically.

### Getting Help

- Check Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
- Check Supabase Discord: [discord.supabase.com](https://discord.supabase.com)
- Review the error logs in your application

## Key Differences: MySQL vs Supabase

| Feature | MySQL | Supabase (PostgreSQL) |
|---------|-------|----------------------|
| **IDs** | VARCHAR(36) or AUTO_INCREMENT | UUID (default) |
| **JSON** | JSON | JSONB (better performance) |
| **ENUM** | ENUM type | CHECK constraint |
| **Timestamps** | TIMESTAMP | TIMESTAMP WITH TIME ZONE |
| **Auto-update** | ON UPDATE CURRENT_TIMESTAMP | Trigger function |
| **Connection** | Connection pool | HTTP client (no pool needed) |

## Next Steps

1. ✅ Complete the migration
2. ✅ Test all features
3. ✅ Deploy to production
4. 📊 Monitor performance in Supabase dashboard
5. 🔒 Set up Row Level Security (RLS) policies if needed
6. 📈 Set up database backups in Supabase

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)

---

**Need Help?** If you encounter any issues during migration, check the troubleshooting section or refer to the Supabase documentation.

