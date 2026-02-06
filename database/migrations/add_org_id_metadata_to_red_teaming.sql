-- Add org_id and metadata columns to red_teaming_results table

-- Add org_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'red_teaming_results' 
    AND column_name = 'org_id'
  ) THEN
    ALTER TABLE red_teaming_results ADD COLUMN org_id UUID;
    CREATE INDEX IF NOT EXISTS idx_red_teaming_results_org_id ON red_teaming_results(org_id);
  END IF;
END $$;

-- Add metadata column (JSONB) if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'red_teaming_results' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE red_teaming_results ADD COLUMN metadata JSONB;
  END IF;
END $$;

