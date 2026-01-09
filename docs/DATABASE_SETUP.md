# Database Setup Guide

This guide explains how to create the database tables for MAS and UK AI regulatory assessments.

## Tables Required

1. **`mas_ai_risk_assessments`** - Stores MAS (Singapore) AI risk assessments
2. **`uk_ai_assessments`** - Stores UK AI regulatory framework assessments

## Migration Files

The migration files are located in `supabase/migrations/`:
- `create_mas_ai_risk_assessments.sql` - MAS table
- `create_uk_ai_assessments.sql` - UK table

## How to Run Migrations

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of the migration file
5. Click **Run** to execute the migration

### Option 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Navigate to your project root
cd /path/to/eu_ai_act_governance

# Link to your Supabase project (if not already linked)
supabase link --project-ref your-project-ref

# Run the migrations
supabase db push
```

Or run individual migrations:

```bash
# Run MAS migration
supabase db execute -f supabase/migrations/create_mas_ai_risk_assessments.sql

# Run UK migration
supabase db execute -f supabase/migrations/create_uk_ai_assessments.sql
```

### Option 3: Using psql (PostgreSQL CLI)

If you have direct database access:

```bash
# Connect to your database
psql -h your-db-host -U postgres -d postgres

# Run the migration
\i supabase/migrations/create_mas_ai_risk_assessments.sql
\i supabase/migrations/create_uk_ai_assessments.sql
```

## Verify Tables Created

After running migrations, verify the tables exist:

```sql
-- Check if MAS table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'mas_ai_risk_assessments';

-- Check if UK table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'uk_ai_assessments';

-- View table structure
\d mas_ai_risk_assessments
\d uk_ai_assessments
```

## Table Structures

### MAS AI Risk Assessments Table

Stores assessments based on MAS 12-pillar framework:
- System profile fields (name, description, owner, etc.)
- Data & dependencies flags
- 12 pillar assessments (governance, inventory, dataManagement, etc.)
- Overall risk level and compliance status

### UK AI Assessments Table

Stores assessments based on UK 5-principle framework:
- Risk level classification
- 5 principle assessments (safety, transparency, fairness, governance, contestability)
- Sector-specific regulation requirements
- Overall assessment status

## Troubleshooting

### Error: "relation already exists"

If you see this error, the table already exists. You can either:
1. Drop and recreate: `DROP TABLE IF EXISTS mas_ai_risk_assessments CASCADE;`
2. Use `CREATE TABLE IF NOT EXISTS` (already included in migrations)

### Error: "permission denied"

Make sure you're using a user with sufficient privileges (usually the `postgres` superuser or service role).

### Error: "function gen_random_uuid() does not exist"

Enable the UUID extension:
```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

## Next Steps

After creating the tables:
1. Test the API endpoints:
   - `POST /api/mas-compliance` - Should create MAS assessment
   - `POST /api/uk-compliance` - Should create UK assessment
2. Check the Supabase dashboard to see the data being inserted
3. Verify the results pages load correctly:
   - `/mas/[id]` - MAS assessment results
   - `/uk/[id]` - UK assessment results

