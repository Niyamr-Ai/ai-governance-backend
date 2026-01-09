# Risk Assessment & Auditing Module

## Overview

This module implements a comprehensive Risk Assessment & Auditing system for the AI Governance Platform. It allows organizations to assess and track risks across four key categories:

- **Bias & Fairness**: Evaluate demographic parity, equalized odds, calibration, and disparate impact
- **Robustness & Performance**: Assess accuracy, precision, recall, adversarial robustness, and edge case performance
- **Privacy & Data Leakage**: Review data leakage risks, differential privacy, anonymization techniques, and GDPR compliance
- **Explainability**: Measure model interpretability, feature importance, explanation methods, and user understanding

## Features

✅ **Database Schema**: Complete PostgreSQL schema with RLS policies  
✅ **API Routes**: RESTful endpoints for CRUD operations  
✅ **Frontend Components**: Reusable React components for table, form, and detail views  
✅ **Dashboard Integration**: Overall risk level calculation and display  
✅ **Security**: Row Level Security (RLS) with role-based access control  
✅ **Type Safety**: Full TypeScript support with comprehensive type definitions

## Installation

### 1. Database Migration

Run the migration file in your Supabase SQL Editor:

```bash
supabase/migrations/create_risk_assessments.sql
```

Or via Supabase CLI:

```bash
supabase db execute -f supabase/migrations/create_risk_assessments.sql
```

**Important**: The migration assumes an `ai_systems` table exists. If you're using `ai_system_registry` instead, update the foreign key reference in the migration:

```sql
-- Change this line:
ai_system_id UUID NOT NULL,

-- To this (if using ai_system_registry):
ai_system_id UUID NOT NULL REFERENCES ai_system_registry(system_id) ON DELETE CASCADE,
```

### 2. Install Dependencies

If not already installed, add `date-fns` for date formatting:

```bash
npm install date-fns
```

### 3. Verify RLS Policies

The migration includes RLS policies, but you may need to adjust them based on your access control model:

- **View Policy**: Users can view assessments for systems they have access to
- **Create Policy**: Authenticated users can create assessments
- **Update Policy**: Only assessors or admins can update assessments
- **Delete Policy**: Only admins can delete assessments

## API Endpoints

### Create Risk Assessment

```http
POST /api/ai-systems/[id]/risk-assessments
Content-Type: application/json

{
  "category": "bias",
  "summary": "Assessment summary...",
  "risk_level": "high",
  "metrics": {
    "demographic_parity": 0.85,
    "equalized_odds": 0.92
  },
  "evidence_links": ["https://example.com/evidence.pdf"]
}
```

### Get All Assessments for System

```http
GET /api/ai-systems/[id]/risk-assessments
```

### Get Single Assessment

```http
GET /api/risk-assessments/[assessmentId]
```

### Update Assessment

```http
PUT /api/risk-assessments/[assessmentId]
Content-Type: application/json

{
  "risk_level": "medium",
  "mitigation_status": "in_progress"
}
```

### Get Overall Risk Level

```http
GET /api/ai-systems/[id]/overall-risk
```

## Frontend Usage

### AI System Detail Page

Navigate to `/ai-systems/[id]` to view the system detail page with three tabs:

1. **Overview**: System general information
2. **Risk Assessments**: View and create risk assessments
3. **Compliance**: Compliance-related information

### Components

#### RiskTable

Displays a table of all risk assessments for a system:

```tsx
import RiskTable from "@/app/ai-systems/[id]/components/RiskAssessments/RiskTable";

<RiskTable
  assessments={assessments}
  onViewDetail={(assessment) => handleView(assessment)}
  loading={false}
/>
```

#### RiskForm

Form for creating new risk assessments:

```tsx
import RiskForm from "@/app/ai-systems/[id]/components/RiskAssessments/RiskForm";

<RiskForm
  aiSystemId={systemId}
  onSubmit={handleCreate}
  onCancel={() => setShowForm(false)}
  loading={false}
/>
```

#### RiskDetail

Modal/detail view for a specific assessment:

```tsx
import RiskDetail from "@/app/ai-systems/[id]/components/RiskAssessments/RiskDetail";

<RiskDetail
  assessment={selectedAssessment}
  onClose={() => setSelected(null)}
/>
```

## Dashboard Integration

### Calculate Overall Risk Level

Use the utility function to calculate overall risk:

```tsx
import { calculateOverallRiskLevel } from "@/lib/risk-assessment";

const overallRisk = calculateOverallRiskLevel(assessments);
// Returns: { level: "high", highest_category: "bias", assessment_count: 5, mitigated_count: 2 }
```

### Display in Dashboard

Add overall risk level to your AI system inventory:

