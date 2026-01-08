-- Add system_name column to EU AI Act assessments table
-- This migration adds system_name to eu_ai_act_check_results table

ALTER TABLE IF EXISTS eu_ai_act_check_results
ADD COLUMN IF NOT EXISTS system_name TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_eu_ai_act_check_results_system_name 
ON eu_ai_act_check_results(system_name);

-- Add system_name column to UK AI assessments table
-- This migration adds system_name to uk_ai_assessments table

ALTER TABLE IF EXISTS uk_ai_assessments
ADD COLUMN IF NOT EXISTS system_name TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_uk_ai_assessments_system_name 
ON uk_ai_assessments(system_name);
