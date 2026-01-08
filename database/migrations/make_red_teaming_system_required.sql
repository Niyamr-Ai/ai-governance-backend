-- Make ai_system_id required in red_teaming_results table
-- This migration updates the table to require system association for all tests

-- First, delete any existing records without a system (if any)
-- This ensures data integrity before adding the constraint
DELETE FROM red_teaming_results WHERE ai_system_id IS NULL;

-- Make ai_system_id NOT NULL
ALTER TABLE red_teaming_results 
ALTER COLUMN ai_system_id SET NOT NULL;

-- Add comment
COMMENT ON COLUMN red_teaming_results.ai_system_id IS 'Required reference to the AI system being tested';

