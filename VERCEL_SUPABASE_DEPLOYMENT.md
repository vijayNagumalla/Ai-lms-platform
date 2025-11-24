# 🚀 Vercel + Supabase Deployment Guide

Complete guide to deploy your AI LMS Platform to Vercel with Supabase database.

## 📋 Prerequisites

1. ✅ **Supabase Project** - Already set up (see [SUPABASE_QUICK_START.md](./SUPABASE_QUICK_START.md))
2. ✅ **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. ✅ **GitHub Repository** - Your code pushed to GitHub

## 🎯 Quick Deployment (5 minutes)

### Step 1: Prepare Your Repository

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment with Supabase"
   git push origin main
   ```

2. **Verify these files exist:**
   - ✅ `vercel.json` - Vercel configuration
   - ✅ `api/index.js` - Serverless function handler
   - ✅ `package.json` - With `vercel-build` script
   - ✅ `backend/database/schema-supabase.sql` - Database schema

### Step 2: Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com)** and sign in
2. **Click "Add New..." → "Project"**
3. **Import your GitHub repository:**
   - Select your repository
   - Click "Import"

4. **Configure Project Settings:**
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (leave as default)
   - **Build Command:** `npm run vercel-build` (or `npm run build`)
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

5. **Add Environment Variables:**
   Click "Environment Variables" and add:

   ```env
   # Supabase Configuration
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   
   # JWT Configuration
   JWT_SECRET=your_secure_jwt_secret_key_minimum_32_characters_long
   JWT_EXPIRES_IN=7d
   
   # CSRF Protection
   CSRF_SECRET=your_csrf_secret_here
   
   # Encryption Key (minimum 32 characters)
   ENCRYPTION_KEY=your_encryption_key_here
   
   # Server Configuration
   NODE_ENV=production
   PORT=3000
   
   # Frontend URL (will be your Vercel domain)
   FRONTEND_URL=https://your-app.vercel.app
   
   # Super Admin Registration
   SUPER_ADMIN_REGISTRATION_CODE=your_secure_code_here
   
   # Email Configuration (Optional)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=noreply@lms-platform.com
   
   # Judge0 Configuration (Optional - for coding questions)
   JUDGE0_URL=http://localhost:2358
   JUDGE0_API_KEY=your_judge0_api_key_here
   ```

   ⚠️ **Important:** 
   - Replace all placeholder values with your actual credentials
   - `FRONTEND_URL` will be your Vercel domain (e.g., `https://your-app.vercel.app`)
   - You can update `FRONTEND_URL` after first deployment

6. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete (2-5 minutes)

#### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Add Environment Variables:**
   ```bash
   vercel env add SUPABASE_URL
   vercel env add SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   vercel env add JWT_SECRET
   # ... add all other variables
   ```

5. **Deploy to Production:**
   ```bash
   vercel --prod
   ```

### Step 3: Update Frontend URL

After deployment, update the `FRONTEND_URL` environment variable:

1. Go to **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**
2. Update `FRONTEND_URL` to your actual Vercel domain
3. **Redeploy** (or wait for automatic redeploy)

### Step 4: Verify Deployment

1. **Check your app:**
   - Visit `https://your-app.vercel.app`
   - You should see the login page

2. **Test API:**
   - Visit `https://your-app.vercel.app/api/health`
   - Should return: `{"status":"OK","database":"connected"}`

3. **Test Registration:**
   - Try registering a new user
   - Check Supabase dashboard to verify data

## 🔧 Configuration Details

### Vercel Configuration (`vercel.json`)

The `vercel.json` file configures:
- **Static Build:** Frontend React app
- **API Routes:** All `/api/*` routes go to `api/index.js`
- **Function Settings:** 30s timeout, 1024MB memory

### API Handler (`api/index.js`)

The API handler:
- Uses Supabase for database (via `backend/config/database.js`)
- Handles all API routes
- Optimized for serverless execution

### Build Process

1. **Frontend Build:**
   - Runs `npm run vercel-build` (which runs `vite build`)
   - Outputs to `dist/` directory
   - Served as static files

