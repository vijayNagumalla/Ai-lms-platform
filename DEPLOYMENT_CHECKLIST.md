# ✅ Vercel + Supabase Deployment Checklist

Use this checklist to ensure a smooth deployment to Vercel with Supabase.

## 📋 Pre-Deployment Checklist

### 1. Supabase Setup
- [ ] Created Supabase project at [supabase.com](https://supabase.com)
- [ ] Copied Supabase credentials:
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Ran database schema in Supabase SQL Editor:
  - [ ] `backend/database/schema-supabase.sql`
  - [ ] `backend/database/schema-supabase-extended.sql`
- [ ] Verified tables are created in Supabase dashboard

### 2. Code Preparation
- [ ] All code committed to Git
- [ ] Code pushed to GitHub repository
- [ ] Verified these files exist:
  - [ ] `vercel.json`
  - [ ] `api/index.js`
  - [ ] `package.json` (with `vercel-build` script)
  - [ ] `backend/config/database.js` (using Supabase)

### 3. Environment Variables
Prepare these values for Vercel:

**Supabase:**
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

**JWT & Security:**
- [ ] `JWT_SECRET` (32+ characters)
- [ ] `JWT_EXPIRES_IN` (default: `7d`)
- [ ] `CSRF_SECRET` (32+ characters)
- [ ] `ENCRYPTION_KEY` (32+ characters)

**Server:**
- [ ] `NODE_ENV=production`
- [ ] `FRONTEND_URL` (will be your Vercel domain)

**Optional:**
- [ ] `SUPER_ADMIN_REGISTRATION_CODE`
- [ ] `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` (for emails)
- [ ] `JUDGE0_URL`, `JUDGE0_API_KEY` (for coding questions)

## 🚀 Deployment Steps

### Step 1: Create Vercel Project
- [ ] Go to [vercel.com](https://vercel.com) and sign in
- [ ] Click "Add New..." → "Project"
- [ ] Import your GitHub repository
- [ ] Configure project:
  - [ ] Framework: Vite
  - [ ] Root Directory: `./`
  - [ ] Build Command: `npm run vercel-build`
  - [ ] Output Directory: `dist`
  - [ ] Install Command: `npm install`

### Step 2: Add Environment Variables
- [ ] Go to "Environment Variables" in Vercel
- [ ] Add all required variables (see list above)
- [ ] Set environment to "Production" for all variables
- [ ] Verify all variables are added correctly

### Step 3: Deploy
- [ ] Click "Deploy"
- [ ] Wait for build to complete (2-5 minutes)
- [ ] Note your deployment URL: `https://your-app.vercel.app`

### Step 4: Update Frontend URL
- [ ] Go to Vercel → Settings → Environment Variables
- [ ] Update `FRONTEND_URL` to your actual Vercel domain
- [ ] Redeploy (or wait for auto-redeploy)

## ✅ Post-Deployment Verification

### 1. Health Checks
- [ ] Visit `https://your-app.vercel.app/api/health`
- [ ] Should return: `{"status":"OK","database":"connected"}`
- [ ] If database shows "disconnected", check Supabase credentials

### 2. Frontend
- [ ] Visit `https://your-app.vercel.app`
- [ ] Frontend loads without errors
- [ ] No console errors in browser DevTools
- [ ] Login page displays correctly

### 3. API Endpoints
- [ ] Test registration: `POST /api/auth/register`
- [ ] Test login: `POST /api/auth/login`
- [ ] Test profile: `GET /api/auth/profile` (with token)

### 4. Database
- [ ] Check Supabase dashboard
- [ ] Verify data is being created
- [ ] Test creating a user account
- [ ] Verify user appears in Supabase `users` table

### 5. Create Super Admin
- [ ] Register with `SUPER_ADMIN_REGISTRATION_CODE`
- [ ] Verify super admin account is created
- [ ] Login as super admin
- [ ] Access super admin dashboard

## 🔧 Troubleshooting

### Build Fails
- [ ] Check Vercel build logs
- [ ] Verify Node.js version (18+)
- [ ] Check for missing dependencies
- [ ] Verify `package.json` scripts

### API Returns 404
- [ ] Verify `vercel.json` configuration
- [ ] Check `api/index.js` exists
- [ ] Review Vercel function logs
- [ ] Test `/api/health` endpoint

### Database Connection Error
- [ ] Verify Supabase credentials
- [ ] Check Supabase project is active
- [ ] Verify schema is created
- [ ] Check Supabase logs

### CORS Errors
- [ ] Update `FRONTEND_URL` environment variable
- [ ] Verify CORS in `api/index.js`
- [ ] Check browser console for errors

## 📊 Monitoring Setup

### Vercel
- [ ] Enable Vercel Analytics (optional)
- [ ] Set up deployment notifications
- [ ] Monitor function logs

### Supabase
- [ ] Check database usage
- [ ] Monitor API requests
- [ ] Set up database backups (optional)

## 🎯 Final Checklist

- [ ] Application is live and accessible
- [ ] All API endpoints working
- [ ] Database connection verified
- [ ] User registration works
- [ ] User login works
- [ ] Super admin created
- [ ] No console errors
- [ ] Environment variables secure
- [ ] Documentation updated

## 📝 Notes

- **First Deployment:** Takes 2-5 minutes
- **Subsequent Deployments:** Automatic on Git push
- **Environment Variables:** Must be set before deployment
- **Database:** Must be set up in Supabase first

## 🆘 Need Help?

1. Check [VERCEL_SUPABASE_DEPLOYMENT.md](./VERCEL_SUPABASE_DEPLOYMENT.md)
2. Review Vercel deployment logs
3. Check Supabase dashboard
4. Test API endpoints individually

---

**Ready to deploy?** Follow the steps above and check off each item as you complete it! ✅
