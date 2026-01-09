# Risk Assessment Module - Architecture & Flow

## 🏗️ Overall Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                       │
│  /ai-systems/[id] → Risk Assessments Tab                      │
└──────────────────────┬────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Components                        │
│  • RiskTable.tsx (displays assessments)                      │
│  • RiskForm.tsx (creates new assessment)                     │
│  • RiskDetail.tsx (shows assessment details)                 │
└──────────────────────┬────────────────────────────────────────┘
                       │
                       ▼ HTTP Requests
┌─────────────────────────────────────────────────────────────┐
│                    API Routes (Next.js)                       │
│  POST /api/ai-systems/[id]/risk-assessments                  │
│  GET  /api/ai-systems/[id]/risk-assessments                  │
│  GET  /api/risk-assessments/[assessmentId]                   │
│  PUT  /api/risk-assessments/[assessmentId]                   │
│  GET  /api/ai-systems/[id]/overall-risk                      │
└──────────────────────┬────────────────────────────────────────┘
                       │
                       ▼ Supabase Client
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer (PostgreSQL)               │
│  risk_assessments table                                      │
│  • RLS Policies (security)                                   │
│  • Indexes (performance)                                    │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Data Flow Diagram

### 1. Creating a Risk Assessment

```
User Action
    │
    ▼
[Opens /ai-systems/[id]]
    │
    ▼
[Clicks "New Assessment" button]
    │
    ▼
[Fills RiskForm.tsx]
    │
    ├─ Category: bias/robustness/privacy/explainability
    ├─ Risk Level: low/medium/high
    ├─ Summary: text description
    ├─ Metrics: JSON object (optional)
    └─ Evidence Links: array of URLs (optional)
    │
    ▼
[Submits Form]
    │
    ▼
POST /api/ai-systems/[id]/risk-assessments
    │
    ├─ Validates user authentication
    ├─ Validates required fields
    ├─ Checks if system exists (EU/MAS/UK assessments)
    └─ Creates Supabase client
    │
    ▼
[Supabase Insert]
    │
    ├─ Inserts into risk_assessments table
    ├─ RLS Policy checks: auth.uid() IS NOT NULL
    └─ Returns created assessment
    │
    ▼
[Frontend receives response]
    │
    ├─ Refreshes assessment list
    ├─ Hides form
    └─ Shows success message
```

### 2. Viewing Risk Assessments

```
User Action
    │
    ▼
[Navigates to /ai-systems/[id]]
    │
    ▼
[Page loads → useEffect triggers]
    │
    ▼
GET /api/ai-systems/[id]/risk-assessments
    │
    ├─ Validates user authentication
    └─ Creates Supabase client
    │
    ▼
[Supabase Query]
    │
    ├─ SELECT * FROM risk_assessments
    ├─ WHERE ai_system_id = [id]
    ├─ RLS Policy checks: assessed_by = auth.uid() OR auth.uid() IS NOT NULL
    └─ ORDER BY assessed_at DESC
    │
    ▼
[Returns array of assessments]
    │
    ▼
[Frontend displays in RiskTable.tsx]
    │
    ├─ Shows category, risk level, mitigation status
    ├─ Shows assessment date
    └─ Provides "View" button for each
```

### 3. Viewing Assessment Details

```
User Action
    │
    ▼
[Clicks "View" button on assessment]
    │
    ▼
[Opens RiskDetail.tsx modal]
    │
    ├─ Displays full summary
    ├─ Shows all metrics (key-value pairs)
    ├─ Lists evidence links (clickable)
    ├─ Shows risk level badge
    └─ Shows mitigation status
```

### 4. Calculating Overall Risk Level

