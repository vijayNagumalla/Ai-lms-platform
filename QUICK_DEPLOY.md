# ⚡ Quick Deploy to Vercel

**5-minute deployment guide** - Get your AI LMS Platform live on Vercel with Supabase!

## 🎯 Prerequisites

✅ Supabase project created (see [SUPABASE_QUICK_START.md](./SUPABASE_QUICK_START.md))  
✅ GitHub repository with your code  
✅ Vercel account ([vercel.com](https://vercel.com))

## 🚀 Deploy in 3 Steps

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### Step 2: Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)** → "Add New Project"
2. **Import your GitHub repo**
3. **Configure:**
   - Framework: **Vite**
   - Build Command: `npm run vercel-build`
   - Output Directory: `dist`
4. **Add Environment Variables** (see below)
5. **Click "Deploy"**

### Step 3: Add Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-32-char-secret
CSRF_SECRET=your-csrf-secret
ENCRYPTION_KEY=your-32-char-encryption-key
FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=production
```

**After first deployment**, update `FRONTEND_URL` with your actual Vercel domain.

## ✅ Verify Deployment

1. **Health Check:** `https://your-app.vercel.app/api/health`
   - Should show: `{"status":"OK","database":"connected"}`

2. **Frontend:** `https://your-app.vercel.app`
   - Should show login page

3. **Create Super Admin:**
   - Register with your `SUPER_ADMIN_REGISTRATION_CODE`
   - Login and verify access

## 📚 Full Guides

- **Detailed Guide:** [VERCEL_SUPABASE_DEPLOYMENT.md](./VERCEL_SUPABASE_DEPLOYMENT.md)
- **Checklist:** [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- **Supabase Setup:** [SUPABASE_QUICK_START.md](./SUPABASE_QUICK_START.md)

## 🆘 Troubleshooting

**Build fails?** Check Vercel logs and verify Node.js 18+  
**API 404?** Verify `vercel.json` and `api/index.js` exist  
**Database error?** Check Supabase credentials  
**CORS error?** Update `FRONTEND_URL` environment variable

---

**That's it!** Your app is now live! 🎉

Visit: `https://your-app.vercel.app`

