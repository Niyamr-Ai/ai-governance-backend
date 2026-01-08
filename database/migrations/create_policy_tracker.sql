-- Create Policy Tracker tables
-- This migration creates tables for tracking external and internal AI policies
-- and mapping them to AI systems

-- 1. Policies table (stores both external and internal policies)
CREATE TABLE IF NOT EXISTS policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Policy Identification
  name TEXT NOT NULL,
  policy_type TEXT NOT NULL CHECK (policy_type IN ('External', 'Internal')),
  jurisdiction TEXT, -- For external policies (e.g., 'EU', 'UK', 'Singapore')
  
  -- Policy Details
  description TEXT,
  summary TEXT,
  version TEXT DEFAULT '1.0',
  
  -- Internal Policy Specific Fields
  owner TEXT, -- Policy owner (team or role)
  enforcement_level TEXT CHECK (enforcement_level IN ('Mandatory', 'Advisory')) DEFAULT 'Mandatory',
  applies_to TEXT CHECK (applies_to IN ('All AI', 'High-risk only', 'Specific systems')) DEFAULT 'All AI',
  effective_date DATE,
  status TEXT CHECK (status IN ('Active', 'Draft', 'Retired')) DEFAULT 'Active',
  
  -- Document Storage
  document_url TEXT, -- URL to uploaded PDF/DOC
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint to prevent duplicate external policies
-- For external policies: name + policy_type + jurisdiction must be unique
-- For internal policies: we allow duplicate names (they can be versioned)
-- Note: Using a partial unique index for external policies only
CREATE UNIQUE INDEX IF NOT EXISTS unique_external_policy 
ON policies (name, policy_type, jurisdiction) 
WHERE policy_type = 'External';

-- 2. Policy Requirements table (structured requirements for each policy)
CREATE TABLE IF NOT EXISTS policy_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  
  -- Requirement Details
  title TEXT NOT NULL,
  description TEXT,
  requirement_code TEXT, -- Optional code/identifier (e.g., "EU-AIA-001")
  
  -- Scope
  applies_to_scope TEXT CHECK (applies_to_scope IN ('All AI', 'High-risk', 'User-facing', 'Specific systems')) DEFAULT 'All AI',
  
  -- Compliance Tracking
  compliance_status TEXT CHECK (compliance_status IN ('Compliant', 'Partially compliant', 'Non-compliant', 'Not assessed')) DEFAULT 'Not assessed',
  notes TEXT, -- Manual notes/justification
  
  -- Ordering
  display_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. System Policy Mapping table (maps policies to AI systems)
CREATE TABLE IF NOT EXISTS system_policy_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  ai_system_id UUID NOT NULL, -- References any AI system (flexible, no FK constraint)
  
  -- Compliance Status for this specific system-policy combination
  compliance_status TEXT CHECK (compliance_status IN ('Compliant', 'Partially compliant', 'Non-compliant', 'Not assessed')) DEFAULT 'Not assessed',
  
  -- Assessment Metadata
  assessed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assessed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one mapping per policy-system combination
  UNIQUE(policy_id, ai_system_id)
);

-- 4. Requirement Compliance table (tracks compliance at requirement level per system)
CREATE TABLE IF NOT EXISTS requirement_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID NOT NULL REFERENCES policy_requirements(id) ON DELETE CASCADE,
  ai_system_id UUID NOT NULL,
  
  -- Compliance Details
  compliance_status TEXT CHECK (compliance_status IN ('Compliant', 'Partially compliant', 'Non-compliant', 'Not assessed')) DEFAULT 'Not assessed',
  notes TEXT,
  evidence_links TEXT[], -- Array of URLs/files
  
  -- Linked Risks (optional)
  linked_risk_ids UUID[], -- Array of risk assessment IDs
  
  -- Assessment Metadata
  assessed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assessed_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one compliance record per requirement-system combination
  UNIQUE(requirement_id, ai_system_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_policies_type ON policies(policy_type);
CREATE INDEX IF NOT EXISTS idx_policies_jurisdiction ON policies(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
CREATE INDEX IF NOT EXISTS idx_policies_created_by ON policies(created_by);

CREATE INDEX IF NOT EXISTS idx_policy_requirements_policy_id ON policy_requirements(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_requirements_compliance_status ON policy_requirements(compliance_status);

CREATE INDEX IF NOT EXISTS idx_system_policy_mappings_policy_id ON system_policy_mappings(policy_id);
CREATE INDEX IF NOT EXISTS idx_system_policy_mappings_ai_system_id ON system_policy_mappings(ai_system_id);
CREATE INDEX IF NOT EXISTS idx_system_policy_mappings_compliance_status ON system_policy_mappings(compliance_status);

CREATE INDEX IF NOT EXISTS idx_requirement_compliance_requirement_id ON requirement_compliance(requirement_id);
CREATE INDEX IF NOT EXISTS idx_requirement_compliance_ai_system_id ON requirement_compliance(ai_system_id);
CREATE INDEX IF NOT EXISTS idx_requirement_compliance_status ON requirement_compliance(compliance_status);

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-update updated_at
DROP TRIGGER IF EXISTS update_policies_updated_at ON policies;
CREATE TRIGGER update_policies_updated_at
BEFORE UPDATE ON policies
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_policy_requirements_updated_at ON policy_requirements;
CREATE TRIGGER update_policy_requirements_updated_at
BEFORE UPDATE ON policy_requirements
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_system_policy_mappings_updated_at ON system_policy_mappings;
CREATE TRIGGER update_system_policy_mappings_updated_at
BEFORE UPDATE ON system_policy_mappings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_requirement_compliance_updated_at ON requirement_compliance;
CREATE TRIGGER update_requirement_compliance_updated_at
BEFORE UPDATE ON requirement_compliance
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_policy_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirement_compliance ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view all policies" ON policies;
DROP POLICY IF EXISTS "Authenticated users can create internal policies" ON policies;
DROP POLICY IF EXISTS "Users can update their own policies or admins can update any" ON policies;
DROP POLICY IF EXISTS "Only admins can delete policies" ON policies;
DROP POLICY IF EXISTS "Users can view all policy requirements" ON policy_requirements;
DROP POLICY IF EXISTS "Authenticated users can manage requirements" ON policy_requirements;
DROP POLICY IF EXISTS "Users can view all system policy mappings" ON system_policy_mappings;
DROP POLICY IF EXISTS "Authenticated users can manage system policy mappings" ON system_policy_mappings;
DROP POLICY IF EXISTS "Users can view all requirement compliance records" ON requirement_compliance;
DROP POLICY IF EXISTS "Authenticated users can manage requirement compliance" ON requirement_compliance;

-- RLS Policies: Users can view all policies
CREATE POLICY "Users can view all policies"
ON policies
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- RLS Policies: Authenticated users can create internal policies
CREATE POLICY "Authenticated users can create internal policies"
ON policies
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND policy_type = 'Internal'
);

-- RLS Policies: Users can update policies they created (or admins)
CREATE POLICY "Users can update their own policies or admins can update any"
ON policies
FOR UPDATE
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'role' = 'Admin')
  )
);