```
User Action / Automatic
    │
    ▼
[Page loads or assessment created]
    │
    ▼
[Frontend calls calculateOverallRiskLevel()]
    │
    ├─ Takes all assessments for the system
    ├─ Finds highest risk level:
    │   └─ Priority: high > medium > low
    ├─ Counts total assessments
    └─ Counts mitigated assessments
    │
    ▼
[Displays overall risk badge in header]
    │
    └─ Red badge if "high"
    └─ Yellow badge if "medium"
    └─ Green badge if "low"
```

## 🔄 Complete User Journey

### Scenario: User wants to assess bias risk for an AI system

```
1. USER NAVIGATES
   └─ Goes to /dashboard
   └─ Sees list of compliance assessments
   └─ Clicks on an EU AI Act assessment
   └─ Gets ID: "abc123-def456-..."

2. USER OPENS RISK ASSESSMENT PAGE
   └─ Navigates to /ai-systems/abc123-def456-...
   └─ Page loads, fetches existing assessments
   └─ Sees "Risk Assessments" tab (default)

3. USER CREATES NEW ASSESSMENT
   └─ Clicks "New Assessment" button
   └─ Form appears (RiskForm.tsx)
   └─ Selects:
      • Category: "Bias & Fairness"
      • Risk Level: "High"
      • Summary: "Model shows 15% disparity in loan approval rates..."
      • Evidence Links: ["https://docs.company.com/bias-audit.pdf"]
   └─ Clicks "Create Assessment"

4. BACKEND PROCESSES
   └─ API validates: category ✓, risk_level ✓, summary (min 10 chars) ✓
   └─ Checks if system ID exists in EU/MAS/UK tables
   └─ Inserts into risk_assessments:
      {
        ai_system_id: "abc123-def456-...",
        category: "bias",
        risk_level: "high",
        summary: "...",
        assessed_by: [current_user_id],
        assessed_at: NOW(),
        mitigation_status: "not_started"
      }
   └─ RLS Policy allows (authenticated user)

5. FRONTEND UPDATES
   └─ Receives created assessment
   └─ Refreshes assessment list
   └─ Table now shows new assessment
   └─ Overall risk level updates to "High" (if it was lower before)

6. USER VIEWS DETAILS
   └─ Clicks "View" on the new assessment
   └─ Modal opens (RiskDetail.tsx)
   └─ Sees full summary, metrics, evidence links
   └─ Can click evidence link to open PDF

7. USER UPDATES MITIGATION STATUS (Optional)
   └─ Admin or assessor can update via API:
      PUT /api/risk-assessments/[assessmentId]
      {
        "mitigation_status": "in_progress"
      }
   └─ RLS Policy checks: assessed_by = auth.uid() OR isAdmin
```

## 🗄️ Database Structure

### risk_assessments Table

```sql
risk_assessments
├── id (UUID, Primary Key)
├── ai_system_id (UUID) → Links to EU/MAS/UK assessment ID
├── category (TEXT) → 'bias' | 'robustness' | 'privacy' | 'explainability'
├── summary (TEXT) → Risk description
├── metrics (JSONB) → Category-specific data
│   ├── For bias: { demographic_parity: 0.85, ... }
│   ├── For robustness: { accuracy: 0.94, ... }
│   ├── For privacy: { data_leakage_risk: "Low", ... }
│   └── For explainability: { interpretability_score: 0.87, ... }
├── risk_level (TEXT) → 'low' | 'medium' | 'high'
├── mitigation_status (TEXT) → 'not_started' | 'in_progress' | 'mitigated'
├── assessed_by (UUID) → References auth.users(id)
├── assessed_at (TIMESTAMP) → When assessment was done
├── evidence_links (TEXT[]) → Array of URLs/files
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP) → Auto-updated by trigger
```

### Relationship to Existing Tables

