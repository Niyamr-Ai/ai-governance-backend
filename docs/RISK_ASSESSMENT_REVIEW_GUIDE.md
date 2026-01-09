# Risk Assessment Review Process & Mitigation Status Guide

## 📋 Overview

This guide explains:
1. **Who reviews risk assessments and how the review process works**
2. **What mitigation status means and how it's used**

---

## 🔍 Review Process

### Workflow States

Risk assessments go through a **governance workflow** with the following states:

```
Draft → Submitted → Approved / Rejected
```

#### 1. **Draft** (Initial State)
- **Who creates:** Any authenticated user (ML engineers, business users, etc.)
- **What it means:** The assessment is being created or edited
- **Actions available:**
  - ✅ Creator can edit the assessment content
  - ✅ Creator can submit for review
  - ❌ Cannot be approved/rejected (not yet submitted)

#### 2. **Submitted** (Pending Review)
- **Who submits:** The creator of the assessment
- **What it means:** Assessment is complete and ready for review
- **Actions available:**
  - ❌ Content cannot be edited (locked)
  - ✅ Can be approved by reviewer
  - ✅ Can be rejected by reviewer
  - ✅ Creator can see it's pending review

#### 3. **Approved** (Accepted)
- **Who approves:** Currently **any authenticated user** (later: admins/compliance only)
- **What it means:** Assessment has been reviewed and accepted
- **Impact:**
  - ✅ **Counts toward Overall Risk Level** calculation
  - ✅ Assessment is finalized
  - ❌ Cannot be edited

#### 4. **Rejected** (Not Accepted)
- **Who rejects:** Currently **any authenticated user** (later: admins/compliance only)
- **What it means:** Assessment was reviewed but not accepted
- **Requirements:** Rejection requires a review comment explaining why
- **Impact:**
  - ❌ **Does NOT count toward Overall Risk Level**
  - ❌ Assessment is finalized
  - ❌ Cannot be edited

---

## 👥 Who Reviews Assessments?

### Current Implementation (Temporary)
- **Any authenticated user** can approve or reject submitted assessments
- This is for testing/development purposes

### Future Implementation (Planned)
- **Admin/Compliance Officers only** will be able to approve/reject
- Regular users will only be able to create and submit

### How Review is Tracked

When an assessment is approved or rejected, the system records:
- **`reviewed_by`**: User ID of the person who reviewed it
- **`reviewed_at`**: Timestamp when the review happened
- **`review_comment`**: Optional comment (required for rejections)

---

## 🔄 How to Review an Assessment

### Step-by-Step Process

1. **Navigate to Risk Assessments Tab**
   - Go to `/ai-systems/[system-id]?tab=risk-assessments`
   - You'll see a table of all assessments

2. **Find a Submitted Assessment**
   - Look for assessments with **"Submitted"** status badge (orange/yellow)
   - These are ready for review

3. **Click "View" Button**
   - Opens the detailed assessment view
   - Shows all assessment information:
     - Summary
     - Risk Level
     - Metrics
     - Evidence Links
     - Status
     - Mitigation Status

4. **Review the Assessment**
   - Read the summary and metrics
   - Check evidence links if provided
   - Verify the risk level is appropriate

5. **Take Action**
   - **Approve**: Click the green "Approve" button
     - Assessment status changes to "Approved"
     - Counts toward overall risk level
   - **Reject**: Click the red "Reject" button
     - Enter a rejection reason (required)
     - Assessment status changes to "Rejected"
     - Does NOT count toward overall risk level

### Review UI Location

The approve/reject buttons appear in the **Risk Assessment Detail View**:
- Only visible when:
  - Assessment status is "Submitted"
  - User is authenticated (currently anyone, later admins only)

---

## 🛡️ Mitigation Status

### What is Mitigation Status?

**Mitigation Status** tracks the **progress of actions taken to address or reduce the identified risk**. It's separate from the workflow status (draft/submitted/approved/rejected).

