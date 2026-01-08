-- Create Compliance Documentation table
-- This table stores automatically generated compliance documentation for AI systems
-- Each document is linked to one system and one regulation type

CREATE TABLE IF NOT EXISTS compliance_documentation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to AI System (can reference any compliance table ID)
  ai_system_id UUID NOT NULL,
  
  -- Regulation Type
  regulation_type TEXT NOT NULL CHECK (regulation_type IN ('EU AI Act', 'UK AI Act', 'MAS')),
  
  -- Document Version
  version TEXT NOT NULL DEFAULT '1.0',
  
  -- Document Content
  content TEXT NOT NULL,
  
  -- Document Status
  status TEXT NOT NULL DEFAULT 'current' CHECK (status IN ('current', 'outdated')),
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Track what data was used to generate this document (for change detection)
  generation_metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_compliance_documentation_ai_system_id ON compliance_documentation(ai_system_id);
CREATE INDEX IF NOT EXISTS idx_compliance_documentation_regulation_type ON compliance_documentation(regulation_type);
CREATE INDEX IF NOT EXISTS idx_compliance_documentation_status ON compliance_documentation(status);
CREATE INDEX IF NOT EXISTS idx_compliance_documentation_created_at ON compliance_documentation(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_compliance_documentation_created_by ON compliance_documentation(created_by);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_compliance_documentation_system_regulation ON compliance_documentation(ai_system_id, regulation_type);

-- Enable Row Level Security
ALTER TABLE compliance_documentation ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read their own documentation
CREATE POLICY "Users can read their own documentation"
  ON compliance_documentation
  FOR SELECT
  USING (auth.uid() = created_by);

-- Users can create documentation
CREATE POLICY "Users can create documentation"
  ON compliance_documentation
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Users can update their own documentation (for status changes)
CREATE POLICY "Users can update their own documentation"
  ON compliance_documentation
  FOR UPDATE
  USING (auth.uid() = created_by);

-- Comments
COMMENT ON TABLE compliance_documentation IS 'Stores automatically generated compliance documentation for AI systems';
COMMENT ON COLUMN compliance_documentation.ai_system_id IS 'References the ID from eu_ai_act_check_results, mas_ai_risk_assessments, or uk_ai_assessments';
COMMENT ON COLUMN compliance_documentation.regulation_type IS 'The regulation this document is aligned with: EU AI Act, UK AI Act, or MAS';
COMMENT ON COLUMN compliance_documentation.version IS 'Document version (e.g., 1.0, 1.1, 2.0)';
COMMENT ON COLUMN compliance_documentation.status IS 'current: up-to-date, outdated: system data has changed';
COMMENT ON COLUMN compliance_documentation.generation_metadata IS 'JSON object storing metadata about what data was used to generate this document (for change detection)';
