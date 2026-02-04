# Quick Reference: Supabase Patterns

## CRUD Operations Comparison

### CREATE (Insert)
```typescript
// MongoDB
const doc = new Model({ field: value });
await doc.save();

// Supabase
const { data, error } = await supabaseAdmin
  .from('table_name')
  .insert({ field: value })
  .select()
  .single();
if (error) throw error;
```

### READ (Select)
```typescript
// MongoDB
const doc = await Model.findById(id);
const all = await Model.find();

// Supabase
const { data: doc } = await supabaseAdmin
  .from('table_name')
  .select('*')
  .eq('id', id)
  .single();
const { data: all } = await supabaseAdmin
  .from('table_name')
  .select('*');
```

### UPDATE
```typescript
// MongoDB
await Model.findByIdAndUpdate(id, { field: newValue });

// Supabase
const { data, error } = await supabaseAdmin
  .from('table_name')
  .update({ field: newValue })
  .eq('id', id)
  .select()
  .single();
if (error) throw error;
```

### DELETE
```typescript
// MongoDB
await Model.findByIdAndDelete(id);

// Supabase
const { error } = await supabaseAdmin
  .from('table_name')
  .delete()
  .eq('id', id);
if (error) throw error;
```

## Filtering Patterns

```typescript
// Single filter
.eq('status', 'active')           // equals
.neq('status', 'deleted')         // not equals
.gt('amount', 100)                // greater than
.lt('amount', 100)                // less than
.like('name', '%john%')           // pattern match
.in('status', ['active', 'pending']) // in array

// Multiple filters
.eq('status', 'active')
.eq('user_id', userId)

// Ordering
.order('created_at', { ascending: false })

// Pagination
.range(0, 49)  // items 0-49 (limit 50)
```

## Joining Tables

```typescript
// Select with related table
const { data } = await supabaseAdmin
  .from('enrollments')
  .select(`
    id,
    enrollment_amount,
    form_submissions (
      parent_name,
      whatsapp_number
    )
  `)
  .single();

// Result structure:
{
  id: 'uuid',
  enrollment_amount: 5000,
  form_submissions: {
    parent_name: 'John',
    whatsapp_number: '1234567890'
  }
}
```

## Common Patterns in Code

### Error Handling
```typescript
try {
  const { data, error } = await supabaseAdmin
    .from('table')
    .select('*');
  
  if (error) throw error;
  
  return res.json({ success: true, data });
} catch (error: unknown) {
  console.error('Error:', error);
  return res.status(500).json({ 
    success: false, 
    error: error instanceof Error ? error.message : 'Unknown error'
  });
}
```

### Pagination
```typescript
const page = Number(req.query.page || 1);
const limit = Number(req.query.limit || 50);
const skip = (page - 1) * limit;

const { data, error, count } = await supabaseAdmin
  .from('table')
  .select('*', { count: 'exact' })
  .range(skip, skip + limit - 1);

res.json({
  data,
  pagination: {
    total: count,
    pages: Math.ceil((count || 0) / limit),
    current: page,
    limit
  }
});
```

### Building Dynamic Filters
```typescript
let query = supabaseAdmin.from('table').select('*');

if (status) query = query.eq('status', status);
if (userId) query = query.eq('user_id', userId);
if (search) query = query.like('name', `%${search}%`);

const { data, error } = await query;
```

## Database Schema Reference

### Tables
- `admins` - Admin users (id, email, password_hash, role, is_active, created_at)
- `form_submissions` - Form entries (id, parent_name, whatsapp_number, status, referral_source, created_at)
- `enrollments` - Enrollments (id, submission_id, enrollment_amount, status, created_at)
- `attendance` - QR check-ins (id, enrollment_id, qr_code, status, created_at)
- `payment_terms` - Config (signup_commission_rate, attendance_commission_rate)
- `activity_logs` - Audit trail (id, admin_id, action, resource_type, changes)
- `share_metrics` - Share tracking (id, submission_id, click_platform, etc)

### Views
- `admin_dashboard_stats` - Stats for dashboard
- `revenue_metrics` - Commission breakdown

## Environment Variables

```bash
# Frontend (.env.local)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Backend (server/.env)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Key Files

| File | Purpose |
|------|---------|
| `server/src/lib/supabase.ts` | Client initialization |
| `server/src/migrations/supabase_schema.sql` | Database schema |
| `server/src/routes/forms.supabase.ts` | Form routes |
| `server/src/routes/auth.supabase.ts` | Auth routes |
| `server/src/routes/enrollments.supabase.ts` | Enrollment routes |
| `postman_collection.json` | API testing |

## Testing URLs

```bash
# Local development
http://localhost:3000/api/forms/submit
http://localhost:3000/api/auth/login
http://localhost:3000/api/enrollments

# Production (after deploy)
https://api.example.com/api/forms/submit
https://api.example.com/api/auth/login
https://api.example.com/api/enrollments
```

## Quick Commands

```bash
# Development
npm run dev              # Frontend (5173)
cd server && npm run dev # Backend (3000)

# Build
npm run build            # Frontend
cd server && npm run build # Backend

# Testing
npm run test             # Frontend tests
cd server && npm run test # Backend tests (if configured)

# Deployment
git push origin main     # Auto-deploys to Render + Vercel
```

---

Keep this for quick reference while developing!
