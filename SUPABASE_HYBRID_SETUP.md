# Supabase Hybrid Integration Setup

## Quick Start (15 minutes)

### 1. Create Supabase Project
- Go to https://supabase.com
- Create a new project: "future-kids-journey"
- Wait for project to be ready

### 2. Get Credentials
In Supabase Dashboard:
- Go to **Project Settings → API**
- Copy the following:
  - `Project URL` → `SUPABASE_URL`
  - `anon public` key → `SUPABASE_ANON_KEY`
  - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Configure Frontend (.env.local)
Create `c:\Users\geoff\future-kids-journey\.env.local`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Configure Backend (server/.env)
Create `c:\Users\geoff\future-kids-journey\server\.env`:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. Run Database Migration
In Supabase Dashboard:
- Go to **SQL Editor**
- Create new query
- Copy contents of `server/src/migrations/supabase_schema.sql`
- Paste and run

### 6. Install Dependencies
```bash
npm install
cd server && npm install
```

## What Changed

### Replaced
- ❌ MongoDB (mongoose)
- ❌ Custom connection management

### Added
- ✅ Supabase client: `server/src/lib/supabase.ts`
- ✅ Database schema: `server/src/migrations/supabase_schema.sql`
- ✅ Example route: `server/src/routes/enrollments.supabase.ts`

### Kept
- ✅ Express.js (no changes needed)
- ✅ JWT authentication (no changes needed)
- ✅ Middleware (no changes needed)
- ✅ Route structure (minimal changes)

## Update Existing Routes

Replace MongoDB queries with Supabase pattern:

### Before (MongoDB):
```typescript
import Enrollment from '../models/Enrollment.js';

const enrollments = await Enrollment.find().lean();
```

### After (Supabase):
```typescript
import { supabaseAdmin } from '../lib/supabase.js';

const { data: enrollments, error } = await supabaseAdmin
  .from('enrollments')
  .select('*');
  
if (error) throw error;
```

## Key Differences

| Operation | MongoDB | Supabase |
|-----------|---------|----------|
| Select | `Model.find()` | `.select()` |
| Insert | `Model.create()` | `.insert()` |
| Update | `Model.findByIdAndUpdate()` | `.update()` |
| Delete | `Model.findByIdAndDelete()` | `.delete()` |
| Filter | `.where()` | `.eq()`, `.neq()`, `.like()` |
| Join | `.populate()` | `.select('*, related_table(*)')` |

## Minimal Working Example

See `enrollments.supabase.ts` for a complete CRUD implementation that shows:
- ✅ Selecting with joins
- ✅ Filtering and ordering
- ✅ Inserting and updating
- ✅ Error handling
- ✅ Type-safe operations

## Next Steps

1. Copy pattern from `enrollments.supabase.ts` to other routes
2. Update `forms.ts` route similarly
3. Update `auth.ts` for admin user management
4. Test endpoints with Postman
5. Deploy to Render when ready

## Troubleshooting

### "Cannot find module '@supabase/supabase-js'"
- Run `npm install` in project root and `server/` folder

### "Missing Supabase environment variables"
- Check `.env` files are in correct locations
- Verify credentials are copied correctly from Supabase dashboard

### "RLS policy denies access"
- You're hitting RLS policies on tables
- Use `supabaseAdmin` (service role) for backend operations
- RLS will be needed later for frontend access control

## Support

- Supabase Docs: https://supabase.com/docs
- JS Client: https://supabase.com/docs/reference/javascript/introduction
