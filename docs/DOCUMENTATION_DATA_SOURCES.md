# Documentation Feature - Data Sources

## Overview

This document details exactly which assessment results and data are used by the Automated Compliance Documentation feature to generate documentation for each regulation type.

---

## Data Sources Summary

The documentation feature uses **TWO main data sources**:

1. **Compliance Assessment Results** - From the regulation-specific assessment tables
2. **Approved Risk Assessments** - From the `risk_assessments` table (only approved status)

---

## 1. EU AI Act Documentation

### Source Table: `eu_ai_act_check_results`

The documentation generator fetches **ALL columns** from the EU AI Act assessment record using:
```sql
SELECT * FROM eu_ai_act_check_results WHERE id = systemId
```

### Specific Fields Used in Documentation:

#### System Information:
- ✅ `system_name` - System name
- ✅ `risk_tier` - Risk classification (Prohibited, High-risk, Limited-risk, Minimal-risk, Unknown)
- ✅ `compliance_status` - Overall compliance status (Compliant, Partially compliant, Non-compliant)
- ✅ `lifecycle_stage` - Lifecycle stage (Draft, Development, Testing, Deployed, Monitoring, Retired)
- ✅ `accountable_person` - Person accountable for the system

#### Compliance Details:
- ✅ `prohibited_practices_detected` - Boolean indicating if prohibited practices were detected
- ✅ `high_risk_all_fulfilled` - Boolean indicating if all high-risk obligations are fulfilled
- ✅ `high_risk_missing` - Array of missing high-risk obligations (e.g., ["Article 9", "Article 10"])
- ✅ `transparency_required` - Boolean indicating if transparency requirements apply
- ✅ `post_market_monitoring` - Boolean indicating if post-market monitoring is in place
- ✅ `fria_completed` - Boolean indicating if Fundamental Rights Impact Assessment is completed

#### Additional Data (if available):
- All other fields from the assessment record are included in the system data object

### Risk Assessments Used:
- ✅ **Only approved risk assessments** from `risk_assessments` table
- Filter: `status = 'approved'` AND `ai_system_id = systemId`
- For each approved assessment, includes:
  - `category` - Risk category (bias, robustness, privacy, explainability)
  - `risk_level` - Risk level (low, medium, high)
  - `summary` - Assessment summary text
  - `mitigation_status` - Current mitigation status (not_started, in_progress, mitigated)

---

## 2. UK AI Act Documentation

### Source Table: `uk_ai_assessments`

The documentation generator fetches **ALL columns** from the UK AI Act assessment record using:
```sql
SELECT * FROM uk_ai_assessments WHERE id = systemId
```

### Specific Fields Used in Documentation:

#### System Information:
- ✅ `system_name` - System name
- ✅ `risk_level` - Risk level classification
- ✅ `overall_assessment` - Overall compliance assessment
- ✅ `sector_regulation.sector` - Sector-specific regulation information

#### UK AI Principles Status:
- ✅ `safety_and_security` - Object containing:
  - `meetsPrinciple` - Boolean
  - `missing` - Array of missing requirements
- ✅ `transparency` - Object containing:
  - `meetsPrinciple` - Boolean
  - `missing` - Array of missing requirements
- ✅ `fairness` - Object containing:
  - `meetsPrinciple` - Boolean
  - `missing` - Array of missing requirements
- ✅ `governance` - Object containing:
  - `meetsPrinciple` - Boolean
  - `missing` - Array of missing requirements
- ✅ `contestability` - Object containing:
  - `meetsPrinciple` - Boolean
  - `missing` - Array of missing requirements

#### Additional Data:
- All other fields from the assessment record are included

### Risk Assessments Used:
- ✅ **Only approved risk assessments** from `risk_assessments` table
- Same format as EU AI Act (category, risk_level, summary, mitigation_status)

---

## 3. MAS Documentation

### Source Table: `mas_ai_risk_assessments`

The documentation generator fetches **ALL columns** from the MAS assessment record using:
```sql
SELECT * FROM mas_ai_risk_assessments WHERE id = systemId
```

### Specific Fields Used in Documentation:

#### System Information:
- ✅ `system_name` - System name
- ✅ `sector` - Sector classification
- ✅ `overall_risk_level` - Overall risk level (Low, Medium, High, Critical)
- ✅ `overall_compliance_status` - Overall compliance status (Compliant, Partially compliant, Non-compliant)
- ✅ `owner` - System owner
- ✅ `system_status` - System status (development, staging, production, deprecated)

#### Data Usage Flags:
- ✅ `uses_personal_data` - Boolean
- ✅ `uses_special_category_data` - Boolean
- ✅ `uses_third_party_ai` - Boolean

#### MAS 12 Pillars Assessment:
All 12 pillars are included as JSONB objects, each containing:
- ✅ `governance` - Status, score, gaps, recommendations
- ✅ `inventory` - Status, score, gaps, recommendations
- ✅ `dataManagement` - Status, score, gaps, recommendations
- ✅ `transparency` - Status, score, gaps, recommendations
- ✅ `fairness` - Status, score, gaps, recommendations
- ✅ `humanOversight` - Status, score, gaps, recommendations
- ✅ `thirdParty` - Status, score, gaps, recommendations
- ✅ `algoSelection` - Status, score, gaps, recommendations
- ✅ `evaluationTesting` - Status, score, gaps, recommendations
- ✅ `techCybersecurity` - Status, score, gaps, recommendations
- ✅ `monitoringChange` - Status, score, gaps, recommendations
- ✅ `capabilityCapacity` - Status, score, gaps, recommendations

Each pillar object structure:
```json
{
  "status": "Compliant" | "Partially compliant" | "Non-compliant",
  "score": 0-100,
  "gaps": ["gap 1", "gap 2", ...],
  "recommendations": ["recommendation 1", "recommendation 2", ...]
}
```

### Risk Assessments Used:
- ✅ **Only approved risk assessments** from `risk_assessments` table
- Same format as EU/UK (category, risk_level, summary, mitigation_status)

---

## Risk Assessments Data Structure

### Source Query:
```sql
SELECT * FROM risk_assessments 
WHERE ai_system_id = systemId 
  AND status = 'approved'
ORDER BY assessed_at DESC
```

### Fields Used from Risk Assessments:

For each approved risk assessment, the following is included:

1. **Category** (`category`):
   - Values: `bias`, `robustness`, `privacy`, `explainability`
   - Used to categorize the risk in documentation

2. **Risk Level** (`risk_level`):
   - Values: `low`, `medium`, `high`
   - Used to indicate severity in documentation

3. **Summary** (`summary`):
   - Text description of the risk assessment
   - Included verbatim in the documentation prompt

4. **Mitigation Status** (`mitigation_status`):
   - Values: `not_started`, `in_progress`, `mitigated`
   - Used to show current mitigation progress

### Risk Assessment Format in Prompt:
```
- {category}: {risk_level} risk - {summary} (Mitigation: {mitigation_status})
```

Example:
```
- bias: high risk - Demographic parity analysis shows 15% disparity in approval rates between groups (Mitigation: in_progress)
- robustness: medium risk - Model accuracy drops 8% on adversarial examples (Mitigation: not_started)
```

---

## Important Notes

### 1. Only Approved Risk Assessments
- ⚠️ **Draft, Submitted, and Rejected risk assessments are NOT included**
- Only assessments with `status = 'approved'` are used
- This ensures only validated risk assessments influence documentation

### 2. Complete Assessment Record
- The system fetches **ALL columns** from the assessment table
- Even if not explicitly listed above, all fields are available in `systemData`
- The LLM may use additional context from these fields

### 3. Lifecycle Stage (EU AI Act Only)
- For EU AI Act, `lifecycle_stage` is explicitly included
- Defaults to `'Draft'` if not set
- Used to provide context about system maturity

### 4. Missing Data Handling
- If a field is `null` or missing, defaults are used:
  - `system_name`: "Unspecified"
  - `risk_tier/risk_level`: "Unknown"
  - `compliance_status`: "Unknown"
  - `accountable_person`: "Not specified"