```
┌─────────────────────┐
│ eu_ai_act_check_    │
│ results             │
│ id: abc123...       │◄───┐
└─────────────────────┘    │
                           │
┌─────────────────────┐    │ ai_system_id
│ mas_ai_risk_        │    │ (any UUID)
│ assessments         │    │
│ id: def456...       │◄───┤
└─────────────────────┘    │
                           │
┌─────────────────────┐    │
│ uk_ai_assessments   │    │
│ id: ghi789...       │◄───┘
└─────────────────────┘
                           │
                           ▼
                  ┌─────────────────────┐
                  │ risk_assessments    │
                  │ ai_system_id: ...   │
                  │ category: bias      │
                  │ risk_level: high    │
                  └─────────────────────┘
```

## 🔐 Security Flow (RLS Policies)

### When User Views Assessments

```
1. User makes GET request
   │
   ▼
2. Supabase checks RLS Policy:
   "Users can view risk assessments for accessible systems"
   │
   ├─ Condition 1: assessed_by = auth.uid()?
   │  └─ YES → Allow
   │  └─ NO → Check next
   │
   └─ Condition 2: auth.uid() IS NOT NULL?
      └─ YES → Allow (any authenticated user)
      └─ NO → Deny
```

### When User Creates Assessment

```
1. User makes POST request
   │
   ▼
2. Supabase checks RLS Policy:
   "Authenticated users can create risk assessments"
   │
   └─ Condition: auth.uid() IS NOT NULL?
      └─ YES → Allow
      └─ NO → Deny (401 Unauthorized)
```

### When User Updates Assessment

```
1. User makes PUT request
   │
   ▼
2. Supabase checks RLS Policy:
   "Admins and assessors can update risk assessments"
   │
   ├─ Condition 1: assessed_by = auth.uid()?
   │  └─ YES → Allow (original assessor)
   │  └─ NO → Check next
   │
   └─ Condition 2: user_metadata.role = 'admin'?
      └─ YES → Allow
      └─ NO → Deny (403 Forbidden)
```

## 🎯 Integration Points

### 1. With Compliance Assessments

```
Compliance Assessment (EU/MAS/UK)
    │
    └─ Has ID: "abc123..."
        │
        └─ Can be used as ai_system_id
            │
            └─ Multiple risk assessments can link to same system
                │
                ├─ Bias assessment
                ├─ Robustness assessment
                ├─ Privacy assessment
                └─ Explainability assessment
```

### 2. With Dashboard

```
Main Dashboard (/dashboard)
    │
    ├─ Shows compliance assessments
    │
    └─ Can be extended to show:
        ├─ Overall risk level badge per system
        └─ Link to risk assessments page
```

### 3. Overall Risk Calculation

```
For each system:
    │
    ├─ Fetch all risk_assessments WHERE ai_system_id = [id]
    │
    ├─ Find highest risk_level:
    │   └─ If any assessment = "high" → Overall = "high"
    │   └─ Else if any = "medium" → Overall = "medium"
    │   └─ Else → Overall = "low"
    │
    └─ Display badge in UI
```

## 📝 Example: Complete Flow

### User Story: "I want to assess bias risk for my loan approval AI system"

