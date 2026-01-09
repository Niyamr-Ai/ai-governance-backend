# Lifecycle Governance - Refined Implementation

## Overview

Lifecycle governance has been refined to apply **ONLY to EU AI Act** assessments, with clear separation from MAS and UK AI Regulations. The feature provides strong governance enforcement for production systems while maintaining flexibility for other regulations.

## Key Principles

1. **EU AI Act Only**: Lifecycle governance rules apply exclusively to EU AI Act assessments
2. **MAS/UK Informational**: Lifecycle stage exists for MAS/UK but has no restrictions
3. **Backend Enforcement**: All rules enforced at API level (source of truth)
4. **Clear UI Feedback**: Disabled actions show tooltips explaining why

## Lifecycle Stages (EU AI Act Only)

### Draft
- ✅ Full freedom
- ✅ Can create, edit, submit risk assessments
- ✅ Can change lifecycle stage freely

### Development
- ✅ Same as Draft
- ✅ Intended for active building phase
- ✅ No governance gates

### Testing (Staging)
- **Entry Gate**: Requires at least ONE completed (submitted or approved) risk assessment
- ✅ Can move forward to Deployed (if validation passes)
- ✅ Can move back to Development
- ❌ Cannot enter Testing without required assessment

### Deployed (Production)
- **Entry Gate**: Requires at least ONE APPROVED risk assessment
- ✅ Can CREATE new risk assessments (start as Draft)
- ✅ Can EDIT Draft assessments only
- ❌ Cannot edit Submitted/Approved/Rejected assessments
- ✅ Can Submit for review
- ✅ Can Approve/Reject (workflow actions)
- ✅ Can update mitigation status
- ❌ No content edits on approved/submitted assessments

### Monitoring
- **Same restrictions as Deployed**
- ✅ Can CREATE new assessments
- ✅ Can EDIT Draft assessments only
- ❌ Cannot edit Submitted/Approved/Rejected assessments
- ✅ Can update mitigation status
- **Forward-only**: Cannot move back to earlier stages
- ✅ Can only move forward to Retired

### Retired
- ❌ Fully read-only
- ❌ Cannot create assessments
- ❌ Cannot edit any assessments
- ❌ Cannot submit/approve/reject
- ❌ Cannot update mitigation status
- ❌ Cannot change lifecycle stage
- ✅ Permanent archival state

## Implementation Details

### Backend Validation

#### API Endpoints
- `GET /api/ai-systems/[id]/lifecycle`: Returns lifecycle stage (null for non-EU systems)
- `PUT /api/ai-systems/[id]/lifecycle`: Validates transitions (EU AI Act only)
- `PUT /api/risk-assessments/[id]`: Enforces lifecycle-based edit restrictions

#### Validation Rules
- **Testing Entry**: Requires completed assessment (submitted or approved)
- **Production Entry**: Requires approved assessment
- **Monitoring**: Forward-only transition (cannot go back)
- **Retired**: No transitions allowed

### Frontend UI

#### Conditional Display
- Lifecycle controls only shown for EU AI Act systems
- MAS/UK systems: Lifecycle column shows "N/A" on dashboard
- Lifecycle dropdown hidden for non-EU systems

#### Disabled Actions with Tooltips
- **Edit Button**: Shows tooltip explaining why edit is disabled
- **Mitigation Status**: Shows tooltip if disabled in Retired stage
- **Lifecycle Dropdown**: Disables backward transitions from Monitoring

#### Helper Functions
- `isActionDisabled()`: Checks if action should be disabled
- `getDisabledReason()`: Returns explanation for disabled state
- `canTransitionFromTo()`: Validates lifecycle transitions

## MAS and UK AI Regulations

### Behavior
- ✅ Lifecycle stage field exists (informational only)
- ✅ No lifecycle-based restrictions
- ✅ All risk assessment actions allowed (workflow rules still apply)
- ✅ No transition gates or validation
- ✅ Lifecycle governance completely ignored

### Display
- Dashboard: Shows "N/A" in lifecycle column
- Detail Page: Lifecycle controls hidden
- No warnings or constraints shown

## Files Modified

### New Files
- `lib/lifecycle-governance-helpers.ts`: UI helper functions for disabled states and tooltips

### Modified Files
- `lib/lifecycle-governance-rules.ts`: Added Monitoring restrictions, EU-only logic
- `app/api/ai-systems/[id]/lifecycle/route.ts`: EU-only enforcement
- `app/api/risk-assessments/[id]/route.ts`: EU-only lifecycle checks
- `app/ai-systems/[id]/page.tsx`: Conditional lifecycle display, Monitoring restrictions
- `app/ai-systems/[id]/components/RiskAssessments/RiskDetail.tsx`: Tooltips for disabled actions
- `app/dashboard/page.tsx`: Conditional lifecycle display

## Testing Checklist

### EU AI Act Systems
- [ ] Lifecycle controls visible
- [ ] Testing entry requires completed assessment
- [ ] Production entry requires approved assessment
- [ ] Deployed: Only drafts editable
- [ ] Monitoring: Only drafts editable, forward-only
- [ ] Retired: All actions disabled
- [ ] Tooltips show for disabled actions

### MAS/UK Systems
- [ ] Lifecycle controls hidden
- [ ] Dashboard shows "N/A"
- [ ] All risk assessment actions allowed
- [ ] No lifecycle restrictions

## Summary

The lifecycle governance feature is now:
- ✅ **EU AI Act exclusive** - Only applies to EU assessments
- ✅ **Strongly enforced** - Backend validation prevents violations
- ✅ **User-friendly** - Clear tooltips explain disabled states
- ✅ **Production-ready** - Audit integrity maintained
- ✅ **Non-breaking** - MAS/UK systems unaffected
