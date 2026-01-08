-- Fix MAS table column names to preserve camelCase
-- This migration fixes the issue where PostgreSQL converts unquoted column names to lowercase
-- Run this AFTER dropping the existing table or if you need to fix an existing table

-- Option 1: If table doesn't exist yet, the create_mas_ai_risk_assessments.sql will handle it
-- Option 2: If table exists with wrong column names, drop and recreate:

DROP TABLE IF EXISTS mas_ai_risk_assessments CASCADE;

-- Now recreate with properly quoted column names
CREATE TABLE mas_ai_risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- System Profile
  system_name TEXT NOT NULL,
  description TEXT,
  owner TEXT,
  jurisdiction TEXT,
  sector TEXT,
  system_status TEXT CHECK (system_status IN ('development', 'staging', 'production', 'deprecated')) DEFAULT 'development',
  business_use_case TEXT,
  data_types TEXT,
  
  -- Data & Dependencies
  uses_personal_data BOOLEAN DEFAULT false,
  uses_special_category_data BOOLEAN DEFAULT false,
  uses_third_party_ai BOOLEAN DEFAULT false,
  
  -- MAS 12 Pillars (stored as JSONB)
  -- Column names are quoted to preserve camelCase for Supabase/PostgREST
  "governance" JSONB NOT NULL DEFAULT '{"status": "Partially compliant", "score": 0, "gaps": [], "recommendations": []}'::jsonb,
  "inventory" JSONB NOT NULL DEFAULT '{"status": "Partially compliant", "score": 0, "gaps": [], "recommendations": []}'::jsonb,
  "dataManagement" JSONB NOT NULL DEFAULT '{"status": "Partially compliant", "score": 0, "gaps": [], "recommendations": []}'::jsonb,
  "transparency" JSONB NOT NULL DEFAULT '{"status": "Partially compliant", "score": 0, "gaps": [], "recommendations": []}'::jsonb,
  "fairness" JSONB NOT NULL DEFAULT '{"status": "Partially compliant", "score": 0, "gaps": [], "recommendations": []}'::jsonb,
  "humanOversight" JSONB NOT NULL DEFAULT '{"status": "Partially compliant", "score": 0, "gaps": [], "recommendations": []}'::jsonb,
  "thirdParty" JSONB NOT NULL DEFAULT '{"status": "Partially compliant", "score": 0, "gaps": [], "recommendations": []}'::jsonb,
  "algoSelection" JSONB NOT NULL DEFAULT '{"status": "Partially compliant", "score": 0, "gaps": [], "recommendations": []}'::jsonb,
  "evaluationTesting" JSONB NOT NULL DEFAULT '{"status": "Partially compliant", "score": 0, "gaps": [], "recommendations": []}'::jsonb,
  "techCybersecurity" JSONB NOT NULL DEFAULT '{"status": "Partially compliant", "score": 0, "gaps": [], "recommendations": []}'::jsonb,
  "monitoringChange" JSONB NOT NULL DEFAULT '{"status": "Partially compliant", "score": 0, "gaps": [], "recommendations": []}'::jsonb,
  "capabilityCapacity" JSONB NOT NULL DEFAULT '{"status": "Partially compliant", "score": 0, "gaps": [], "recommendations": []}'::jsonb,
  
  -- Overall Assessment
  overall_risk_level TEXT CHECK (overall_risk_level IN ('Low', 'Medium', 'High', 'Critical')) DEFAULT 'Medium',
  overall_compliance_status TEXT CHECK (overall_compliance_status IN ('Compliant', 'Partially compliant', 'Non-compliant')) DEFAULT 'Partially compliant',
  summary TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_mas_ai_risk_assessments_user_id ON mas_ai_risk_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_mas_ai_risk_assessments_system_name ON mas_ai_risk_assessments(system_name);
CREATE INDEX IF NOT EXISTS idx_mas_ai_risk_assessments_overall_risk_level ON mas_ai_risk_assessments(overall_risk_level);
CREATE INDEX IF NOT EXISTS idx_mas_ai_risk_assessments_overall_compliance_status ON mas_ai_risk_assessments(overall_compliance_status);
CREATE INDEX IF NOT EXISTS idx_mas_ai_risk_assessments_created_at ON mas_ai_risk_assessments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mas_ai_risk_assessments_sector ON mas_ai_risk_assessments(sector);
