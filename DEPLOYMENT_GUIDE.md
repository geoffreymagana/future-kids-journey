# Future Kids Journey - Deployment Guide

Complete guide for deploying the Future Kids Journey application to **Render** (backend) and **Vercel** (frontend).

**Table of Contents:**
1. [Prerequisites](#prerequisites)
2. [Backend Deployment to Render](#backend-deployment-to-render)
3. [Frontend Deployment to Vercel](#frontend-deployment-to-vercel)
4. [Database Setup (MongoDB)](#database-setup-mongodb)
5. [Environment Variables](#environment-variables)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Troubleshooting](#troubleshooting)
8. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

### Required Accounts
- **GitHub** account (code repository)
- **Render** account (backend hosting)
- **Vercel** account (frontend hosting)
- **MongoDB Atlas** account (database)

### Local Requirements
- Node.js 18+ and npm/bun
- Git installed
- Code pushed to GitHub repository

### Project Structure
```
future-kids-journey/
├── server/                 # Backend (Node.js + Express)
│   ├── src/
│   │   ├── server.ts      # Main server entry point
│   │   ├── routes/        # API routes
│   │   ├── models/        # MongoDB models
│   │   ├── middleware/    # Authentication, etc.
│   │   └── utils/         # Helper functions
│   └── package.json
├── src/                    # Frontend (React)
│   ├── App.tsx
│   ├── components/
│   ├── pages/
│   └── main.tsx
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## Backend Deployment to Render

### Step 1: Prepare Repository

Ensure your GitHub repository contains:
- `server/package.json`
- `server/src/server.ts`
- `tsconfig.json` in server directory
- `.gitignore` (excludes `node_modules`, `.env`)

### Step 2: Create MongoDB Database

**See [Database Setup](#database-setup-mongodb) section below**

After creating MongoDB, save your connection string:
```
mongodb+srv://username:password@cluster-name.mongodb.net/dbname?retryWrites=true&w=majority
```

### Step 3: Create Render Web Service

1. **Log in to [Render.com](https://render.com)**
2. **Click "New+" → "Web Service"**
3. **Connect your GitHub repository**
   - Select your repo
   - Grant Render permission to access GitHub

4. **Configure the service:**
   - **Name:** `future-kids-journey-api`
   - **Environment:** `Node`
   - **Build Command:** 
     ```bash
     cd server && npm install && npm run build
     ```
   - **Start Command:**
     ```bash
     npm run start
     ```
   - **Region:** Choose closest to your users (e.g., Singapore, India)
   - **Plan:** Start with "Free" tier for testing

### Step 4: Set Environment Variables

1. In Render dashboard for your service, go to **Environment**
2. Add the following variables:

```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster-name.mongodb.net/future-kids-journey?retryWrites=true&w=majority
JWT_SECRET=your-very-secure-random-secret-key-at-least-32-chars
FRONTEND_URL=https://your-vercel-domain.vercel.app
```

**Important:** Generate a secure JWT_SECRET
```bash
# In terminal, run:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 5: Deploy

1. In Render, click **"Deploy"**
2. Wait for build to complete (2-5 minutes)
3. Check logs for errors:
   - Click on your service
   - Go to **Logs** tab
   - Look for "Server running on" message

4. Your API is live at:
   ```
   https://future-kids-journey-api.onrender.com
   ```

### Step 6: Verify Backend

Test the API:
```bash
# Should return welcome message
curl https://future-kids-journey-api.onrender.com/

# Should return health status
curl https://future-kids-journey-api.onrender.com/health
```

---

## Frontend Deployment to Vercel

### Step 1: Prepare for Deployment

Ensure `.vercelignore` file exists (if needed):
```
server/
.git
node_modules
```

Update `vite.config.ts` to ensure it's configured for production:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser'
  }
})
```

### Step 2: Update API Configuration

Update your API base URL for production. Create/update `src/config.ts`:

```typescript
export const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? 'http://localhost:5000'
    : 'https://future-kids-journey-api.onrender.com');
```

Update API calls in your service files to use this config.

### Step 3: Create Vercel Deployment

1. **Log in to [Vercel.com](https://vercel.com)**
2. **Click "Add New..." → "Project"**
3. **Import GitHub Repository**
   - Select your `future-kids-journey` repo
   - Click "Import"

4. **Configure Project Settings:**
   - **Project Name:** `future-kids-journey`
   - **Framework Preset:** `Vite`
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

5. **Environment Variables:**
   Click "Environment Variables" and add:
   ```
   VITE_API_URL=https://future-kids-journey-api.onrender.com
   REACT_APP_API_URL=https://future-kids-journey-api.onrender.com
   ```

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for build and deployment (2-5 minutes)
3. Your site is live at:
   ```
   https://future-kids-journey.vercel.app
   ```

### Step 5: Update CORS Settings

**Update Backend CORS Configuration:**

1. Go back to Render dashboard
2. Update environment variable:
   ```
   FRONTEND_URL=https://future-kids-journey.vercel.app
   ```
3. Click "Deploy" to redeploy backend

---

## Database Setup (MongoDB)

### Step 1: Create MongoDB Atlas Account

1. **Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)**
2. **Sign up with email or Google account**
3. **Create Free Organization**

### Step 2: Create Database Cluster

1. **Click "Create a Deployment"**
2. **Select "Free" tier (M0)**
3. **Choose region closest to you**
4. **Create cluster** (wait 5-10 minutes for provisioning)

### Step 3: Setup Database Access

1. **In left sidebar:** Click "Database Access"
2. **Click "Add New Database User"**
   - Username: `future_kids_admin`
   - Password: Generate strong password (save it!)
   - Built-in Role: `Atlas Admin`
   - Click "Add User"

### Step 4: Setup Network Access

1. **Click "Network Access" in sidebar**
2. **Click "Add IP Address"**
3. **For development:** Click "Allow Access from Anywhere" (0.0.0.0/0)
4. For production, add specific IP addresses of your Render server

### Step 5: Get Connection String

1. **Click "Databases" in sidebar**
2. **Click "Connect" on your cluster**
3. **Choose "Drivers" → "Node.js"**
4. **Copy connection string:**
   ```
   mongodb+srv://future_kids_admin:<password>@cluster0.xxxxx.mongodb.net/future-kids-journey?retryWrites=true&w=majority
   ```

5. **Replace `<password>` with the password you created in Step 3**

### Step 6: Initialize Database

After backend deployment, initialize the database with default data:

```bash
# From your local terminal
curl -X POST https://future-kids-journey-api.onrender.com/api/admin/init \
  -H "Content-Type: application/json" \
  -d '{"adminEmail": "admin@example.com", "adminPassword": "SecurePassword123!"}'
```

Or manually create an admin account through MongoDB Atlas.

---

## Environment Variables

### Backend (.env in server/ directory)

Create `server/.env`:
```env
# Server Configuration
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://future_kids_admin:password@cluster0.xxxxx.mongodb.net/future-kids-journey?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your-secure-32-character-random-string-here

# CORS
FRONTEND_URL=https://your-vercel-domain.vercel.app

# Email (if implementing email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Frontend (.env in root directory)

Create `.env`:
```env
VITE_API_URL=https://future-kids-journey-api.onrender.com
REACT_APP_API_URL=https://future-kids-journey-api.onrender.com
```

**Important:** Never commit `.env` files. Keep them in `.gitignore`.

---

## Post-Deployment Verification

### 1. Test Backend API

```bash
# Test root endpoint
curl https://future-kids-journey-api.onrender.com/

# Expected response:
# {
#   "success": true,
#   "message": "Future Kids Journey API",
#   "version": "1.0.0",
#   "endpoints": { ... }
# }

# Test health check
curl https://future-kids-journey-api.onrender.com/health

# Expected response:
# {
#   "status": "OK",
#   "timestamp": "2024-01-01T10:00:00.000Z"
# }
```

### 2. Test Frontend

1. Visit your Vercel domain: `https://future-kids-journey.vercel.app`
2. Check browser console for errors (F12 → Console tab)
3. Test form submission
4. Verify API calls work (Network tab in DevTools)

### 3. Test Database Connection

From Render logs, you should see:
```
✅ Connected to MongoDB
✅ Server running on http://localhost:5000
```

### 4. Create Test Admin Account

1. Use MongoDB Atlas GUI to manually create admin
2. Or via API endpoint (if implemented)

---

## Troubleshooting

### Backend Issues

#### Issue: "Cannot find module" or "ENOENT" errors

**Solution:**
1. Check Render logs for actual error
2. Ensure all imports use correct paths
3. Rebuild command might need to compile TypeScript:
   ```bash
   cd server && npm install && npm run build
   ```
4. Check `tsconfig.json` has correct outDir

#### Issue: "MONGODB_URI not set" error

**Solution:**
1. Verify environment variable is set in Render dashboard
2. Restart service: Render → Your Service → Manual Deploy
3. Check connection string format (should have `?retryWrites=true`)

#### Issue: CORS errors on frontend

**Solution:**
1. Check `FRONTEND_URL` env var matches your Vercel domain exactly
2. Redeploy backend after updating:
   - Go to Render
   - Find your service
   - Click "Manual Deploy"
3. Add trailing slash if needed: `https://domain.vercel.app/`

#### Issue: Build fails with "out of memory"

**Solution:**
- Free tier has limited memory
- Upgrade to paid tier: Render → Your Service → Settings → Plan
- Or split backend into multiple services

### Frontend Issues

#### Issue: Blank page or 404 error

**Solution:**
1. Check Vercel logs: Deployments tab
2. Verify build command output
3. Check `dist/` folder exists with `index.html`
4. Clear browser cache (Ctrl+Shift+Delete)

#### Issue: API calls return 404 or CORS errors

**Solution:**
1. Verify `VITE_API_URL` env var is set in Vercel
2. Check API URL in network requests (DevTools → Network tab)
3. Ensure backend is running (check Render health)
4. Test API directly with curl from terminal

#### Issue: Production build works locally but fails on Vercel

**Solution:**
1. Check Vercel build logs for warnings/errors
2. Ensure all imports are correct (case-sensitive on Linux)
3. Remove any absolute paths: use relative imports
4. Rebuild locally: `npm run build` then `npm run preview`

### Database Issues

#### Issue: Connection timeout

**Solution:**
1. Check MongoDB Atlas Network Access settings
2. Verify IP is whitelisted (add `0.0.0.0/0` for development)
3. Check connection string password is correct
4. Verify database name is correct in connection string

#### Issue: Authentication failed error

**Solution:**
1. Verify username and password in connection string
2. Check if database user is active in MongoDB Atlas
3. Reset password in MongoDB Atlas if needed
4. Ensure `@` symbols in password are URL-encoded

---

## Monitoring & Maintenance

### Monitor Backend Performance

**Render Dashboard:**
1. Go to your service page
2. Check **Metrics** tab:
   - CPU usage
   - Memory usage
   - Request count
3. Check **Logs** for errors

**Best Practices:**
- Monitor 404 errors (bad routes)
- Check error logs for uncaught exceptions
- Watch CPU/memory trending upward (scaling needed)

### Monitor Frontend

**Vercel Dashboard:**
1. Go to project
2. **Analytics** tab shows:
   - Page views
   - Response times
   - Error rates

**Browser Monitoring:**
- Check Console for JavaScript errors
- Use Network tab to identify slow API calls

### Monitor Database

**MongoDB Atlas:**
1. Go to "Metrics" in Atlas dashboard
2. Watch for:
   - Query execution time
   - Number of connections
   - Storage usage
3. Set up alerts for thresholds

### Regular Maintenance Tasks

**Weekly:**
- Check error logs
- Verify backups completed
- Monitor disk usage

**Monthly:**
- Review API performance metrics
- Check for security updates
- Update dependencies: `npm audit fix`

**Quarterly:**
- Full backup test
- Load testing
- Update Node.js version if needed

### Database Backups

**MongoDB Atlas Automatic Backups:**
1. Already enabled on free tier
2. Manual backup: Collections → Backup
3. Restore if needed: Backup tab → Restore

**Recommendation:** Export data monthly for safety.

---

## Scaling (When Traffic Grows)

### Render Backend Scaling

**When to scale:**
- Frequent "out of memory" errors
- Response times exceed 2 seconds
- CPU usage consistently > 80%

**Options:**
1. **Upgrade plan** (Pro tier: $12/month)
   - More CPU/Memory
   - Auto-scaling
   - Higher uptime SLA

2. **Horizontal scaling** (multiple instances)
   - Requires load balancer
   - More complex setup

### Vercel Frontend Scaling

**Rarely needed** - Vercel handles most traffic automatically.

**Only if:** Extremely high traffic (1M+ monthly visits)

### Database Scaling

**Upgrade MongoDB:** Atlas → Settings → Tier
- Move from M0 (free) to M2 or higher
- Dedicated infrastructure vs shared
- Consider read replicas for high traffic

---

## Final Checklist

Before considering deployment complete:

- [ ] Backend API responds to health check
- [ ] Frontend loads without errors
- [ ] Form submission works end-to-end
- [ ] Admin login works
- [ ] Environment variables are set
- [ ] CORS is configured correctly
- [ ] Database is connected and accessible
- [ ] Logs show no error messages
- [ ] HTTPS is enabled (automatic on Render/Vercel)
- [ ] Custom domain is configured (if using one)
- [ ] SSL certificate is valid
- [ ] Backup strategy is in place

---

## Support & Resources

**Documentation:**
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)

**Community:**
- Stack Overflow (tag with framework name)
- GitHub Issues in your repo
- Render Support (email/chat)
- Vercel Support (email/chat)

---

## Deployment Workflow Summary

### For Future Updates

When you make code changes:

1. **Test locally:**
   ```bash
   npm run dev          # Frontend
   cd server && npm run dev  # Backend
   ```

2. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Feature: description"
   git push origin main
   ```

3. **Render auto-deploys** (if enabled)
   - Check Render Deployments tab
   - Verify logs

4. **Vercel auto-deploys** (if enabled)
   - Check Vercel Deployments tab
   - Monitor metrics

5. **Test on live:**
   - Visit frontend URL
   - Test API calls
   - Monitor error logs

---

**Last Updated:** February 4, 2026
**Version:** 1.0
**Maintained by:** Development Team
