-- Migration: Add data_processing_locations column to ai_systems table
-- This column stores an array of jurisdictions where data is being processed
-- This is used to determine which compliance forms (UK, EU, MAS) are needed

-- Add the column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'ai_systems' 
    AND column_name = 'data_processing_locations'
  ) THEN
    ALTER TABLE ai_systems 
    ADD COLUMN data_processing_locations TEXT[] DEFAULT ARRAY[]::TEXT[];
    
    -- Add comment to document the column
    COMMENT ON COLUMN ai_systems.data_processing_locations IS 
      'Array of jurisdictions where data is being processed (e.g., ["UK", "EU", "Singapore", "India"]). Used to determine which compliance forms are required.';
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_ai_systems_data_processing_locations 
ON ai_systems USING GIN (data_processing_locations);

-- Update existing records: if data_processing_locations is empty/null, 
-- infer from country field for backward compatibility
UPDATE ai_systems
SET data_processing_locations = CASE
  WHEN country ILIKE 'singapore' THEN ARRAY['Singapore']::TEXT[]
  WHEN country ILIKE 'united kingdom' OR country ILIKE 'uk' THEN ARRAY['UK']::TEXT[]
  WHEN country = ANY(SELECT unnest(ARRAY[
    'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czechia',
    'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece',
    'Hungary', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg',
    'Malta', 'Netherlands', 'Poland', 'Portugal', 'Romania', 'Slovakia',
    'Slovenia', 'Spain', 'Sweden'
  ]::TEXT[])) THEN ARRAY['EU']::TEXT[]
  ELSE ARRAY[]::TEXT[]
END
WHERE data_processing_locations IS NULL 
   OR array_length(data_processing_locations, 1) IS NULL;

