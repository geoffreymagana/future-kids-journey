# API Response Format Fixes

## Problem
Frontend components were receiving API responses in the wrong format, causing "Cannot read properties of undefined" errors when trying to access expected properties.

## Root Causes
1. **Attendance endpoint** returned `data.data` instead of `data.attendances`
2. **Admin logs endpoint** returned `data.data` instead of `data.logs`
3. **Admin error-logs endpoint** returned `data.errorLogs` instead of `data.logs`
4. **Enrollments endpoint** returned `data` as raw array instead of `{enrollments, pagination}`
5. **Missing error handling** - endpoints threw 500 errors when tables didn't exist (before migration)

## Files Fixed

### 1. server/src/routes/attendance.supabase.ts
**Changes:**
- Added pagination support with `page` and `limit` query parameters
- Changed response structure from `{data: attendances, pagination}` to `{attendances, pagination}`
- Added graceful error handling - returns empty array instead of 500 error when table doesn't exist
- Counts handled safely with null checks

**Before:**
```javascript
return res.json(
  formatResponse(
    {
      data: attendances || [],
      pagination: { ... }
    }
  )
);
```

**After:**
```javascript
return res.json(
  formatResponse(
    {
      attendances: safeAttendances,
      pagination: { ... }
    }
  )
);
```

**Frontend Expects:** `response.data.attendances`

### 2. server/src/routes/admin.supabase.ts
**Changes:**
- **GET /admin/logs**: Changed `data` to `logs` in response
- **GET /admin/error-logs**: Changed `errorLogs` to `logs` in response
- Both endpoints now handle missing tables gracefully
- Added pagination support with page/limit query parameters
- Returns empty data instead of 500 errors

**Before:**
```javascript
// logs endpoint
{
  data: logs || [],
  pagination: { ... }
}

// error-logs endpoint
{
  data: logs || [],
  pagination: { ... }
}
```

**After:**
```javascript
// logs endpoint
{
  logs: safeLogs,
  pagination: { ... }
}

// error-logs endpoint
{
  logs: safeLogs,
  pagination: { ... }
}
```

**Frontend Expects:** 
- `response.data.logs` for both endpoints
- `response.data.pagination` with `{page, limit, total, pages}`

### 3. server/src/routes/enrollments.supabase.ts
**Changes:**
- Added pagination support (page/limit parameters)
- Changed response from `{data: rawArray}` to `{data: {enrollments, pagination}}`
- Added graceful error handling for missing tables
- Count now calculated from database instead of array length

**Before:**
```javascript
res.json({
  success: true,
  data: data,  // Raw array
  count: data?.length || 0,
});
```

**After:**
```javascript
res.json({
  success: true,
  data: {
    enrollments: data || [],
    pagination: {
      page,
      limit,
      total: totalCount,
      pages: Math.ceil(totalCount / limit) || 1
    }
  },
});
```

**Frontend Expects:** `response.data.enrollments` and `response.data.pagination`

## Response Format Summary

### Attendance Endpoint
- **URL:** GET /api/attendance
- **Required Auth:** Yes (authenticate middleware)
- **Response Shape:**
```typescript
{
  success: boolean,
  message: string,
  data: {
    attendances: Array<{
      id: string,
      qr_code: string,
      status: string,
      attended_at: string,
      created_at: string,
      enrollment: { ... }
    }>,
    pagination: {
      page: number,
      limit: number,
      total: number,
      pages: number
    }
  }
}
```

### Admin Logs Endpoints
- **URL:** GET /api/admin/logs OR GET /api/admin/error-logs
- **Required Auth:** Yes
- **Response Shape:**
```typescript
{
  success: boolean,
  message: string,
  data: {
    logs: Array<{
      id: string,
      admin_id?: string,
      action: string,
      entity_type: string,
      entity_id?: string,
      changes?: Record<string, unknown>,
      created_at: string,
      admin?: { email: string, role: string }
    }>,
    pagination: {
      page: number,
      limit: number,
      total: number,
      pages: number
    }
  }
}
```

### Enrollments Endpoint
- **URL:** GET /api/enrollments
- **Required Auth:** No (public)
- **Response Shape:**
```typescript
{
  success: boolean,
  data: {
    enrollments: Array<{
      id: string,
      enrollment_amount: number,
      status: string,
      created_at: string,
      form_submissions: { ... }
    }>,
    pagination: {
      page: number,
      limit: number,
      total: number,
      pages: number
    }
  }
}
```

## Error Handling
- All endpoints now gracefully handle missing database tables
- Returns empty data with pagination instead of throwing 500 errors
- Prevents frontend crashes when tables aren't created yet
- Allows UI to load while tables are being created in Supabase

## Frontend Components Fixed
1. **AttendanceStats.tsx** - Now receives `response.data.attendances`
2. **AttendanceTable.tsx** - Now receives proper pagination
3. **ActivityLogs.tsx** - Now receives `response.data.logs`
4. **ErrorLogs.tsx** - Now receives `response.data.logs` (not errorLogs)
5. **EnrollmentTable.tsx** - Now receives `response.data.enrollments`

## Next Steps
1. User must run Supabase schema migration in SQL Editor (copy/paste supabase_schema.sql)
2. Create first admin account using `/api/auth/setup` endpoint
3. API endpoints will now work with real database data