-- RLS Policies: Only admins can delete policies
CREATE POLICY "Only admins can delete policies"
ON policies
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'role' = 'Admin')
  )
);

-- RLS Policies: Users can view all policy requirements
CREATE POLICY "Users can view all policy requirements"
ON policy_requirements
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- RLS Policies: Authenticated users can create/update requirements (for internal policies)
CREATE POLICY "Authenticated users can manage requirements"
ON policy_requirements
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies: Users can view all system policy mappings
CREATE POLICY "Users can view all system policy mappings"
ON system_policy_mappings
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- RLS Policies: Authenticated users can create/update mappings
CREATE POLICY "Authenticated users can manage system policy mappings"
ON system_policy_mappings
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies: Users can view all requirement compliance records
CREATE POLICY "Users can view all requirement compliance records"
ON requirement_compliance
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- RLS Policies: Authenticated users can create/update compliance records
CREATE POLICY "Authenticated users can manage requirement compliance"
ON requirement_compliance
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Clean up any duplicate external policies (keep the oldest one)
-- This runs before the unique index is created
DO $$
BEGIN
  DELETE FROM policies p1
  WHERE p1.policy_type = 'External'
  AND EXISTS (
    SELECT 1 FROM policies p2
    WHERE p2.policy_type = 'External'
    AND p2.name = p1.name
    AND COALESCE(p2.jurisdiction, '') = COALESCE(p1.jurisdiction, '')
    AND p2.created_at < p1.created_at
  );
END $$;

-- Insert preloaded external policies (only if they don't already exist)
INSERT INTO policies (name, policy_type, jurisdiction, description, summary, version, status)
SELECT 'EU AI Act', 'External', 'EU', 
 'The European Union Artificial Intelligence Act is a comprehensive regulatory framework for AI systems.',
 'The EU AI Act establishes rules for AI systems placed on the market or put into service in the EU, categorizing systems by risk level and imposing obligations accordingly.',
 '1.0', 'Active'
WHERE NOT EXISTS (
  SELECT 1 FROM policies 
  WHERE name = 'EU AI Act' 
  AND policy_type = 'External' 
  AND jurisdiction = 'EU'
);

INSERT INTO policies (name, policy_type, jurisdiction, description, summary, version, status)
SELECT 'UK AI Regulatory Framework', 'External', 'UK',
 'The UK AI Regulatory Framework provides principles-based guidance for AI governance.',
 'The UK framework focuses on five key principles: safety, security and robustness; transparency and explainability; fairness; accountability and governance; and contestability and redress.',
 '1.0', 'Active'
WHERE NOT EXISTS (
  SELECT 1 FROM policies 
  WHERE name = 'UK AI Regulatory Framework' 
  AND policy_type = 'External' 
  AND jurisdiction = 'UK'
);

INSERT INTO policies (name, policy_type, jurisdiction, description, summary, version, status)
SELECT 'MAS AI / FEAT Guidelines', 'External', 'Singapore',
 'Monetary Authority of Singapore AI and Fairness, Ethics, Accountability and Transparency (FEAT) Guidelines.',
 'MAS FEAT Guidelines provide principles and best practices for the responsible use of AI and machine learning in financial services.',
 '1.0', 'Active'
WHERE NOT EXISTS (
  SELECT 1 FROM policies 
  WHERE name = 'MAS AI / FEAT Guidelines' 
  AND policy_type = 'External' 
  AND jurisdiction = 'Singapore'
);

-- Add comments for documentation
COMMENT ON TABLE policies IS 'Stores both external (preloaded) and internal (user-created) AI policies';
COMMENT ON TABLE policy_requirements IS 'Structured requirements for each policy with compliance tracking';
COMMENT ON TABLE system_policy_mappings IS 'Maps policies to AI systems with system-specific compliance status';
COMMENT ON TABLE requirement_compliance IS 'Tracks compliance at the requirement level for each AI system';

