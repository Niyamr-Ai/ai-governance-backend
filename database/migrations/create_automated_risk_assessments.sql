-- Create Automated Risk Assessments table
-- This table stores AI-generated comprehensive risk assessments with 5 dimensions:
-- Technical, Operational, Legal/Regulatory, Ethical/Societal, Business

CREATE TABLE IF NOT EXISTS automated_risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to AI System (can reference EU/UK/MAS assessment IDs)
  ai_system_id UUID NOT NULL,
  
  -- Risk Dimension Scores (1-10 scale)
  technical_risk_score INTEGER NOT NULL CHECK (technical_risk_score >= 1 AND technical_risk_score <= 10),
  operational_risk_score INTEGER NOT NULL CHECK (operational_risk_score >= 1 AND operational_risk_score <= 10),
  legal_regulatory_risk_score INTEGER NOT NULL CHECK (legal_regulatory_risk_score >= 1 AND legal_regulatory_risk_score <= 10),
  ethical_societal_risk_score INTEGER NOT NULL CHECK (ethical_societal_risk_score >= 1 AND ethical_societal_risk_score <= 10),
  business_risk_score INTEGER NOT NULL CHECK (business_risk_score >= 1 AND business_risk_score <= 10),
  
  -- Weighted Composite Score
  composite_score DECIMAL(5,2) NOT NULL CHECK (composite_score >= 1.0 AND composite_score <= 10.0),
  
  -- Overall Risk Level
  overall_risk_level TEXT NOT NULL CHECK (overall_risk_level IN ('Critical', 'High', 'Medium', 'Low')),
  
  -- Dimension Weights (customizable per organization, defaults to equal weights)
  weights JSONB NOT NULL DEFAULT '{"technical": 0.2, "operational": 0.2, "legal_regulatory": 0.2, "ethical_societal": 0.2, "business": 0.2}'::jsonb,
  
  -- Detailed Dimension Analysis (JSONB for flexibility)
  dimension_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- AI-Generated Report Content
  executive_summary TEXT NOT NULL,
  detailed_findings TEXT NOT NULL,
  compliance_checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  remediation_plan TEXT NOT NULL,
  re_assessment_timeline TEXT,
  
  -- Assessment Metadata
  assessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assessed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Trigger Information
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('registration', 'major_change', 'periodic_review', 'manual')),
  
  -- Data Sources Used (for traceability)
  data_sources JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_automated_risk_assessments_ai_system_id ON automated_risk_assessments(ai_system_id);
CREATE INDEX IF NOT EXISTS idx_automated_risk_assessments_overall_risk_level ON automated_risk_assessments(overall_risk_level);
CREATE INDEX IF NOT EXISTS idx_automated_risk_assessments_composite_score ON automated_risk_assessments(composite_score DESC);
CREATE INDEX IF NOT EXISTS idx_automated_risk_assessments_assessed_at ON automated_risk_assessments(assessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_automated_risk_assessments_trigger_type ON automated_risk_assessments(trigger_type);

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_automated_risk_assessments_updated_at ON automated_risk_assessments;
CREATE TRIGGER update_automated_risk_assessments_updated_at
BEFORE UPDATE ON automated_risk_assessments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE automated_risk_assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view automated risk assessments for accessible systems
CREATE POLICY "Users can view automated risk assessments"
ON automated_risk_assessments
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- RLS Policy: System can create automated risk assessments (via API)
CREATE POLICY "System can create automated risk assessments"
ON automated_risk_assessments
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policy: Only system can update (for regeneration)
CREATE POLICY "System can update automated risk assessments"
ON automated_risk_assessments
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Add comments for documentation
COMMENT ON TABLE automated_risk_assessments IS 'Stores AI-generated comprehensive risk assessments with 5 dimensions and detailed reports';
COMMENT ON COLUMN automated_risk_assessments.dimension_details IS 'JSONB object storing detailed analysis for each risk dimension';
COMMENT ON COLUMN automated_risk_assessments.compliance_checklist IS 'JSONB array of compliance items with status';
COMMENT ON COLUMN automated_risk_assessments.data_sources IS 'JSONB object tracking which data sources were used (compliance assessments, risk assessments, etc.)';

