# RLS Policy Fix for Risk Assessment Submission

## Problem
When trying to submit a risk assessment (change status from 'draft' to 'submitted'), you get this error:
```
new row violates row-level security policy for table "risk_assessments"
```

## Root Cause
The RLS policy's `WITH CHECK` clause was too restrictive - it only allowed `status = 'draft'`, preventing status changes to 'submitted'.

## Solution
Run the migration file `supabase/migrations/fix_rls_submit_policy.sql` to update the RLS policies.

### What the Fix Does

1. **Updates the "Creators can update draft assessments" policy:**
   - `USING`: Still requires status is 'draft' and user is creator
   - `WITH CHECK`: Now allows status to be 'draft' OR 'submitted' (as long as user is creator)
   - This allows creators to submit their draft assessments

2. **Adds "Anyone can approve or reject submitted assessments" policy:**
   - Allows any authenticated user to change status from 'submitted' to 'approved' or 'rejected'
   - TODO: Later restrict to admins/compliance only
   - Required for the approve/reject endpoints to work

## How to Apply the Fix

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/fix_rls_submit_policy.sql`
4. Paste and execute the SQL

### Option 2: Supabase CLI
```bash
supabase db push
```

## Verify the Fix

After running the migration, test by:
1. Creating a new risk assessment (should work)
2. Submitting it for review (should now work without RLS error)
3. As admin, approving or rejecting it (should work)

## Updated RLS Policy Behavior

### For Regular Users (Creators):
- ✅ Can create assessments
- ✅ Can edit their own draft assessments
- ✅ Can submit their own draft assessments (status: draft → submitted)
- ❌ Cannot edit submitted/approved/rejected assessments
- ❌ Cannot approve/reject assessments

### For All Authenticated Users (Temporary):
- ✅ All regular user permissions
- ✅ Can approve submitted assessments (status: submitted → approved)
- ✅ Can reject submitted assessments (status: submitted → rejected)
- ❌ Cannot edit assessment content (only status changes via approve/reject)

**Note:** Currently, any authenticated user can approve/reject. This will be restricted to admins/compliance only in a future update.

## Related Files
- `supabase/migrations/fix_rls_submit_policy.sql` - The fix migration
- `supabase/migrations/add_risk_assessment_workflow.sql` - Updated with the fix
- `app/api/risk-assessments/[id]/submit/route.ts` - Submit endpoint
- `app/api/risk-assessments/[id]/approve/route.ts` - Approve endpoint
- `app/api/risk-assessments/[id]/reject/route.ts` - Reject endpoint
