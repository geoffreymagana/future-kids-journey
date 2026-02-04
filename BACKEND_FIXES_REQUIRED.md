# Backend Fixes Required

## Critical Issues (Blocking Functionality)

### 1. **401 Unauthorized - Authentication Middleware Issue** (CRITICAL)
**Affected Endpoints:**
- `GET /api/forms/stats` - Returns 401
- `GET /api/forms/submissions` - Returns 401
- All authenticated requests failing

**Root Cause:** Backend authentication middleware not properly extracting/validating JWT token

**Fix Required:**
```typescript
// server/src/middleware/auth.ts should:
// 1. Extract JWT from Authorization header: "Bearer <token>"
// 2. Verify token signature
// 3. Decode token and attach userId and adminRole to req object

// Typical implementation:
export const authenticate = (req: AuthRequest, res: Response, next: () => void) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'your-secret');
    req.userId = payload.sub || payload.id;
    req.adminRole = payload.role;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
```

**Verification:** After fix, test these endpoints authenticated:
```bash
curl -H "Authorization: Bearer <your-token>" http://localhost:5000/api/forms/stats
```

---

### 2. **404 Not Found - `/admin/logs` Endpoint Missing** 
**Current State:** Frontend tries to fetch audit logs, gets 404
**File:** `server/src/routes/enrollments.ts` (or new `admin.ts`)

**Implementation Required:**
```typescript
// Add to server/src/routes/admin.ts (new file) or enrollments.ts

// GET /api/admin/logs
router.get('/logs', authenticate, async (req: AuthRequest, res: Response) => {
  // 1. Check if user is superadmin
  if (req.adminRole !== 'super_admin') {
    return res.status(403).json(formatError('Only superadmin can access logs', 403));
  }

  // 2. Get query filters
  const { action, resource, status, page = 1, limit = 20 } = req.query;
  
  // 3. Build MongoDB query with filters
  const query: Record<string, any> = {};
  if (action) query.action = action;
  if (resource) query.resource = resource;
  if (status) query.status = status;
  
  // 4. Query ActivityLog collection
  const skip = (Number(page) - 1) * Number(limit);
  const logs = await ActivityLog.find(query)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(Number(limit));
  
  const total = await ActivityLog.countDocuments(query);
  const pages = Math.ceil(total / Number(limit));
  
  return res.json(formatResponse({
    logs,
    pagination: { pages, total }
  }, 'Activity logs fetched successfully'));
});
```

**Create ActivityLog Model:** `server/src/models/ActivityLog.ts`
```typescript
import mongoose, { Document, Schema } from 'mongoose';

export interface IActivityLog extends Document {
  adminId: mongoose.Types.ObjectId;
  adminEmail?: string;
  action: string; // 'create_enrollment', 'record_payment', etc.
  resource: string; // 'enrollment', 'payment', 'admin', etc.
  resourceId?: mongoose.Types.ObjectId;
  details?: Record<string, any>;
  status: 'success' | 'error';
  errorMessage?: string;
  timestamp: Date;
  ipAddress?: string;
}

const activityLogSchema = new Schema<IActivityLog>({
  adminId: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  adminEmail: String,
  action: { type: String, required: true },
  resource: { type: String, required: true },
  resourceId: mongoose.Types.ObjectId,
  details: Schema.Types.Mixed,
  status: { type: String, enum: ['success', 'error'], required: true },
  errorMessage: String,
  timestamp: { type: Date, default: Date.now },
  ipAddress: String
}, { timestamps: true });

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', activityLogSchema);
```

**Logging Middleware:** Add to all admin endpoints
```typescript
// After successful operations
await ActivityLog.create({
  adminId: req.userId,
  adminEmail: req.adminEmail,
  action: 'create_enrollment',
  resource: 'enrollment',
  resourceId: enrollment._id,
  status: 'success',
  timestamp: new Date(),
  ipAddress: req.ip
});

// On errors
await ActivityLog.create({
  adminId: req.userId,
  adminEmail: req.adminEmail,
  action: 'create_enrollment',
  resource: 'enrollment',
  status: 'error',
  errorMessage: error.message,
  timestamp: new Date(),
  ipAddress: req.ip
});
```

---

### 3. **400 Bad Request - Payment Endpoint Validation Issues**
**Current State:** Payments failing with "Invalid payment data"
**Root Cause:** Backend `paymentSchema` missing `mpesa` method enum value

