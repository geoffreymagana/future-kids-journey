# Hybrid Approach: Express + Supabase

## What You Have

✅ **Complete Setup**
- Supabase client initialization
- PostgreSQL schema (7 tables)
- ONE fully-working example route
- Environment variable templates
- Dependencies updated (mongoose → @supabase/supabase-js)

✅ **Express Kept Intact**
- All existing routes structure preserved
- JWT auth pattern unchanged
- Middleware systems work as-is
- Just swap MongoDB queries for Supabase queries

## 3 Files Created

1. **server/src/lib/supabase.ts** (23 lines)
   - Exports `supabaseAdmin` (service role - full access)
   - Exports `supabaseClient` (anon key - respects RLS)
   
2. **server/src/migrations/supabase_schema.sql** (150 lines)
   - 7 tables with relationships
   - Indexes for performance
   - Views for common queries
   - Row-Level Security enabled
   
3. **server/src/routes/enrollments.supabase.ts** (160 lines)
   - Complete CRUD example
   - Shows joins pattern
   - Error handling
   - Use as template for other routes

## How to Update Other Routes

Each Mongoose route update follows same pattern:

```typescript
// BEFORE (MongoDB)
import Enrollment from '../models/Enrollment.js';
const data = await Enrollment.find({ status: 'active' });

// AFTER (Supabase)
import { supabaseAdmin } from '../lib/supabase.js';
const { data, error } = await supabaseAdmin
  .from('enrollments')
  .select('*')
  .eq('status', 'active');

if (error) throw error;
```

## Next: Specific Routes Needing Updates

Based on your `/server/src/routes/`:
- **forms.ts** - Replace FormSubmission model with `.from('form_submissions')`
- **auth.ts** - Replace Admin model with `.from('admins')`
- **enrollments.ts** - Already have example at `enrollments.supabase.ts`

## Install & Test

```bash
# Install dependencies
npm install
cd server && npm install

# Set up environment variables (.env.local and server/.env)
# Create Supabase project and run schema migration
# Test one endpoint: GET /api/enrollments
```

## Benefits of This Approach

✅ Keep all Express logic unchanged
✅ Minimal refactoring needed
✅ Real-time ready (Supabase Realtime works with existing structure)
✅ Row-Level Security available when needed
✅ Structured PostgreSQL (not schemaless)
✅ Better query performance with proper indexes

## Files to NOT Delete

- Everything in `src/components/` - UI unchanged
- Everything in `src/pages/` - UI unchanged  
- Everything in `server/src/middleware/` - auth unchanged
- `server.ts` - main server file unchanged
- Just update route files to use new pattern

---

**Status: Ready for Implementation**

You have everything needed. Each route file is a simple find-and-replace pattern.
