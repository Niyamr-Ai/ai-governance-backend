-- Add raw_answers column to EU AI Act assessments table
-- This migration adds raw_answers to store the original form answers including accountability question (q9)

ALTER TABLE IF EXISTS eu_ai_act_check_results
ADD COLUMN IF NOT EXISTS raw_answers JSONB;

-- Create index for better query performance if needed
-- Note: JSONB columns can be queried efficiently without a separate index for simple lookups