```
STEP 1: User has completed EU AI Act compliance assessment
   └─ System ID: "eu-abc123-def456-ghi789"
   └─ Stored in: eu_ai_act_check_results table

STEP 2: User navigates to risk assessment page
   └─ URL: /ai-systems/eu-abc123-def456-ghi789
   └─ Page component: app/ai-systems/[id]/page.tsx

STEP 3: Page fetches existing assessments
   └─ API: GET /api/ai-systems/eu-abc123-def456-ghi789/risk-assessments
   └─ Query: SELECT * FROM risk_assessments WHERE ai_system_id = 'eu-abc123...'
   └─ Result: [] (no assessments yet)

STEP 4: User creates bias assessment
   └─ Form data:
      {
        category: "bias",
        risk_level: "high",
        summary: "Model shows 15% approval rate disparity between demographic groups...",
        metrics: {
          demographic_parity: 0.85,
          equalized_odds: 0.92,
          protected_attributes: ["race", "gender"]
        },
        evidence_links: ["https://docs.company.com/bias-audit-2024.pdf"]
      }

STEP 5: API processes request
   └─ Validates: category ✓, risk_level ✓, summary (50 chars) ✓
   └─ Checks system exists: Found in eu_ai_act_check_results ✓
   └─ Inserts into database:
      {
        id: "risk-xyz789-...",
        ai_system_id: "eu-abc123-def456-ghi789",
        category: "bias",
        risk_level: "high",
        summary: "...",
        metrics: {...},
        assessed_by: "user-uuid-123",
        assessed_at: "2024-12-15T10:30:00Z",
        mitigation_status: "not_started"
      }

STEP 6: Frontend updates
   └─ Table shows new assessment
   └─ Overall risk level badge changes to "High" (red)
   └─ User can click "View" to see details

STEP 7: Later, user mitigates the risk
   └─ Admin updates: PUT /api/risk-assessments/risk-xyz789-...
   └─ Body: { "mitigation_status": "mitigated" }
   └─ Database updates: mitigation_status = "mitigated"
   └─ UI shows green "Mitigated" badge
```

## 🔗 Key Concepts

### 1. **Flexible System Linking**
- `ai_system_id` is just a UUID - no strict foreign key
- Can reference EU, MAS, UK assessments, or any system identifier
- Allows linking risk assessments to any system in your platform

### 2. **Category-Based Assessment**
- Each assessment focuses on ONE category
- A system can have multiple assessments (one per category)
- Categories are independent (bias assessment doesn't affect robustness)

### 3. **Overall Risk = Highest Individual Risk**
- If you have:
  - Bias: High
  - Robustness: Medium
  - Privacy: Low
  - Explainability: Medium
- Overall Risk = **High** (takes the highest)

### 4. **Governance Layer (Not ML Execution)**
- Stores assessment DATA
- Tracks mitigation STATUS
- Does NOT:
  - Train models
  - Fix bias automatically
  - Execute ML operations
- It's a documentation and tracking system

### 5. **RLS Security Model**
- **View**: Any authenticated user
- **Create**: Any authenticated user
- **Update**: Only assessor or admin
- **Delete**: Only admin

## 🎨 UI Flow

```
┌─────────────────────────────────────┐
│  /ai-systems/[id]                   │
│  ┌───────────────────────────────┐  │
│  │ Tabs: Overview | Risk | Comp  │  │
│  └───────────────────────────────┘  │
│                                      │
│  ┌───────────────────────────────┐  │
│  │ Overall Risk: [High] Badge   │  │
│  └───────────────────────────────┘  │
│                                      │
│  ┌───────────────────────────────┐  │
│  │ [New Assessment] Button        │  │
│  └───────────────────────────────┘  │
│                                      │
│  ┌───────────────────────────────┐  │
│  │ RiskTable                      │  │
│  │ ┌───────────────────────────┐ │  │
│  │ │ Category | Risk | Status  │ │  │
│  │ │ Bias     | High | [View]  │ │  │
│  │ │ Robust   | Med  | [View]  │ │  │
│  │ └───────────────────────────┘ │  │
│  └───────────────────────────────┘  │
│                                      │
│  ┌───────────────────────────────┐  │
│  │ RiskDetail Modal (when clicked)│  │
│  │ • Full summary                 │  │
│  │ • Metrics table                │  │
│  │ • Evidence links               │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

## 🚀 Next Steps for Integration

1. **Add to Compliance Detail Pages**
   - Add "View Risk Assessments" button on `/compliance/[id]`
   - Link to `/ai-systems/[id]?tab=risk-assessments`

2. **Dashboard Integration**
   - Show overall risk level badge in main dashboard table
   - Add filter by risk level

3. **Notifications**
   - Alert when high-risk assessment is created
   - Remind users of unmitigated high-risk assessments

4. **Reporting**
   - Export risk assessment reports
   - Generate risk trend charts over time