2. **Backend API:**
   - `api/index.js` is a serverless function
   - Handles all `/api/*` requests
   - Uses Supabase for database

## 🔐 Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Your Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJhbGc...` |
| `JWT_SECRET` | Secret for JWT tokens | `your-secret-key` |
| `CSRF_SECRET` | CSRF protection secret | `your-csrf-secret` |
| `ENCRYPTION_KEY` | Encryption key (32+ chars) | `your-encryption-key` |
| `FRONTEND_URL` | Your Vercel domain | `https://app.vercel.app` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_EXPIRES_IN` | JWT token expiration | `7d` |
| `SUPER_ADMIN_REGISTRATION_CODE` | Super admin code | Required for super admin |
| `SMTP_HOST` | Email SMTP host | - |
| `SMTP_USER` | Email username | - |
| `SMTP_PASS` | Email password | - |

## 🐛 Troubleshooting

### Issue: Build Fails

**Solution:**
1. Check build logs in Vercel dashboard
2. Verify Node.js version (should be 18+)
3. Check for missing dependencies
4. Verify `package.json` has correct scripts

### Issue: API Routes Return 404

**Solution:**
1. Verify `vercel.json` has correct routes
2. Check `api/index.js` exists and exports correctly
3. Verify environment variables are set
4. Check function logs in Vercel dashboard

### Issue: Database Connection Error

**Solution:**
1. Verify Supabase credentials are correct
2. Check Supabase project is active
3. Verify database schema is created
4. Check Supabase dashboard for connection issues

### Issue: CORS Errors

**Solution:**
1. Update `FRONTEND_URL` environment variable
2. Check CORS configuration in `api/index.js`
3. Verify frontend is making requests to correct domain

### Issue: Environment Variables Not Working

**Solution:**
1. Redeploy after adding environment variables
2. Verify variables are set for "Production" environment
3. Check variable names match exactly (case-sensitive)
4. Restart deployment

## 📊 Monitoring

### Vercel Dashboard

- **Functions:** View API function logs and performance
- **Analytics:** Monitor traffic and performance
- **Deployments:** View deployment history

### Supabase Dashboard

- **Database:** View tables and data
- **Logs:** Check database query logs
- **API:** Monitor API usage

## 🚀 Post-Deployment

### 1. Create Super Admin

1. Visit your app: `https://your-app.vercel.app`
2. Click "Register"
3. Use your `SUPER_ADMIN_REGISTRATION_CODE`
4. Create the first super admin account

### 2. Set Up Email (Optional)

1. Configure SMTP settings in environment variables
2. Test email sending from the app
3. Verify emails are received

### 3. Configure Judge0 (Optional)

1. Set up Judge0 for coding questions
2. Add `JUDGE0_URL` and `JUDGE0_API_KEY`
3. Test coding question execution

## 🔄 Updating Your Deployment

### Automatic Updates

- Push to `main` branch → Auto-deploys
- Vercel watches your GitHub repo
- Deployments are automatic

### Manual Updates

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Or force redeploy
vercel --prod
```

## 📈 Scaling

### Vercel Free Tier Limits

- ✅ **100GB bandwidth/month**
- ✅ **100 serverless function executions/day** (unlimited for Pro)
- ✅ **10-second function timeout** (30s with config)
- ✅ **Unlimited static hosting**

### Supabase Free Tier Limits

- ✅ **500MB database**
- ✅ **2GB bandwidth**
- ✅ **50,000 monthly active users**

### When to Upgrade

- **Vercel Pro:** For more function executions and longer timeouts
- **Supabase Pro:** For larger database and more bandwidth

## 🎉 Success Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables configured
- [ ] Deployment successful
- [ ] API health check works (`/api/health`)
- [ ] Frontend loads correctly
- [ ] Database connection verified
- [ ] User registration works
- [ ] Super admin created

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Supabase Migration Guide](./SUPABASE_MIGRATION_GUIDE.md)

## 🆘 Need Help?

1. Check Vercel deployment logs
2. Check Supabase dashboard
3. Review environment variables
4. Test API endpoints individually
5. Check browser console for errors

---

**Your app is now live! 🎉** Visit `https://your-app.vercel.app` to see it in action.