```tsx
// Fetch overall risk for each system
const { data: overallRisk } = await fetch(`/api/ai-systems/${systemId}/overall-risk`);

// Display badge
<Badge className={getRiskLevelClasses(overallRisk.level)}>
  {overallRisk.level}
</Badge>
```

## Type Definitions

All types are defined in `types/risk-assessment.ts`:

- `RiskAssessment`: Base assessment interface
- `CreateRiskAssessmentInput`: Input for creating assessments
- `UpdateRiskAssessmentInput`: Input for updating assessments
- `RiskCategory`: 'bias' | 'robustness' | 'privacy' | 'explainability'
- `RiskLevel`: 'low' | 'medium' | 'high'
- `MitigationStatus`: 'not_started' | 'in_progress' | 'mitigated'

## Security

### Row Level Security (RLS)

The module includes comprehensive RLS policies:

1. **Read Access**: Users can view assessments for systems they have access to
2. **Create Access**: Any authenticated user can create assessments
3. **Update Access**: Only the original assessor or an admin can update
4. **Delete Access**: Only admins can delete

### Admin Role Check

The admin role is checked via user metadata:

```typescript
const isAdmin = user?.user?.user_metadata?.role === 'admin' || 
                user?.user?.user_metadata?.role === 'Admin';
```

Adjust this based on your role system (e.g., if using a roles table).

## Metrics Examples

### Bias & Fairness Metrics

```json
{
  "demographic_parity": 0.85,
  "equalized_odds": 0.92,
  "calibration": 0.88,
  "disparate_impact": 0.91,
  "protected_attributes": ["race", "gender"],
  "bias_audit_date": "2024-01-15"
}
```

### Robustness Metrics

```json
{
  "accuracy": 0.94,
  "precision": 0.91,
  "recall": 0.89,
  "f1_score": 0.90,
  "adversarial_robustness": 0.82,
  "performance_on_edge_cases": "Good",
  "stress_test_results": "Passed"
}
```

### Privacy Metrics

```json
{
  "data_leakage_risk": "Low",
  "differential_privacy_epsilon": 1.5,
  "anonymization_techniques": ["k-anonymity", "differential_privacy"],
  "gdpr_compliance": true,
  "data_retention_policy": "30 days",
  "access_controls": ["role-based", "encryption"]
}
```

### Explainability Metrics

```json
{
  "model_interpretability_score": 0.87,
  "feature_importance_available": true,
  "explanation_method": "SHAP",
  "explanation_coverage": 0.95,
  "user_understanding_score": 0.82,
  "documentation_quality": "Comprehensive"
}
```

## Governance Logic

This module is designed as a **governance layer**, not an ML execution framework:

- ✅ **Stores** risk assessment data
- ✅ **Tracks** mitigation status
- ✅ **Audits** assessment history
- ✅ **Calculates** overall risk levels
- ❌ **Does NOT** train models
- ❌ **Does NOT** auto-fix bias
- ❌ **Does NOT** execute ML operations

The focus is on **documentation, tracking, and governance** rather than automated ML operations.

## Troubleshooting

### Error: "Could not find the 'risk_assessments' column"

Make sure you've run the database migration in Supabase.

### Error: "AI system not found"

Verify that your `ai_systems` table exists or update the foreign key reference to match your schema.

### RLS Policy Errors

If you encounter permission errors, check:
1. User authentication status
2. RLS policies are enabled
3. User has access to the AI system
4. Admin role is correctly set in user metadata

### Foreign Key Constraint Errors

If using `ai_system_registry` instead of `ai_systems`, update the migration file to reference the correct table and column.

## Next Steps

1. **Customize Metrics**: Add category-specific metric validation in the form
2. **Add Notifications**: Set up alerts for high-risk assessments
3. **Export Reports**: Generate PDF/Excel reports of risk assessments
4. **Integration**: Connect with compliance assessments and system registry
5. **Analytics**: Add charts and trends for risk over time

## Project Structure

```
app/
├── api/
│   ├── ai-systems/
│   │   └── [id]/
│   │       ├── risk-assessments/
│   │       │   └── route.ts
│   │       └── overall-risk/
│   │           └── route.ts
│   └── risk-assessments/
│       └── [assessmentId]/
│           └── route.ts
├── ai-systems/
│   └── [id]/
│       ├── page.tsx
│       └── components/
│           └── RiskAssessments/
│               ├── RiskTable.tsx
│               ├── RiskForm.tsx
│               └── RiskDetail.tsx
lib/
└── risk-assessment.ts
types/
└── risk-assessment.ts
supabase/migrations/
└── create_risk_assessments.sql
```

## Support

For issues or questions, refer to:
- Database migration: `supabase/migrations/create_risk_assessments.sql`
- Type definitions: `types/risk-assessment.ts`
- API routes: `app/api/ai-systems/[id]/risk-assessments/route.ts`
- Frontend components: `app/ai-systems/[id]/components/RiskAssessments/`
