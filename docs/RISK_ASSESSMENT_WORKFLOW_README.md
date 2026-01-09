# Risk Assessment Governance Workflow

## Overview

The Risk Assessment module now includes a complete governance workflow with status tracking, role-based permissions, and audit capabilities.

## Workflow States

```
Draft → Submitted → Approved/Rejected
  ↑                    ↓
  └────────────────────┘ (if rejected, can be edited and resubmitted)
```

### Status Definitions

- **Draft**: Assessment is being created/edited. Only the creator can modify.
- **Submitted**: Assessment is pending review. Locked from editing.
- **Approved**: Assessment has been reviewed and approved. Counts toward overall risk level.
- **Rejected**: Assessment was rejected by reviewer. Does NOT count toward overall risk level.

## Role-Based Permissions

### User (ML / Business)
- ✅ Can create new assessments (status: `draft`)
- ✅ Can edit assessments when `status = 'draft'`
- ✅ Can submit assessments for review (`draft` → `submitted`)
- ❌ Cannot edit submitted/approved/rejected assessments
- ❌ Cannot approve or reject assessments

### Admin / Compliance Officer
- ✅ Can view all assessments
- ✅ Can approve submitted assessments (`submitted` → `approved`)
- ✅ Can reject submitted assessments (`submitted` → `rejected`)
- ✅ Must provide review comment when rejecting
- ❌ Cannot edit assessment content (even if admin)

## Governance Rules

### 1. Evidence Requirement
- **High-risk assessments** (`risk_level = 'high'`) **MUST** have at least one evidence link before submission
- Validation occurs:
  - Frontend: Form validation prevents submission
  - Backend: API validates before allowing status change to `submitted`

### 2. Overall Risk Calculation
- **Only approved assessments** count toward overall risk level
- Draft, submitted, and rejected assessments are **excluded** from risk calculation
- Overall risk = highest risk level among all **approved** assessments

### 3. Edit Restrictions
- **Draft**: Fully editable by creator
- **Submitted**: Locked - cannot be edited
- **Approved**: Read-only - cannot be edited
- **Rejected**: Can be edited (creator can fix issues and resubmit)

## Database Schema

### New Columns Added

```sql
status TEXT DEFAULT 'draft' 
  CHECK (status IN ('draft', 'submitted', 'approved', 'rejected'))

reviewed_by UUID REFERENCES auth.users(id) -- Admin who reviewed
reviewed_at TIMESTAMP -- When review was completed
review_comment TEXT -- Reviewer's comment (required for rejection)
```

## API Endpoints

### Submit Assessment
```http
POST /api/risk-assessments/[id]/submit
Authorization: Required
Role: User (creator only)

Response: { message: "Assessment submitted for review", assessment: {...} }
```

**Validation:**
- Status must be `draft`
- User must be the creator
- High-risk assessments must have evidence links

### Approve Assessment
```http
POST /api/risk-assessments/[id]/approve
Authorization: Required
Role: Admin/Compliance only

Body: { review_comment?: string } (optional)

Response: { message: "Assessment approved", assessment: {...} }
```

**Validation:**
- Status must be `submitted`
- User must be admin/compliance officer
- Sets `reviewed_by`, `reviewed_at`, `status = 'approved'`

### Reject Assessment
```http
POST /api/risk-assessments/[id]/reject
Authorization: Required
Role: Admin/Compliance only

Body: { review_comment: string } (required)

Response: { message: "Assessment rejected", assessment: {...} }
```

**Validation:**
- Status must be `submitted`
- User must be admin/compliance officer
- `review_comment` is **required**
- Sets `reviewed_by`, `reviewed_at`, `status = 'rejected'`

### Update Assessment (PUT)
```http
PUT /api/risk-assessments/[id]
Authorization: Required
Role: Creator only

Validation:
- Status must be `draft`
- User must be the creator
```

## Frontend Components

### RiskTable
- Shows **Status** column with color-coded badges:
  - Draft: Grey
  - Submitted: Yellow/Amber
  - Approved: Green
  - Rejected: Red

### RiskDetail Modal
- Displays workflow status badge
- Shows creator and reviewer information
- Shows review comment if rejected
- Action buttons based on role and status:
  - **User (Draft)**: "Submit for Review" button
  - **Admin (Submitted)**: "Approve" and "Reject" buttons
  - **Rejected**: Can be edited and resubmitted

### RiskForm
- Validates evidence requirement for high-risk assessments
- Shows warning: "Required for high-risk assessments"
- All new assessments start as `draft`

## Setup Instructions

### 1. Run Database Migration

