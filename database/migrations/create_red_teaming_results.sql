-- Create Red Teaming Results table
-- This table stores results from automated adversarial tests against AI/LLM systems

CREATE TABLE IF NOT EXISTS red_teaming_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to AI System (required - tests must be associated with a system)
  ai_system_id UUID NOT NULL,
  
  -- Test Details
  attack_type TEXT NOT NULL CHECK (attack_type IN ('prompt_injection', 'jailbreak', 'data_leakage', 'policy_bypass')),
  attack_prompt TEXT NOT NULL,
  system_response TEXT NOT NULL,
  
  -- Evaluation Results
  test_status TEXT NOT NULL CHECK (test_status IN ('PASS', 'FAIL')),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
  failure_reason TEXT,
  
  -- Test Metadata
  tested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_red_teaming_results_ai_system_id ON red_teaming_results(ai_system_id);
CREATE INDEX IF NOT EXISTS idx_red_teaming_results_attack_type ON red_teaming_results(attack_type);
CREATE INDEX IF NOT EXISTS idx_red_teaming_results_test_status ON red_teaming_results(test_status);
CREATE INDEX IF NOT EXISTS idx_red_teaming_results_risk_level ON red_teaming_results(risk_level);
CREATE INDEX IF NOT EXISTS idx_red_teaming_results_tested_at ON red_teaming_results(tested_at DESC);
CREATE INDEX IF NOT EXISTS idx_red_teaming_results_tested_by ON red_teaming_results(tested_by);

-- Enable Row Level Security (RLS)
ALTER TABLE red_teaming_results ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Authenticated users can view red teaming results" ON red_teaming_results;
DROP POLICY IF EXISTS "Authenticated users can create red teaming results" ON red_teaming_results;
DROP POLICY IF EXISTS "Only admins can delete red teaming results" ON red_teaming_results;

-- RLS Policy: Authenticated users can view all red teaming results
CREATE POLICY "Authenticated users can view red teaming results"
ON red_teaming_results
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- RLS Policy: Authenticated users can create red teaming results
CREATE POLICY "Authenticated users can create red teaming results"
ON red_teaming_results
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policy: Only admins can delete red teaming results
CREATE POLICY "Only admins can delete red teaming results"
ON red_teaming_results
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'role' = 'Admin')
  )
);

-- Add comment for documentation
COMMENT ON TABLE red_teaming_results IS 'Stores results from automated adversarial tests (red teaming) against AI/LLM systems';
COMMENT ON COLUMN red_teaming_results.attack_type IS 'Type of attack: prompt_injection, jailbreak, data_leakage, policy_bypass';
COMMENT ON COLUMN red_teaming_results.test_status IS 'Test result: PASS (system defended) or FAIL (system vulnerable)';
COMMENT ON COLUMN red_teaming_results.risk_level IS 'Risk level: LOW, MEDIUM, or HIGH based on severity of failure';

