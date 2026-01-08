-- Add accountable_person column to EU AI Act assessments table
-- This migration adds accountable_person to store who is accountable for the AI system

ALTER TABLE IF EXISTS eu_ai_act_check_results
ADD COLUMN IF NOT EXISTS accountable_person TEXT;

-- Add accountable_person column to UK AI assessments table
ALTER TABLE IF EXISTS uk_ai_assessments
ADD COLUMN IF NOT EXISTS accountable_person TEXT;

-- Note: MAS already has 'owner' field which serves as accountable person
-- No migration needed for MAS

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_eu_ai_act_check_results_accountable_person 
ON eu_ai_act_check_results(accountable_person);

CREATE INDEX IF NOT EXISTS idx_uk_ai_assessments_accountable_person 
ON uk_ai_assessments(accountable_person);
