# Bug Fixes: Revenue Card and Enrollment Table

## Issues Fixed

### 1. Missing `currency` Property Error
**Error:** "Cannot read properties of undefined (reading 'currency')"
**Location:** RevenueCard.tsx line 76

**Root Cause:** The `/enrollments/revenue/metrics` endpoint was not returning the `paymentTerms` object with the `currency` property that the RevenueCard component expects.

**Solution:** Updated the `/enrollments/revenue/metrics` endpoint to:
- Query the `payment_terms` table for actual payment configuration
- Return complete `RevenueMetrics` structure with all required fields including `paymentTerms`
- Provide default values (20% enrollment rate, 10% attendance rate, KES currency) if table doesn't exist
- Never return 500 error - always return valid data structure with defaults

**Response Structure Now Includes:**
```typescript
{
  success: true,
  data: {
    totalSignups: number,
    totalReach: number,
    totalEnrollments: number,
    totalShowUps: number,
    totalFullyPaid: number,
    totalPartiallyPaid: number,
    totalUnpaid: number,
    enrollmentRevenue: number,
    attendanceRevenue: number,
    totalRevenue: number,
    enrollmentCommissionTotal: number,
    attendanceCommissionTotal: number,
    breakdown: { ... },
    payoutInfo: { ... },
    paymentTerms: {
      enrollmentRate: number,
      attendanceRate: number,
      currency: string  // ← THIS WAS MISSING
    }
  }
}
```

### 2. Invalid UUID Error
**Error:** "invalid input syntax for type uuid: "undefined""
**Location:** When trying to update or pay for an enrollment

**Root Cause:** The component was using `editData.submissionId` which was undefined. The API returns `id` (UUID), but the component's Enrollment interface expects `_id` and `submissionId`.

**Solution:** 
- Added mapping layer in `fetchEnrollments()` to convert API response format to component format
- Maps `id` → `_id` (enrollment UUID)
- Maps `submission_id` → `submissionId` (foreign key reference)
- Maps all fields with fallbacks to prevent undefined values

**Before:**
```typescript
// API returns: { id, enrollment_amount, status, form_submissions { parent_name, whatsapp_number } }
const enrollments = data.enrollments; // Raw API data
await apiService.request('PATCH', `/enrollments/${editData.submissionId}`, ...); // submissionId is undefined!
```

**After:**
```typescript
// Map API response to component format
const mappedEnrollments: Enrollment[] = (data.enrollments || []).map((e: any) => ({
  _id: e.id || e._id,                           // enrollment UUID
  submissionId: e.submission_id || e.id,        // form submission reference
  parentName: e.form_submissions?.parent_name,
  whatsappNumber: e.form_submissions?.whatsapp_number,
  status: e.status || 'inquiry',
  paymentStatus: e.payment_status || 'unpaid',
  totalAmount: e.enrollment_amount || 0,
  paidAmount: e.paid_amount || 0,
  pendingAmount: e.pending_amount || 0,
  enrollmentDate: e.created_at,
  commissionEarned: { totalCommission: 0, currency: 'KES' }
}));
```

### 3. HTTP Method Changes
**Changes:**
- Updated enrollment update calls from `PATCH` to `PUT` to match API
- Changed endpoint parameter from `submissionId` to `id` (the enrollment's UUID)

**Before:**
```typescript
apiService.request('PATCH', `/enrollments/${editData.submissionId}`, updateData);
apiService.request('PATCH', `/enrollments/${selectedEnrollment.submissionId}`, { status: 'enrolled' });
```

**After:**
```typescript
apiService.request('PUT', `/enrollments/${id}`, { enrollment_amount, status });
apiService.request('PUT', `/enrollments/${selectedEnrollment._id}`, { status: 'enrolled' });
```

## Files Modified

### Backend
- **server/src/routes/enrollments.supabase.ts**
  - Enhanced `/revenue/metrics` endpoint to fetch and return payment terms
  - Added comprehensive error handling with default values
  - Returns complete RevenueMetrics structure matching frontend expectations

### Frontend
- **src/components/admin/EnrollmentTable.tsx**
  - Added data mapping layer in `fetchEnrollments()` to convert API format to component format
  - Fixed `handleSave()` to use correct enrollment ID and HTTP method
  - Fixed `handleRecordPayment()` to use `_id` instead of `submissionId`
  - Updated payment recording endpoint from PATCH to PUT

## Testing

To verify the fixes work:

1. **Revenue Card Display**
   - RevenueCard component should load without "Cannot read properties" error
   - Currency should display correctly (e.g., "KES")
   - All metrics should show (enrollment revenue, commission total, etc.)

2. **Enrollment Updates**
   - Click Edit on an enrollment row
   - Update the total amount or status
   - Click Save
   - Should save without UUID errors
   - Enrollment list should refresh with updated data

3. **Payment Recording**
   - Select an enrollment
   - Record a payment
   - Should not throw UUID error
   - Status should update to 'enrolled' after payment

## API Contract

### GET /enrollments/revenue/metrics
**Expected by Frontend:**
```typescript
interface RevenueMetrics {
  paymentTerms: {
    enrollmentRate: number;
    attendanceRate: number;
    currency: string;  // REQUIRED
  }
  // ... other fields
}
```

### GET /enrollments
**Mapping Applied in Frontend:**
```typescript
API Returns              →  Component Expects
id                       →  _id
submission_id            →  submissionId  
enrollment_amount        →  totalAmount
payment_status           →  paymentStatus
form_submissions.* →  direct properties with fallback
```

## Error Prevention

Both endpoints now handle missing database tables gracefully:
- Return valid data structure with defaults instead of 500 errors
- Prevents frontend crashes when database isn't initialized
- Allows UI to function while data is being populated
