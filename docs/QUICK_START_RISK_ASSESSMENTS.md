# Quick Start: Risk Assessment Module

## ✅ Step 1: Run the Migration

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy the entire contents of `supabase/migrations/create_risk_assessments.sql`
3. Paste and click **Run**

## ✅ Step 2: Get a System ID

You can use any ID from your existing assessment tables:

### Option A: From Dashboard
1. Go to `/dashboard`
2. Click on any assessment's "View details" button
3. Copy the ID from the URL (e.g., `/compliance/abc123...` → `abc123...`)

### Option B: From Database
Run this in Supabase SQL Editor to get IDs:

```sql
-- Get EU AI Act assessment IDs
SELECT id, system_name, created_at 
FROM eu_ai_act_check_results 
ORDER BY created_at DESC 
LIMIT 5;

-- Get MAS assessment IDs
SELECT id, system_name, created_at 
FROM mas_ai_risk_assessments 
ORDER BY created_at DESC 
LIMIT 5;

-- Get UK assessment IDs
SELECT id, system_name, created_at 
FROM uk_ai_assessments 
ORDER BY created_at DESC 
LIMIT 5;
```

## ✅ Step 3: Access the Risk Assessment Page

Navigate to:
```
http://localhost:3000/ai-systems/[paste-id-here]
```

Replace `[paste-id-here]` with an actual ID from Step 2.

Example:
```
http://localhost:3000/ai-systems/46d647da-1234-5678-9abc-def123456789
```

## ✅ Step 4: Create Your First Risk Assessment

1. On the Risk Assessments tab, click **"New Assessment"**
2. Fill in:
   - **Category**: Select one (Bias, Robustness, Privacy, or Explainability)
   - **Risk Level**: Low, Medium, or High
   - **Summary**: Describe the risk findings (min 10 characters)
   - **Evidence Links**: Optional URLs to supporting documents
3. Click **"Create Assessment"**

## ✅ Step 5: View Assessments

- The table shows all risk assessments for that system
- Click **"View"** to see detailed information
- Overall risk level is calculated automatically (highest risk among all assessments)

## 🔗 Linking to Your Existing Systems

The `ai_system_id` in `risk_assessments` can reference:

- ✅ EU AI Act assessment IDs (`eu_ai_act_check_results.id`)
- ✅ MAS assessment IDs (`mas_ai_risk_assessments.id`)
- ✅ UK assessment IDs (`uk_ai_assessments.id`)
- ✅ Any other system identifier you use

## 📝 Example: Create Risk Assessment via API

```bash
POST http://localhost:3000/api/ai-systems/[system-id]/risk-assessments
Content-Type: application/json

{
  "category": "bias",
  "summary": "The model shows demographic parity of 0.85, indicating potential bias across protected attributes.",
  "risk_level": "high",
  "metrics": {
    "demographic_parity": 0.85,
    "equalized_odds": 0.92,
    "protected_attributes": ["race", "gender"]
  },
  "evidence_links": ["https://example.com/bias-audit-report.pdf"]
}
```

## 🎯 Next Steps

1. **Integrate with Dashboard**: Add overall risk level badges to your main dashboard
2. **Add to Compliance Pages**: Link risk assessments from compliance detail pages
3. **Customize Metrics**: Add category-specific metric fields to the form
4. **Set Up Notifications**: Alert when high-risk assessments are created

## ❓ Troubleshooting

**"AI system not found" error?**
- The API is flexible and will accept any UUID
- If you want strict validation, uncomment the check in the API route

**Can't see the page?**
- Make sure you're using a valid UUID format
- Check that the migration ran successfully
- Verify you're logged in (authentication required)

**RLS Policy errors?**
- The migration includes permissive policies for authenticated users
- Adjust the RLS policies in Supabase if you need stricter access control
