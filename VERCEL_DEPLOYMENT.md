# Vercel Deployment Guide

This guide explains how to deploy the AI LMS Platform to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. A MySQL database (recommended: PlanetScale, Railway, or AWS RDS)
3. Environment variables configured

## Environment Variables

Configure the following environment variables in your Vercel dashboard:

### Required Environment Variables

```env
# Database Configuration
DB_HOST=your_database_host
DB_USER=your_database_username
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_secure_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Server Configuration
NODE_ENV=production
PORT=3000

# Frontend URL (your Vercel domain)
FRONTEND_URL=https://your-app.vercel.app

# Judge0 Configuration (for coding problems)
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Super Admin Registration
SUPER_ADMIN_REGISTRATION_CODE=SUPER_ADMIN_2024
```

### Optional Environment Variables

```env
# Redis Configuration (if using Redis for caching)
REDIS_URL=your_redis_url

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads
```

## Deployment Steps

1. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Build Settings:**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Set Environment Variables:**
   - Go to Project Settings > Environment Variables
   - Add all required environment variables listed above

4. **Deploy:**
   - Click "Deploy"
   - Wait for the build to complete

## Database Setup

1. **Create Database:**
   ```sql
   CREATE DATABASE lms_platform;
   ```

2. **Import Schema:**
   - Use the SQL files in `backend/database/` to create tables
   - Or use a database migration tool

3. **Update Connection:**
   - Update the `DB_HOST`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` in Vercel environment variables

## Post-Deployment

1. **Access the Application:**
   - Your app will be available at `https://your-app.vercel.app`

2. **Create Super Admin:**
   - Register with the super admin code: `SUPER_ADMIN_2024`
   - Or use the default credentials if configured

3. **Configure Judge0 (for coding problems):**
   - Sign up for Judge0 API at [rapidapi.com](https://rapidapi.com)
   - Update `JUDGE0_API_URL` with your API endpoint

## Troubleshooting

### Common Issues

1. **Database Connection Error:**
   - Verify database credentials
   - Check if database allows external connections
   - Ensure database is running

2. **Build Failures:**
   - Check Node.js version (should be 18+)
   - Verify all dependencies are installed
   - Check for TypeScript errors

3. **API Routes Not Working:**
   - Verify `vercel.json` configuration
   - Check if API functions are properly exported
   - Review Vercel function logs

### Debugging

1. **View Logs:**
   - Go to Vercel Dashboard > Functions
   - Click on your function to view logs

2. **Test API Endpoints:**
   - Use tools like Postman or curl
   - Test: `https://your-app.vercel.app/api/health`

## Performance Optimization

1. **Enable Caching:**
   - Configure Redis for session storage
   - Use Vercel's edge caching

2. **Database Optimization:**
   - Add proper indexes
   - Use connection pooling
   - Consider read replicas

3. **Frontend Optimization:**
   - Enable Vercel's automatic optimizations
   - Use CDN for static assets

## Security Considerations

1. **Environment Variables:**
   - Never commit `.env` files
   - Use Vercel's secure environment variable storage

2. **Database Security:**
   - Use strong passwords
   - Enable SSL connections
   - Restrict database access

3. **API Security:**
   - Implement rate limiting
   - Use HTTPS only
   - Validate all inputs

## Monitoring

1. **Vercel Analytics:**
   - Enable Vercel Analytics for performance monitoring

2. **Error Tracking:**
   - Consider integrating Sentry or similar service

3. **Database Monitoring:**
   - Monitor database performance
   - Set up alerts for issues

## Scaling

1. **Serverless Functions:**
   - Vercel automatically scales functions
   - Monitor function execution time

2. **Database Scaling:**
   - Consider database scaling options
   - Implement caching strategies

3. **CDN:**
   - Vercel provides global CDN
   - Optimize static assets

## Support

For issues with this deployment:
1. Check Vercel documentation
2. Review function logs
3. Test API endpoints individually
4. Verify environment variables