- The documentation will still be generated but may note missing information

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ Documentation Generation Request                         │
│ regulation_type: 'EU AI Act' | 'UK AI Act' | 'MAS'      │
│ systemId: UUID                                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Step 1: Gather System Data                              │
│                                                          │
│ EU AI Act:  SELECT * FROM eu_ai_act_check_results      │
│             WHERE id = systemId                        │
│                                                          │
│ UK AI Act:  SELECT * FROM uk_ai_assessments            │
│             WHERE id = systemId                         │
│                                                          │
│ MAS:        SELECT * FROM mas_ai_risk_assessments       │
│             WHERE id = systemId                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Step 2: Fetch Approved Risk Assessments                 │
│                                                          │
│ SELECT * FROM risk_assessments                          │
│ WHERE ai_system_id = systemId                           │
│   AND status = 'approved'                               │
│ ORDER BY assessed_at DESC                               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Step 3: Build Regulation-Specific Prompt               │
│                                                          │
│ - Format system data fields                            │
│ - Format risk assessments summary                       │
│ - Include regulation-specific requirements              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Step 4: Send to OpenAI GPT-4o                          │
│                                                          │
│ - System prompt: Expert compliance writer              │
│ - User prompt: Regulation-specific formatted data       │
│ - Temperature: 0.3 (for consistency)                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Step 5: Generate Documentation                          │
│                                                          │
│ - Markdown format                                       │
│ - Regulation-aligned structure                          │
│ - Professional formatting                               │
└─────────────────────────────────────────────────────────┘
```

---

## Example: What Gets Sent to LLM

### EU AI Act Example Prompt:

```
Generate technical documentation for an AI system aligned with EU AI Act Article 11 requirements.

System Information:
- Name: Customer Credit Scoring System
- Risk Tier: High-risk
- Compliance Status: Partially compliant
- Lifecycle Stage: Deployed
- Accountable Person: John Doe
- Prohibited Practices Detected: No
- High Risk Obligations Fulfilled: No
- Missing Obligations: ["Article 9 - Risk management system", "Article 10 - Data governance"]
- Transparency Required: Yes
- Post-Market Monitoring: Yes
- FRIA Completed: Yes

Risk Assessments (Approved):
- bias: high risk - Demographic parity analysis shows 15% disparity in approval rates between groups (Mitigation: in_progress)
- robustness: medium risk - Model accuracy drops 8% on adversarial examples (Mitigation: not_started)
- privacy: low risk - Data encryption and access controls are in place (Mitigation: mitigated)

Generate comprehensive technical documentation...
```

---

## Summary Table

| Regulation | Assessment Table | Key Fields Used | Risk Assessments |
|------------|----------------|-----------------|------------------|
| **EU AI Act** | `eu_ai_act_check_results` | system_name, risk_tier, compliance_status, lifecycle_stage, accountable_person, prohibited_practices_detected, high_risk_all_fulfilled, high_risk_missing, transparency_required, post_market_monitoring, fria_completed | Approved only (category, risk_level, summary, mitigation_status) |
| **UK AI Act** | `uk_ai_assessments` | system_name, risk_level, overall_assessment, sector_regulation, safety_and_security, transparency, fairness, governance, contestability | Approved only (category, risk_level, summary, mitigation_status) |
| **MAS** | `mas_ai_risk_assessments` | system_name, sector, overall_risk_level, overall_compliance_status, owner, system_status, uses_personal_data, uses_special_category_data, uses_third_party_ai, all 12 pillars (governance, inventory, dataManagement, etc.) | Approved only (category, risk_level, summary, mitigation_status) |

---

## Key Takeaways

1. ✅ **Complete Assessment Records**: All fields from the assessment table are fetched
2. ✅ **Approved Risk Assessments Only**: Only risk assessments with `status = 'approved'` are included
3. ✅ **Regulation-Specific**: Different fields are emphasized based on regulation type
4. ✅ **Lifecycle Context**: EU AI Act includes lifecycle stage information
5. ✅ **Pillar Details**: MAS includes complete 12-pillar assessment data
6. ✅ **Principle Status**: UK AI Act includes all 5 principle statuses with gaps

---

## Verification

To verify what data is being used:

1. Check the API route: `app/api/ai-systems/[id]/documentation/route.ts`
2. Look at the `gatherSystemData()` function (lines 189-234)
3. Check the `buildPrompt()` functions (lines 286-420)
4. Review the risk assessment query (lines 108-113)

All data sources are clearly defined in the code and can be traced through the generation process.
