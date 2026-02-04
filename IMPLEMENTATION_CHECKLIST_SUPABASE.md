# Supabase Implementation Checklist

## Phase 1: Setup ✅ DONE
- [x] Created Supabase client (`server/src/lib/supabase.ts`)
- [x] Created database schema (`server/src/migrations/supabase_schema.sql`)
- [x] Updated package.json dependencies
- [x] Created Postman collection for testing

## Phase 2: Route Conversion ✅ DONE
- [x] Created `forms.supabase.ts` - Form submissions CRUD
- [x] Created `auth.supabase.ts` - Admin authentication
- [x] Created `enrollments.supabase.ts` - Enrollments CRUD

## Phase 3: Before Deployment
- [ ] **Create Supabase Project**
  - Go to https://supabase.com
  - Create new project "future-kids-journey"
  - Get API credentials from Project Settings

- [ ] **Configure Environment Variables**
  - Create `.env.local` (frontend) with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
  - Create `server/.env` with SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

- [ ] **Run Database Migration**
  - Copy contents of `server/src/migrations/supabase_schema.sql`
  - Paste into Supabase SQL Editor and run
  - Verify all tables created successfully

- [ ] **Install Dependencies**
  ```bash
  npm install
  cd server && npm install
  ```

- [ ] **Create Initial Super Admin**
  - Via Supabase Dashboard, insert initial admin user into `admins` table
  - Email: your-email@example.com
  - Password: hash with bcryptjs
  - Role: super_admin
  - is_active: true

## Phase 4: Testing
- [ ] **Test with Postman**
  - Import `postman_collection.json`
  - Set `base_url` to http://localhost:3000
  - Test Login endpoint first to get token
  - Copy token to Authorization header
  - Test each endpoint (forms, enrollments, auth)

- [ ] **Local Testing**
  - Run backend: `cd server && npm run dev`
  - Run frontend: `npm run dev`
  - Test form submission from UI
  - Test admin login from dashboard
  - Check data in Supabase Dashboard SQL Editor

## Phase 5: Integration with Existing Routes
These files should be replaced in server code:

| Old File | New File | Status |
|----------|----------|--------|
| `src/routes/forms.ts` | `src/routes/forms.supabase.ts` | Ready to replace |
| `src/routes/auth.ts` | `src/routes/auth.supabase.ts` | Ready to replace |
| `src/routes/enrollments.ts` | `src/routes/enrollments.supabase.ts` | Ready to replace |

**When ready:**
1. Backup old routes (rename to `.backup.ts`)
2. Rename `.supabase.ts` files to `.ts`
3. Update imports in `src/server.ts` if needed
4. Test all endpoints again

## Phase 6: Deployment to Render
- [ ] **Prepare for Deployment**
  - Ensure `.env` is in root of project (not in git)
  - Update `render.yaml` if needed for Supabase env vars
  - Set production environment variables in Render dashboard

- [ ] **Deploy Backend**
  - Push code to GitHub
  - Render automatically deploys on push
  - Verify backend is running: `https://your-render-app/api/auth/me` (should return 401 or error, not 404)

- [ ] **Deploy Frontend**
  - Frontend environment variables via Vercel dashboard
  - Verify API calls go to production backend URL
  - Test form submission and admin login

## Common Issues & Solutions

### "Cannot find module '@supabase/supabase-js'"
→ Run `npm install` in both root and server folders

### "Missing Supabase environment variables"
→ Verify .env files exist in correct locations with correct values

### 401 Unauthorized on protected routes
→ Make sure token is in Authorization header as "Bearer {token}"

### "relation \"form_submissions\" does not exist"
→ Run the SQL migration in Supabase SQL Editor

### Password validation fails on login
→ When creating super admin, use bcryptjs.hash() to hash password before inserting

## Quick Commands

```bash
# Development
cd server && npm run dev    # Backend on 3000
npm run dev                 # Frontend on 5173

# Build for production
npm run build               # Frontend
cd server && npm run build  # Backend

# Test specific endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/auth/me
```

## Files Reference

- **Supabase Client**: `server/src/lib/supabase.ts`
- **Database Schema**: `server/src/migrations/supabase_schema.sql`
- **Form Routes**: `server/src/routes/forms.supabase.ts`
- **Auth Routes**: `server/src/routes/auth.supabase.ts`
- **Enrollment Routes**: `server/src/routes/enrollments.supabase.ts`
- **Testing**: `postman_collection.json`
- **Setup Guide**: `SUPABASE_HYBRID_SETUP.md`

## Next After Deployment

1. **Add Real-time** (optional)
   - Frontend hooks for live updates
   - Supabase Realtime subscriptions

2. **Add Row-Level Security** (optional)
   - Enable RLS policies for frontend users
   - Current setup uses service role (full access)

3. **Monitor & Logs**
   - Set up Sentry for error tracking
   - Monitor Render logs for issues
   - Check Supabase analytics dashboard

---

**Status: Ready for Phase 3 (Setup)**

All code is written. Follow the checklist to get to production.