### Three States

#### 1. **Not Started** ⚠️
- **Icon:** Yellow warning triangle
- **Color:** Gray badge
- **Meaning:** No actions have been initiated to mitigate this risk
- **Example:** Risk identified but no remediation plan yet

#### 2. **In Progress** ⏳
- **Icon:** Clock icon
- **Color:** Blue badge
- **Meaning:** Mitigation efforts are currently underway
- **Example:** Team is working on fixing bias issues, implementing safeguards, etc.

#### 3. **Mitigated** ✅
- **Icon:** Checkmark
- **Color:** Green badge
- **Meaning:** The risk has been successfully addressed or reduced to an acceptable level
- **Example:** Bias issues fixed, safeguards implemented, risk reduced

### How Mitigation Status is Used

1. **Tracking Progress**
   - Shows whether the organization is actively working on reducing the risk
   - Helps prioritize which risks need attention

2. **Reporting**
   - Can filter assessments by mitigation status
   - Track how many risks are mitigated vs. pending

3. **Workflow Independence**
   - Mitigation status is **independent** of workflow status
   - An assessment can be:
     - **Approved** but **Not Started** (risk acknowledged, but not yet addressed)
     - **Approved** and **Mitigated** (risk acknowledged and fixed)
     - **Draft** and **In Progress** (still being assessed, but mitigation started)

### Updating Mitigation Status

Currently, mitigation status can be updated via:
- API: `PUT /api/risk-assessments/[id]` with `mitigation_status` field
- Future: UI controls to update mitigation status directly

---

## 📊 Key Differences

### Workflow Status vs. Mitigation Status

| Aspect | Workflow Status | Mitigation Status |
|--------|----------------|-------------------|
| **Purpose** | Governance/approval process | Risk remediation progress |
| **States** | Draft, Submitted, Approved, Rejected | Not Started, In Progress, Mitigated |
| **Who Controls** | Creator (submit) + Reviewer (approve/reject) | Risk owner / Team working on mitigation |
| **Impact on Risk Calculation** | Approved = counts, Rejected = doesn't count | No direct impact (tracks progress only) |
| **Can Change** | One-way flow (Draft → Submitted → Approved/Rejected) | Can change anytime (Not Started → In Progress → Mitigated) |

### Example Scenarios

**Scenario 1: Risk Identified, Not Yet Addressed**
- Workflow Status: **Approved** ✅
- Mitigation Status: **Not Started** ⚠️
- Meaning: Risk assessment is approved, but no mitigation actions have begun

**Scenario 2: Risk Being Actively Fixed**
- Workflow Status: **Approved** ✅
- Mitigation Status: **In Progress** ⏳
- Meaning: Risk assessment is approved, and team is working on fixing it

**Scenario 3: Risk Fully Addressed**
- Workflow Status: **Approved** ✅
- Mitigation Status: **Mitigated** ✅
- Meaning: Risk assessment is approved, and the risk has been successfully reduced

---

## 🎯 Summary

### Review Process
- **Creator** creates assessment (Draft) → Submits for review (Submitted)
- **Reviewer** (currently anyone, later admins) reviews → Approves or Rejects
- **Approved** assessments count toward overall risk level
- **Rejected** assessments do NOT count toward overall risk level

### Mitigation Status
- Tracks **progress on fixing the risk** (separate from approval)
- States: Not Started → In Progress → Mitigated
- Independent of workflow status
- Helps track which risks are being actively addressed

---

## 🔗 Related Files

- `app/ai-systems/[id]/components/RiskAssessments/RiskDetail.tsx` - Review UI
- `app/api/risk-assessments/[id]/approve/route.ts` - Approve endpoint
- `app/api/risk-assessments/[id]/reject/route.ts` - Reject endpoint
- `app/api/risk-assessments/[id]/submit/route.ts` - Submit endpoint
- `types/risk-assessment.ts` - Type definitions