Execute in Supabase SQL Editor:

```sql
-- File: supabase/migrations/add_risk_assessment_workflow.sql
```

This adds:
- `status` column (default: 'draft')
- `reviewed_by` column
- `reviewed_at` column
- `review_comment` column
- Indexes for performance

### 2. Set User Roles

To assign admin/compliance role to a user, update their metadata in Supabase:

```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  raw_user_meta_data,
  '{role}',
  '"admin"'
)
WHERE id = 'user-uuid-here';
```

Or via Supabase Dashboard:
1. Go to Authentication → Users
2. Edit user
3. Add to `raw_user_meta_data`: `{ "role": "admin" }`

### 3. Verify API Routes

All routes are created:
- ✅ `POST /api/risk-assessments/[id]/submit`
- ✅ `POST /api/risk-assessments/[id]/approve`
- ✅ `POST /api/risk-assessments/[id]/reject`
- ✅ `GET /api/user/role` (for frontend role detection)

## Workflow Example

### Scenario: User creates and submits a bias assessment

```
1. USER CREATES ASSESSMENT
   └─ Status: draft
   └─ Risk Level: high
   └─ Evidence Links: ["https://docs.company.com/bias-audit.pdf"]
   └─ User can edit freely

2. USER SUBMITS FOR REVIEW
   └─ POST /api/risk-assessments/[id]/submit
   └─ Status: submitted
   └─ Assessment is now locked (cannot edit)
   └─ Shows "Submitted" badge (yellow)

3. ADMIN REVIEWS
   └─ Admin opens RiskDetail modal
   └─ Sees "Approve" and "Reject" buttons
   └─ Reviews summary, metrics, evidence

4a. ADMIN APPROVES
   └─ POST /api/risk-assessments/[id]/approve
   └─ Status: approved
   └─ reviewed_by: admin-user-id
   └─ reviewed_at: NOW()
   └─ Assessment now counts toward overall risk level
   └─ Shows "Approved" badge (green)

4b. ADMIN REJECTS
   └─ POST /api/risk-assessments/[id]/reject
   └─ Body: { review_comment: "Missing demographic parity analysis" }
   └─ Status: rejected
   └─ reviewed_by: admin-user-id
   └─ reviewed_at: NOW()
   └─ review_comment: "Missing demographic parity analysis"
   └─ Assessment does NOT count toward overall risk level
   └─ Shows "Rejected" badge (red)

5. USER CAN RESUBMIT (if rejected)
   └─ User can edit the rejected assessment
   └─ Fixes issues based on review comment
   └─ Resubmits for review
```

## Overall Risk Level Calculation

### Before (All Assessments Count)
```typescript
// Old logic - counted all assessments
const overallRisk = highestRiskAmong(allAssessments);
```

### After (Only Approved Count)
```typescript
// New logic - only approved assessments count
const approvedAssessments = assessments.filter(a => a.status === 'approved');
const overallRisk = highestRiskAmong(approvedAssessments);
```

**Example:**
- System has 4 assessments:
  - Bias: High (draft) ❌
  - Robustness: Medium (submitted) ❌
  - Privacy: Low (approved) ✅
  - Explainability: High (approved) ✅

- **Overall Risk = High** (from Explainability - approved)
- Draft and submitted assessments are ignored

## Security & RLS

### Row Level Security Policies

1. **View Policy**: All authenticated users can view
2. **Create Policy**: All authenticated users can create (status: draft)
3. **Update Policy**: Only creator can update when status = draft
4. **Delete Policy**: Only admins can delete

### API-Level Validation

All workflow actions validate:
- User authentication
- User role (admin vs user)
- Current status (workflow state machine)
- Business rules (evidence for high-risk)

## Testing Checklist

- [ ] Create assessment → Status is `draft`
- [ ] Edit draft assessment → Works
- [ ] Submit draft → Status becomes `submitted`
- [ ] Try to edit submitted → Fails with error
- [ ] Admin approves → Status becomes `approved`
- [ ] Admin rejects → Status becomes `rejected`, comment required
- [ ] Edit rejected assessment → Works (can resubmit)
- [ ] High-risk without evidence → Cannot submit
- [ ] Overall risk calculation → Only counts approved assessments
- [ ] User cannot approve/reject → Returns 403
- [ ] Non-creator cannot edit draft → Returns 403

## Next Steps

1. **Run the migration** in Supabase
2. **Set admin roles** for compliance officers
3. **Test the workflow** end-to-end
4. **Customize RLS policies** if needed for your access model
5. **Add notifications** for status changes (optional)
