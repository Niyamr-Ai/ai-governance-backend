-- Add Lifecycle Governance Feature
-- This migration adds lifecycle_stage to AI system tables and creates audit history

-- 1. Add lifecycle_stage to EU AI Act assessments
ALTER TABLE IF EXISTS eu_ai_act_check_results
ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT NOT NULL DEFAULT 'Draft' 
  CHECK (lifecycle_stage IN ('Draft', 'Development', 'Testing', 'Deployed', 'Monitoring', 'Retired'));

-- 2. Add lifecycle_stage to MAS assessments
ALTER TABLE IF EXISTS mas_ai_risk_assessments
ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT NOT NULL DEFAULT 'Draft' 
  CHECK (lifecycle_stage IN ('Draft', 'Development', 'Testing', 'Deployed', 'Monitoring', 'Retired'));

-- 3. Add lifecycle_stage to UK AI Act assessments
ALTER TABLE IF EXISTS uk_ai_assessments
ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT NOT NULL DEFAULT 'Draft' 
  CHECK (lifecycle_stage IN ('Draft', 'Development', 'Testing', 'Deployed', 'Monitoring', 'Retired'));

-- 4. Create lifecycle_history table for audit trail
CREATE TABLE IF NOT EXISTS lifecycle_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_system_id UUID NOT NULL,
  previous_stage TEXT,
  new_stage TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for lifecycle queries
CREATE INDEX IF NOT EXISTS idx_eu_ai_act_lifecycle_stage ON eu_ai_act_check_results(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_mas_ai_lifecycle_stage ON mas_ai_risk_assessments(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_uk_ai_lifecycle_stage ON uk_ai_assessments(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_lifecycle_history_system_id ON lifecycle_history(ai_system_id);
CREATE INDEX IF NOT EXISTS idx_lifecycle_history_changed_at ON lifecycle_history(changed_at DESC);

-- Enable RLS on lifecycle_history
ALTER TABLE lifecycle_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Authenticated users can view lifecycle history
CREATE POLICY "Users can view lifecycle history"
ON lifecycle_history
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- RLS Policy: Authenticated users can create lifecycle history (via API)
CREATE POLICY "Users can create lifecycle history"
ON lifecycle_history
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Add comments for documentation
COMMENT ON COLUMN eu_ai_act_check_results.lifecycle_stage IS 'Lifecycle stage: Draft, Development, Testing, Deployed, Monitoring, Retired';
COMMENT ON COLUMN mas_ai_risk_assessments.lifecycle_stage IS 'Lifecycle stage: Draft, Development, Testing, Deployed, Monitoring, Retired';
COMMENT ON COLUMN uk_ai_assessments.lifecycle_stage IS 'Lifecycle stage: Draft, Development, Testing, Deployed, Monitoring, Retired';
COMMENT ON TABLE lifecycle_history IS 'Audit trail for lifecycle stage changes';