**Fix Required:** Update `server/src/routes/enrollments.ts`
```typescript
// CURRENT (Incorrect):
const paymentSchema = z.object({
  amount: z.number().min(0),
  method: z.enum(['cash', 'bank_transfer', 'upi', 'cheque', 'other']),
  notes: z.string().optional()
});

// UPDATED (Correct):
const paymentSchema = z.object({
  amount: z.number().min(0, 'Amount must be positive'),
  method: z.enum(['cash', 'bank_transfer', 'mpesa', 'upi', 'cheque', 'other']),
  notes: z.string().optional(),
  date: z.string().optional(), // Accept date if frontend sends it (future)
  mpesaReference: z.string().optional() // Accept M-Pesa ref (future)
});
```

**Update Payment Handler:**
```typescript
router.post('/:submissionId/payment', authenticate, async (req: AuthRequest, res: Response) => {
  // ... existing code ...
  
  const { amount, method, notes, date, mpesaReference } = validation.data;
  
  enrollment.payments.push({
    date: date ? new Date(date) : new Date(),
    amount,
    method,
    notes,
    mpesaReference: method === 'mpesa' ? mpesaReference : undefined
  });
  
  // ... rest of handler ...
});
```

**Update Enrollment Model:** `server/src/models/Enrollment.ts`
```typescript
payments: [{
  date: { type: Date, default: Date.now },
  amount: { type: Number, required: true, min: 0 },
  method: { 
    type: String, 
    enum: ['cash', 'bank_transfer', 'mpesa', 'upi', 'cheque', 'other'],
    required: true 
  },
  notes: String,
  mpesaReference: String // New field for M-Pesa transactions
}]
```

---

### 4. **403 Forbidden - Superadmin Role Validation Issue**
**Affected Endpoints:**
- `GET /api/enrollments/revenue/metrics` - 403 "Only superadmin can access"
- `GET /api/enrollments/revenue/terms` - 403 "Only superadmin can access"

**Root Cause:** Backend role check may not be reading role from JWT correctly

**Verification Steps:**
1. Check backend middleware is decoding JWT properly
2. Check JWT payload includes `role: 'super_admin'` claim
3. Check backend endpoints have proper role validation:
```typescript
const checkSuperAdmin = (req: AuthRequest, res: Response, next: () => void) => {
  if (req.adminRole !== 'super_admin') {
    return res.status(403).json(formatError('Only superadmin can access this resource', 403));
  }
  next();
};
```

**Test:** 
```bash
# 1. Get token from login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@example.com","password":"password"}'

# 2. Decode token to verify role claim
# Use jwt.io or write script to decode

# 3. Use token to access protected endpoint
curl -H "Authorization: Bearer <token>" http://localhost:5000/api/enrollments/revenue/metrics
```

---

## Summary of Required Backend Changes

| Issue | Endpoint | Fix Type | Priority |
|-------|----------|----------|----------|
| Auth middleware | All `/api/*` | Verify JWT extraction & validation | CRITICAL |
| Activity logs endpoint | `GET /api/admin/logs` | Create endpoint + model | HIGH |
| Payment validation | `POST /api/enrollments/:id/payment` | Add mpesa enum + date/ref fields | HIGH |
| Superadmin role check | Multiple | Verify JWT role claim detection | HIGH |
| Activity logging | All admin endpoints | Add logging calls to operations | MEDIUM |

## Testing Checklist

After implementing fixes:
- [ ] GET /api/forms/stats returns 200 with auth token
- [ ] GET /api/forms/submissions returns 200 with auth token
- [ ] POST /api/enrollments/:id/payment accepts mpesa method
- [ ] GET /api/enrollments/revenue/metrics accessible to superadmin (200)
- [ ] GET /api/enrollments/revenue/terms accessible to superadmin (200)
- [ ] GET /api/admin/logs returns activity logs with pagination
- [ ] All admin actions logged to ActivityLog collection
- [ ] Frontend forms/stats loads without 401 error
- [ ] Frontend enrollments table loads without 401 error
- [ ] Frontend payment recording works without 400 error
- [ ] Frontend activity logs display without 404 error

## Frontend Changes Already Applied

✅ Removed M-Pesa reference requirement (was causing 400 errors)
✅ Simplified payment data to send only: amount, method, notes
✅ Moved ActivityLogs component to last in superadmin section
✅ Fixed JWT role extraction in api.ts (no longer uses localStorage for auth)
