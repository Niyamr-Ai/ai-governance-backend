-- Add Organization-based Tenant Isolation
-- This migration introduces org_id columns for organization-centric multi-tenancy
-- Initially maps org_id 1:1 to user_id for backwards compatibility

-- Add org_id to ai_system_registry
ALTER TABLE ai_system_registry
ADD COLUMN IF NOT EXISTS org_id UUID;

-- Add org_id to risk_assessments
ALTER TABLE risk_assessments
ADD COLUMN IF NOT EXISTS org_id UUID;

-- Add org_id to automated_risk_assessments
ALTER TABLE automated_risk_assessments
ADD COLUMN IF NOT EXISTS org_id UUID;

-- Add org_id to governance_tasks
ALTER TABLE governance_tasks
ADD COLUMN IF NOT EXISTS org_id UUID;

-- Add org_id to red_teaming_results
ALTER TABLE red_teaming_results
ADD COLUMN IF NOT EXISTS org_id UUID;

-- Add org_id to compliance_documentation
ALTER TABLE compliance_documentation
ADD COLUMN IF NOT EXISTS org_id UUID;

-- Add org_id to discovered_ai_assets
ALTER TABLE discovered_ai_assets
ADD COLUMN IF NOT EXISTS org_id UUID;

-- Add org_id to policies
ALTER TABLE policies
ADD COLUMN IF NOT EXISTS org_id UUID;

-- Add org_id to mas_ai_risk_assessments
ALTER TABLE mas_ai_risk_assessments
ADD COLUMN IF NOT EXISTS org_id UUID;

-- Add org_id to uk_ai_assessments
ALTER TABLE uk_ai_assessments
ADD COLUMN IF NOT EXISTS org_id UUID;

-- Backfill existing rows with org_id = user_id mapping
-- This maintains backwards compatibility while introducing org-based isolation

-- Backfill ai_system_registry (no user_id column, skip for now)
-- Note: ai_system_registry may need manual org_id assignment or different logic

-- Backfill risk_assessments
UPDATE risk_assessments
SET org_id = assessed_by
WHERE org_id IS NULL AND assessed_by IS NOT NULL;

-- Backfill automated_risk_assessments
UPDATE automated_risk_assessments
SET org_id = assessed_by
WHERE org_id IS NULL AND assessed_by IS NOT NULL;

-- Backfill governance_tasks (no user column, skip for now)
-- Note: governance_tasks are system-level and may need different org_id assignment logic

-- Backfill red_teaming_results
UPDATE red_teaming_results
SET org_id = tested_by
WHERE org_id IS NULL AND tested_by IS NOT NULL;

-- Backfill compliance_documentation
UPDATE compliance_documentation
SET org_id = created_by
WHERE org_id IS NULL AND created_by IS NOT NULL;

-- Backfill discovered_ai_assets
UPDATE discovered_ai_assets
SET org_id = created_by
WHERE org_id IS NULL AND created_by IS NOT NULL;

-- Backfill policies
UPDATE policies
SET org_id = created_by
WHERE org_id IS NULL AND created_by IS NOT NULL;

-- Backfill mas_ai_risk_assessments
UPDATE mas_ai_risk_assessments
SET org_id = user_id
WHERE org_id IS NULL AND user_id IS NOT NULL;

-- Backfill uk_ai_assessments
UPDATE uk_ai_assessments
SET org_id = user_id
WHERE org_id IS NULL AND user_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN ai_system_registry.org_id IS 'Organization ID for tenant isolation. Currently maps 1:1 to user_id.';
COMMENT ON COLUMN risk_assessments.org_id IS 'Organization ID for tenant isolation. Currently maps 1:1 to user_id.';
COMMENT ON COLUMN automated_risk_assessments.org_id IS 'Organization ID for tenant isolation. Currently maps 1:1 to user_id.';
COMMENT ON COLUMN governance_tasks.org_id IS 'Organization ID for tenant isolation. Currently maps 1:1 to user_id.';
COMMENT ON COLUMN red_teaming_results.org_id IS 'Organization ID for tenant isolation. Currently maps 1:1 to user_id.';
COMMENT ON COLUMN compliance_documentation.org_id IS 'Organization ID for tenant isolation. Currently maps 1:1 to user_id.';
COMMENT ON COLUMN discovered_ai_assets.org_id IS 'Organization ID for tenant isolation. Currently maps 1:1 to user_id.';
COMMENT ON COLUMN policies.org_id IS 'Organization ID for tenant isolation. Currently maps 1:1 to user_id.';
COMMENT ON COLUMN mas_ai_risk_assessments.org_id IS 'Organization ID for tenant isolation. Currently maps 1:1 to user_id.';
COMMENT ON COLUMN uk_ai_assessments.org_id IS 'Organization ID for tenant isolation. Currently maps 1:1 to user_id.';
