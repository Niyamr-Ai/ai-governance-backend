# Database Migration Required

## Risk Assessment Workflow Migration

The Risk Assessment feature requires a database migration to add workflow columns.

### Migration File
`supabase/migrations/add_risk_assessment_workflow.sql`

### What This Migration Adds

1. **`status` column** - Workflow status (draft, submitted, approved, rejected)
2. **`reviewed_by` column** - Admin who reviewed the assessment
3. **`reviewed_at` column** - Timestamp of review
4. **`review_comment` column** - Reviewer's comment

### How to Run the Migration

#### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/add_risk_assessment_workflow.sql`
4. Paste and execute the SQL

#### Option 2: Supabase CLI
```bash
supabase db push
```

#### Option 3: Direct SQL Execution
Run the SQL file directly in your Supabase SQL Editor.

### Verify Migration

After running the migration, verify the columns exist:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'risk_assessments' 
AND column_name IN ('status', 'reviewed_by', 'reviewed_at', 'review_comment');
```

You should see all 4 columns listed.

### Error: "column 'status' does not exist"

If you see this error when creating a risk assessment, it means the migration hasn't been run yet. Follow the steps above to run the migration.
