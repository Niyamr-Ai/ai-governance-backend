-- Phase 2: Regulatory Compliance Mapping
-- Note: run this in Supabase SQL editor or CLI. Assumes extensions (pgcrypto/gen_random_uuid) are available.

-- A. ai_system_registry (Phase 1 prerequisite, normalized to required columns)
CREATE TABLE IF NOT EXISTS ai_system_registry (
  system_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner TEXT,
  status TEXT CHECK (status IN ('development', 'staging', 'production')),
  jurisdiction TEXT,
  use_case TEXT,
  risk_tier TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- B. regulatory_mapping (Phase 2)
CREATE TABLE IF NOT EXISTS regulatory_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id UUID NOT NULL REFERENCES ai_system_registry(system_id) ON DELETE CASCADE,
  applicable_regulations TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  requirements JSONB NOT NULL DEFAULT '{}'::jsonb,
  gaps JSONB NOT NULL DEFAULT '{}'::jsonb,
  compliance_score FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- indexes
CREATE INDEX IF NOT EXISTS idx_ai_system_registry_owner ON ai_system_registry(owner);
CREATE INDEX IF NOT EXISTS idx_ai_system_registry_status ON ai_system_registry(status);
CREATE INDEX IF NOT EXISTS idx_ai_system_registry_risk ON ai_system_registry(risk_tier);
CREATE INDEX IF NOT EXISTS idx_ai_system_registry_jurisdiction ON ai_system_registry(jurisdiction);

CREATE INDEX IF NOT EXISTS idx_regulatory_mapping_system ON regulatory_mapping(system_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_mapping_created ON regulatory_mapping(created_at DESC);

-- trigger to maintain updated_at on ai_system_registry
CREATE OR REPLACE FUNCTION trg_ai_system_registry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ai_system_registry_updated_at ON ai_system_registry;
CREATE TRIGGER trg_ai_system_registry_updated_at
BEFORE UPDATE ON ai_system_registry
FOR EACH ROW
EXECUTE FUNCTION trg_ai_system_registry_updated_at();

-- RLS (enable and set permissive policies; tighten later as needed)
ALTER TABLE ai_system_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_mapping ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_system_registry' AND policyname = 'all_ai_system_registry_access'
  ) THEN
    CREATE POLICY all_ai_system_registry_access
    ON ai_system_registry
    USING (true)
    WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'regulatory_mapping' AND policyname = 'all_regulatory_mapping_access'
  ) THEN
    CREATE POLICY all_regulatory_mapping_access
    ON regulatory_mapping
    USING (true)
    WITH CHECK (true);
  END IF;
END;
$$;
