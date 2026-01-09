-- Create ai_system_compliance table for detailed compliance assessments
-- This table stores the AI-generated detailed compliance assessment results

-- Drop table if it exists (to ensure clean slate)
DROP TABLE IF EXISTS ai_system_compliance CASCADE;

CREATE TABLE ai_system_compliance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  compliance_id UUID NOT NULL, -- References eu_ai_act_check_results.id

  -- Risk Management System
  documented_risk_management_system BOOLEAN NOT NULL,
  risk_identification_and_analysis BOOLEAN NOT NULL,
  risk_evaluation_process TEXT,
  specific_risk_mitigation_measures TEXT,

  -- Data Governance
  data_relevance_and_quality BOOLEAN NOT NULL,
  data_governance_measures TEXT,
  data_contextual_relevance TEXT,

  -- Technical Documentation
  technical_documentation_available BOOLEAN NOT NULL,
  technical_documentation_summary TEXT,

  -- Logging and Transparency
  automatic_event_logging BOOLEAN NOT NULL,
  logged_events_description TEXT,
  operation_transparency TEXT,

  -- Human Oversight
  instructions_for_use_available BOOLEAN NOT NULL,
  human_oversight_measures TEXT,

  -- Accuracy and Robustness
  accuracy_robustness_cybersecurity BOOLEAN NOT NULL,
  resilience_measures TEXT,
  security_controls TEXT,

  -- Conformity Assessment
  conformity_assessment_completed BOOLEAN NOT NULL,
  quality_management_system BOOLEAN NOT NULL,
  eu_declaration_and_ce_marking BOOLEAN NOT NULL,

  -- Fundamental Rights
  fundamental_rights_impact_assessment TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Foreign key constraint
ALTER TABLE ai_system_compliance
ADD CONSTRAINT fk_ai_system_compliance_compliance_id
FOREIGN KEY (compliance_id) REFERENCES eu_ai_act_check_results(id) ON DELETE CASCADE;

-- Unique constraint
ALTER TABLE ai_system_compliance
ADD CONSTRAINT unique_compliance_id UNIQUE(compliance_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_system_compliance_compliance_id ON ai_system_compliance(compliance_id);
CREATE INDEX IF NOT EXISTS idx_ai_system_compliance_created_at ON ai_system_compliance(created_at DESC);

-- Row Level Security
ALTER TABLE ai_system_compliance ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own compliance assessments"
  ON ai_system_compliance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM eu_ai_act_check_results
      WHERE eu_ai_act_check_results.id = ai_system_compliance.compliance_id
      AND eu_ai_act_check_results.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert their own compliance assessments"
  ON ai_system_compliance
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM eu_ai_act_check_results
      WHERE eu_ai_act_check_results.id = ai_system_compliance.compliance_id
      AND eu_ai_act_check_results.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can update their own compliance assessments"
  ON ai_system_compliance
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM eu_ai_act_check_results
      WHERE eu_ai_act_check_results.id = ai_system_compliance.compliance_id
      AND eu_ai_act_check_results.user_id::text = auth.uid()::text
    )
  );

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_ai_system_compliance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_system_compliance_updated_at
  BEFORE UPDATE ON ai_system_compliance
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_system_compliance_updated_at();

-- Comments
COMMENT ON TABLE ai_system_compliance IS 'Detailed AI-generated compliance assessments for EU AI Act requirements';
COMMENT ON COLUMN ai_system_compliance.compliance_id IS 'References the basic compliance check (eu_ai_act_check_results.id)';
COMMENT ON COLUMN ai_system_compliance.documented_risk_management_system IS 'Whether a documented risk management system exists';
COMMENT ON COLUMN ai_system_compliance.accuracy_robustness_cybersecurity IS 'Whether the system meets accuracy, robustness, and cybersecurity requirements';