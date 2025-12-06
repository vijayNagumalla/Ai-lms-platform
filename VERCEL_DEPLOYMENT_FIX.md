# Vercel Deployment CORS Fix Guide

## Problem Summary

When deploying to Vercel, the frontend was trying to make API calls to `http://localhost:5000`, which doesn't work in production. This caused CORS errors because:
1. The frontend couldn't reach localhost from the deployed site
2. The backend CORS wasn't configured to allow the Vercel domain

## Fixes Applied

### 1. Frontend API Configuration (`src/utils/apiConfig.js`)
- ✅ Enhanced production detection to check if hostname is not localhost
- ✅ Uses relative path `/api` in production (same-origin requests)
- ✅ Falls back to `localhost:5000` only in development

### 2. Backend CORS Configuration (`api/index.js`)
- ✅ Updated CORS to allow Vercel domains (`*.vercel.app`)
- ✅ Allows same-origin requests for Vercel deployments
- ✅ Properly handles credentials and required headers

### 3. Content Security Policy (`index.html`)
- ✅ Updated CSP to allow localhost connections in development
- ✅ Production builds will use same-origin (no CSP restrictions needed)

## Required Environment Variables on Vercel

### Frontend Environment Variables

In your Vercel project settings, go to **Settings → Environment Variables** and add:

#### Option 1: Use Same-Origin (Recommended for Vercel)
```
VITE_API_URL=/api
```
This tells the frontend to use relative paths, which will automatically use the same domain as your Vercel deployment.

#### Option 2: Use Full Backend URL (If backend is on separate domain)
```
VITE_API_URL=https://your-backend-domain.com/api
```

### Backend Environment Variables

If your backend is deployed separately (not as Vercel serverless functions), add:

```
FRONTEND_URL=https://ai-lms-platform-ten.vercel.app
```

If you have multiple frontend URLs (e.g., preview deployments), separate them with commas:
```
FRONTEND_URL=https://ai-lms-platform-ten.vercel.app,https://your-preview-url.vercel.app
```

## How to Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Click on **Settings** → **Environment Variables**
3. Add each variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `/api` (or your backend URL)
   - **Environment**: Select `Production`, `Preview`, and `Development` as needed
4. Click **Save**
5. **Redeploy** your application for changes to take effect

## Verification Steps

After deploying with the fixes:

1. **Check Browser Console**: 
   - Open your deployed site
   - Open browser DevTools (F12)
   - Check the Network tab
   - API requests should go to `/api/*` (relative) or your configured backend URL
   - No more `localhost:5000` errors

2. **Test API Calls**:
   - Try logging in
   - Check if analytics/public-stats loads
   - Verify no CORS errors in console

3. **Check CORS Headers**:
   - In Network tab, click on any API request
   - Check Response Headers
   - Should see `Access-Control-Allow-Origin` with your Vercel domain

## Troubleshooting

### Still seeing localhost:5000 errors?

1. **Clear browser cache** and hard refresh (Ctrl+Shift+R)
2. **Check environment variables** are set correctly in Vercel
3. **Redeploy** the application after setting environment variables
4. **Check build logs** to ensure `VITE_API_URL` is being read

### CORS errors persist?

1. **Verify backend CORS** allows your Vercel domain:
   - Check `api/index.js` CORS configuration
   - Ensure `FRONTEND_URL` includes your Vercel domain
   
2. **Check preflight requests**:
   - OPTIONS requests should return 200 status
   - Should include proper CORS headers

### API calls return 404?

1. **Verify Vercel rewrites** in `vercel.json`:
   ```json
   {
     "rewrites": [
       {
         "source": "/api/(.*)",
         "destination": "/api/index.js"
       }
     ]
   }
   ```

2. **Check serverless function** is deployed:
   - Verify `api/index.js` exists
   - Check function logs in Vercel dashboard

## Architecture Notes

### Current Setup
- **Frontend**: Deployed as static site on Vercel
- **Backend**: Deployed as Vercel serverless functions at `/api/*`
- **Same Domain**: Both frontend and API are on the same Vercel domain

### Why Relative Paths Work
When using `/api` (relative path):
- Browser automatically uses the same origin (protocol + domain + port)
- No CORS issues since it's same-origin
- Works automatically with Vercel's routing

### Alternative: Separate Backend
If your backend is on a different domain:
1. Set `VITE_API_URL` to full backend URL
2. Set `FRONTEND_URL` in backend to your Vercel frontend URL
3. Ensure backend CORS allows your frontend domain

## Next Steps

1. ✅ Set `VITE_API_URL=/api` in Vercel environment variables
2. ✅ Redeploy your application
3. ✅ Test the deployed site
4. ✅ Verify no CORS errors in console
5. ✅ Test login and other API-dependent features

## Additional Resources

- [Vercel Environment Variables Docs](https://vercel.com/docs/concepts/projects/environment-variables)
- [CORS Explained](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

