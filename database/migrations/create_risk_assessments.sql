-- Create Risk Assessments table for AI Governance Platform
-- This table stores risk assessments for AI systems across 4 categories:
-- Bias & Fairness, Robustness & Performance, Privacy & Data Leakage, Explainability

-- Note: ai_system_id is a UUID that can reference any system identifier.
-- No foreign key constraint is enforced to allow flexibility with different system tables.

CREATE TABLE IF NOT EXISTS risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to AI System
  -- References ai_system_registry (or can be used with any system ID)
  ai_system_id UUID NOT NULL,
  
  -- Assessment Category
  category TEXT NOT NULL CHECK (category IN ('bias', 'robustness', 'privacy', 'explainability')),
  
  -- Assessment Details
  summary TEXT NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Risk Classification
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  
  -- Mitigation Status
  mitigation_status TEXT NOT NULL DEFAULT 'not_started' CHECK (mitigation_status IN ('not_started', 'in_progress', 'mitigated')),
  
  -- Assessment Metadata
  assessed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Evidence and Documentation
  evidence_links TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_risk_assessments_ai_system_id ON risk_assessments(ai_system_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_category ON risk_assessments(category);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_risk_level ON risk_assessments(risk_level);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_mitigation_status ON risk_assessments(mitigation_status);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_assessed_by ON risk_assessments(assessed_by);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_assessed_at ON risk_assessments(assessed_at DESC);

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_risk_assessments_updated_at ON risk_assessments;
CREATE TRIGGER update_risk_assessments_updated_at
BEFORE UPDATE ON risk_assessments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read risk assessments for systems they have access to
-- This allows all authenticated users to view assessments
-- Adjust based on your access control model
CREATE POLICY "Users can view risk assessments for accessible systems"
ON risk_assessments
FOR SELECT
USING (
  -- Allow if user is the assessor
  assessed_by = auth.uid()
  OR
  -- Allow all authenticated users to view
  -- (You can add more restrictive checks here based on ai_system_registry if needed)
  auth.uid() IS NOT NULL
);

-- RLS Policy: Authenticated users can create risk assessments
CREATE POLICY "Authenticated users can create risk assessments"
ON risk_assessments
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policy: Only creator can update draft assessments
-- Workflow Rule: Only draft assessments can be edited
CREATE POLICY "Creators can update draft assessments"
ON risk_assessments
FOR UPDATE
USING (
  -- Only allow updates if status is 'draft' and user is the creator
  status = 'draft' AND assessed_by = auth.uid()
)
WITH CHECK (
  -- Ensure status remains 'draft' (status changes happen via submit/approve/reject endpoints)
  status = 'draft' AND assessed_by = auth.uid()
);

-- RLS Policy: Only admins can delete risk assessments
CREATE POLICY "Only admins can delete risk assessments"
ON risk_assessments
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'role' = 'Admin')
  )
);

-- Add comment for documentation
COMMENT ON TABLE risk_assessments IS 'Stores risk assessments for AI systems across bias, robustness, privacy, and explainability categories';
COMMENT ON COLUMN risk_assessments.metrics IS 'JSONB object storing category-specific metrics (e.g., demographic parity, accuracy scores, etc.)';
COMMENT ON COLUMN risk_assessments.evidence_links IS 'Array of URLs or file paths to evidence documents supporting the assessment';
