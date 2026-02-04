# Render + Vercel Deployment Guide

## Pre-Deployment Checklist

### Backend (Render)
- [ ] Create Supabase project and get credentials
- [ ] Run database migration in Supabase
- [ ] Create `.env.local` with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- [ ] Create `server/.env` with SUPABASE_* environment variables
- [ ] Test locally: `cd server && npm run dev`
- [ ] Push code to GitHub
- [ ] Update `render.yaml` with Supabase env vars (see below)

### Frontend (Vercel)
- [ ] Update `vite.config.ts` if needed for API URL
- [ ] Create `.env.local` with Supabase credentials
- [ ] Test locally: `npm run dev`
- [ ] Push code to GitHub
- [ ] Configure Vercel environment variables

## Render Configuration

### Update render.yaml

```yaml
services:
  - type: web
    name: future-kids-journey-api
    env: node
    plan: free
    buildCommand: cd server && npm install && npm run build
    startCommand: cd server && npm run start
    envVars:
      - key: NODE_ENV
        value: production
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_ANON_KEY
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
```

### Set Environment Variables on Render

1. Go to Render Dashboard
2. Select your service
3. Go to **Settings → Environment**
4. Add these variables:
   ```
   SUPABASE_URL=https://[project].supabase.co
   SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   ```

## Vercel Configuration

### Environment Variables

1. Go to Vercel Dashboard
2. Select your project
3. **Settings → Environment Variables**
4. Add:
   ```
   VITE_SUPABASE_URL=https://[project].supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...
   ```

### Handle SPA Routing (already in vercel.json)

The project already has `vercel.json` configured for client-side routing:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

This ensures all routes fall back to index.html for React Router.

## API URL Configuration

### Local Development (localhost)
Frontend calls: `http://localhost:3000/api/...`

Configure in `vite.config.ts`:
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    }
  }
}
```

### Production
Frontend calls: `https://[render-app-url]/api/...`

Or use environment variable:
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'https://api.example.com';
```

Set `VITE_API_URL` in Vercel environment variables.

## Deployment Steps

### 1. Deploy Backend to Render

```bash
# Ensure render.yaml exists in root
# Push to GitHub
git add .
git commit -m "Add Supabase integration"
git push origin main

# Render auto-detects render.yaml and deploys
```

**Verify deployment:**
```bash
curl https://your-render-app.onrender.com/api/auth/me
# Should return 401 (unauthorized) - not 404
```

### 2. Deploy Frontend to Vercel

```bash
# Push to GitHub (same commit as backend)
git push origin main

# Vercel auto-detects and deploys
# (or manually import repo at vercel.com)
```

**Verify deployment:**
- Visit https://your-vercel-app.vercel.app
- Open DevTools → Network
- Check that /api calls go to correct backend URL

## Testing Production Deployment

### 1. Test Backend Directly
```bash
# Login (should return token)
curl -X POST https://your-render-app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'

# Get current admin (should return admin info)
curl -H "Authorization: Bearer TOKEN" \
  https://your-render-app/api/auth/me

# Get forms (should return empty array)
curl -H "Authorization: Bearer TOKEN" \
  https://your-render-app/api/forms/submissions
```

### 2. Test From Frontend
1. Visit production frontend
2. Test form submission (should create in Supabase)
3. Login with admin credentials
4. Check that data appears in dashboard
5. Verify in Supabase SQL Editor: `SELECT * FROM form_submissions;`

### 3. Check Logs
**Render logs:**
- Dashboard → Service → Logs
- Watch for errors during deployment

**Vercel logs:**
- Dashboard → Project → Deployments → Logs
- Check for build errors or 404s

## Common Deployment Issues

### Issue: Backend returns 404 on /api routes
**Cause:** Routes not properly registered in server.ts

**Fix:** Check server/src/server.ts imports the routes:
```typescript
import formRoutes from './routes/forms.supabase.js';
import authRoutes from './routes/auth.supabase.js';
import enrollmentRoutes from './routes/enrollments.supabase.js';

app.use('/api/forms', formRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/enrollments', enrollmentRoutes);
```

### Issue: 401 Unauthorized on all endpoints
**Cause:** Authentication middleware failing

**Fix:** Verify JWT secret is set consistently

### Issue: Frontend can't reach backend
**Cause:** CORS not configured or wrong API URL

**Fix:** In server.ts:
```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

Or check API URL in frontend environment variables

### Issue: Database migration didn't run
**Cause:** Never executed SQL in Supabase

**Fix:** 
1. Go to Supabase → SQL Editor
2. Copy server/src/migrations/supabase_schema.sql
3. Paste and click "Run"
4. Verify tables created: SELECT * FROM information_schema.tables;

### Issue: Password hash validation fails
**Cause:** Password not properly hashed before insertion

**Fix:** When creating super admin:
```bash
# Use Node.js to hash password
node -e "require('bcryptjs').hash('password123', 10).then(h => console.log(h))"
```

Then insert into database with hashed password.

## Rollback Plan

If deployment breaks production:

1. **Revert code:** `git revert` or `git push` previous commit
2. **Clear cache:** Vercel cache clears automatically on new deploy
3. **Check database:** Ensure Supabase schema didn't get corrupted
4. **Check logs:** Review Render and Vercel logs for errors

## Monitoring Production

### Set Up Error Tracking
```bash
npm install sentry
```

Configure in server.ts:
```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});
```

### Monitor Database
- Supabase Dashboard → Usage
- Check query performance
- Monitor storage usage

### Monitor API Performance
- Render Dashboard → Metrics
- Check CPU, memory, requests
- Monitor error rates

### Set Up Alerts
- Render: Dashboard → Alerts
- Vercel: Project → Settings → Analytics
- Sentry: Configure email notifications

## Post-Deployment

1. **Test all critical paths:**
   - Form submission
   - Admin login
   - Enrollment creation
   - Data visible in dashboard

2. **Monitor for 24 hours:**
   - Check logs for errors
   - Monitor error tracking (Sentry)
   - Verify data integrity

3. **Keep backups:**
   - Supabase auto-backups daily (free tier)
   - Export data regularly

## Reverting to MongoDB (If Needed)

If you need to go back to MongoDB temporarily:

```bash
# Restore old route files
mv server/src/routes/forms.ts.backup server/src/routes/forms.ts
mv server/src/routes/auth.ts.backup server/src/routes/auth.ts
mv server/src/routes/enrollments.ts.backup server/src/routes/enrollments.ts

# Reinstall mongoose
npm install mongoose

# Deploy
git push origin main
```

But we recommend staying with Supabase - it's better!

---

**Status: Ready for Deployment**

Follow these steps to deploy to Render + Vercel production.
