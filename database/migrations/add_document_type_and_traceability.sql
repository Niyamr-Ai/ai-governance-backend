-- Add document_type and traceability fields to compliance_documentation table
-- This extends the existing table to support multiple document types and version tracking

-- Add document_type column
ALTER TABLE compliance_documentation 
ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT 'Compliance Summary' 
CHECK (document_type IN (
  'AI System Card',
  'Technical Documentation',
  'Data Protection Impact Assessment',
  'Risk Assessment Report',
  'Algorithm Impact Assessment',
  'Audit Trail',
  'Compliance Summary'
));

-- Add traceability fields
ALTER TABLE compliance_documentation 
ADD COLUMN IF NOT EXISTS ai_system_version TEXT,
ADD COLUMN IF NOT EXISTS risk_assessment_version TEXT,
ADD COLUMN IF NOT EXISTS regulation_version TEXT;

-- Add status 'requires_regeneration' to existing status check
-- First, drop the existing constraint
ALTER TABLE compliance_documentation 
DROP CONSTRAINT IF EXISTS compliance_documentation_status_check;

-- Add new constraint with additional status
ALTER TABLE compliance_documentation 
ADD CONSTRAINT compliance_documentation_status_check 
CHECK (status IN ('current', 'outdated', 'requires_regeneration'));

-- Create index for document_type for better query performance
CREATE INDEX IF NOT EXISTS idx_compliance_documentation_document_type 
ON compliance_documentation(document_type);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_compliance_documentation_system_type_regulation 
ON compliance_documentation(ai_system_id, document_type, regulation_type);

-- Comments
COMMENT ON COLUMN compliance_documentation.document_type IS 'Type of document: AI System Card, Technical Documentation, DPIA, Risk Assessment Report, Algorithm Impact Assessment, Audit Trail, or Compliance Summary';
COMMENT ON COLUMN compliance_documentation.ai_system_version IS 'Version of the AI system when this document was generated';
COMMENT ON COLUMN compliance_documentation.risk_assessment_version IS 'Version of the risk assessment used to generate this document';
COMMENT ON COLUMN compliance_documentation.regulation_version IS 'Version of the regulation framework used (if applicable)';

