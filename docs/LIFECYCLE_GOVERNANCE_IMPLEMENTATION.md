# Lifecycle Governance Implementation

## Overview

This document describes the implementation of **Lifecycle Governance** behavior for the AI governance platform. The system now enforces governance rules based on lifecycle stages, validating transitions and locking actions as appropriate.

## Lifecycle Stages

The system supports the following lifecycle stages:

- **Draft**: Initial stage, no restrictions
- **Development**: Early development phase
- **Testing** (Staging): Pre-production testing phase
- **Deployed** (Production): Live production systems
- **Monitoring**: Ongoing monitoring phase
- **Retired**: Read-only, archived systems

## Governance Rules

### 1. Draft / Development
- ✅ Allow draft risk assessments
- ✅ No restrictions on transitions
- ✅ All actions allowed

### 2. Testing (Staging)
- ✅ Require at least one **completed** (submitted or approved) risk assessment
- ❌ Block transition if no completed assessments exist
- ✅ Allow creating new assessments
- ✅ Allow editing draft assessments

### 3. Deployed (Production)
- ✅ Require at least one **APPROVED** risk assessment
- ✅ Lock risk assessment edits (only draft assessments can be edited)
- ✅ Enable audit logging for all changes
- ✅ MAS compliance: Require accountability owner
- ✅ UK AI Act: Check governance and safety principles
- ❌ Block transition if requirements not met

### 4. Monitoring
- ✅ Allow new assessments
- ✅ Preserve assessment history
- ✅ Allow editing draft assessments

### 5. Retired
- ❌ Lock all system and assessment edits (read-only)
- ❌ No new assessments allowed
- ❌ Cannot transition to another stage

## Implementation Details

### Backend Validation

#### Lifecycle Transition Validation (`lib/lifecycle-governance-rules.ts`)
- `validateLifecycleTransition()`: Validates transitions based on current stage, compliance data, and risk assessment summary
- `canEditRiskAssessment()`: Checks if risk assessment edits are allowed based on lifecycle stage
- `canCreateRiskAssessmentInStage()`: Checks if new assessments can be created
- `getLifecycleConstraints()`: Returns stage-specific constraint messages

#### API Endpoints

**PUT `/api/ai-systems/[id]/lifecycle`**
- Validates transition before allowing change
- Checks compliance requirements (MAS owner, UK principles)
- Validates risk assessment requirements
- Returns clear error messages if validation fails
- Logs lifecycle changes to `lifecycle_history` table

**PUT `/api/risk-assessments/[id]`**
- Checks lifecycle stage before allowing edits
- Blocks edits for non-draft assessments in Production (Deployed)
- Blocks all edits for Retired systems

### Frontend UI

#### AI System Detail Page (`app/ai-systems/[id]/page.tsx`)
- **Lifecycle Dropdown**: Shows current stage, allows transitions (disabled for Retired)
- **Confirmation Dialog**: Shows confirmation for Production transitions with requirements
- **Error Display**: Shows validation errors when transitions are blocked
- **Warning Alerts**: Displays lifecycle-specific warnings and recommendations
- **Lifecycle Constraints Card**: Shows current stage constraints and rules
- **Action Disabling**: Disables "New Assessment" button for Retired systems

#### Overview Tab
- Displays lifecycle warnings based on current stage
- Shows lifecycle constraints card
- Shows risk assessment summary (total, approved)
- Displays system information and accountable person

#### Risk Assessments Tab
- Conditionally shows "New Assessment" button based on lifecycle stage
- Shows message when system is Retired

## Compliance Checks

### MAS (Singapore)
- **Requirement**: Accountability owner must be specified before Production
- **Field**: `owner` or `accountable_person` in `mas_ai_risk_assessments` table
- **Validation**: Checks if owner exists and is not empty/placeholder

### UK AI Act
- **Requirements**: 
  - Governance principle should be met (`governance.meetsPrinciple === true`)
  - Safety and Security principle should be met (`safety_and_security.meetsPrinciple === true`)
- **Validation**: Checks UK AI principles compliance before Production
- **Warning**: Shows warnings if principles not met (does not block, but warns)

## Audit Trail

All lifecycle transitions are logged to the `lifecycle_history` table:

```sql
CREATE TABLE lifecycle_history (
  id UUID PRIMARY KEY,
  ai_system_id UUID NOT NULL,
  previous_stage TEXT,
  new_stage TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Error Messages

### Transition Blocked
- **Testing**: "Cannot move to Testing stage: At least one risk assessment must be submitted or approved before moving to Testing."
- **Production**: "Cannot move to Production: At least one APPROVED risk assessment is required. [Additional compliance requirements]"
- **Retired**: "Retired systems cannot be moved to another lifecycle stage. System is read-only."

### Edit Blocked
- **Production (Non-draft)**: "Cannot edit risk assessments in Production (Deployed) stage. Only draft assessments can be edited in Production."
- **Retired**: "Cannot edit risk assessments for retired systems. System is read-only."

## Usage Examples

### Example 1: Moving to Testing
```typescript
// User tries to move from Development to Testing
// System checks: Are there any submitted or approved risk assessments?
// If no: Block transition with error message
// If yes: Allow transition, log to lifecycle_history
```

### Example 2: Moving to Production
```typescript
// User tries to move from Testing to Deployed (Production)
// System checks:
//   1. Are there any APPROVED risk assessments? (Required)
//   2. If MAS: Is owner specified? (Required)
//   3. If UK: Are governance/safety principles met? (Warning)
// If requirements not met: Block transition with detailed error
// If requirements met: Allow transition, show warnings if any
```

### Example 3: Editing Risk Assessment in Production
```typescript
// User tries to edit a submitted/approved assessment in Production
// System checks: lifecycle_stage === 'Deployed' && assessment.status !== 'draft'
// Result: Block edit with error message
// Only draft assessments can be edited in Production
```

## Files Modified

### New Files
- `lib/lifecycle-governance-rules.ts`: Core validation logic

### Modified Files
- `app/api/ai-systems/[id]/lifecycle/route.ts`: Added transition validation
- `app/api/risk-assessments/[id]/route.ts`: Added lifecycle stage checking
- `app/ai-systems/[id]/page.tsx`: Added UI warnings, confirmations, and constraints display

## Testing Checklist

- [ ] Transition from Draft to Development (should succeed)
- [ ] Transition to Testing without completed assessments (should fail)
- [ ] Transition to Testing with submitted assessment (should succeed)
- [ ] Transition to Production without approved assessment (should fail)
- [ ] Transition to Production with approved assessment (should succeed)
- [ ] Transition to Production for MAS without owner (should fail)
- [ ] Transition to Production for UK without principles (should warn but allow)
- [ ] Edit draft assessment in Production (should succeed)
- [ ] Edit submitted assessment in Production (should fail)
- [ ] Edit any assessment in Retired (should fail)
- [ ] Create new assessment in Retired (should be disabled)
- [ ] Verify audit trail entries in lifecycle_history table

## Future Enhancements

1. **Role-Based Restrictions**: Restrict Production transitions to admins/compliance officers
2. **Workflow Integration**: Integrate with approval workflows for Production transitions
3. **Compliance Dashboard**: Show compliance status across all lifecycle stages
4. **Automated Checks**: Run automated compliance checks before allowing transitions
5. **Notification System**: Notify stakeholders when systems move to Production
