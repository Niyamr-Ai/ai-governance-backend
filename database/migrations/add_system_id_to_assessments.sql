-- Add system_id column to all assessment tables
-- This migration adds system_id to link assessments back to the ai_systems table

-- 1. Add system_id to UK AI assessments
ALTER TABLE IF EXISTS uk_ai_assessments
ADD COLUMN IF NOT EXISTS system_id UUID REFERENCES ai_systems(id) ON DELETE SET NULL;

-- 2. Add system_id to MAS AI assessments
ALTER TABLE IF EXISTS mas_ai_risk_assessments
ADD COLUMN IF NOT EXISTS system_id UUID REFERENCES ai_systems(id) ON DELETE SET NULL;

-- 3. Add system_id to EU AI Act assessments
ALTER TABLE IF EXISTS eu_ai_act_check_results
ADD COLUMN IF NOT EXISTS system_id UUID REFERENCES ai_systems(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_uk_ai_assessments_system_id ON uk_ai_assessments(system_id);
CREATE INDEX IF NOT EXISTS idx_mas_ai_risk_assessments_system_id ON mas_ai_risk_assessments(system_id);
CREATE INDEX IF NOT EXISTS idx_eu_ai_act_check_results_system_id ON eu_ai_act_check_results(system_id);

