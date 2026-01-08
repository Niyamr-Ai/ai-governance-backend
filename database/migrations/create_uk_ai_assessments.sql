-- Create UK AI Assessments table
-- This table stores assessments based on UK AI Regulatory Framework (5 core principles)
CREATE TABLE IF NOT EXISTS uk_ai_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Risk and Assessment
  risk_level TEXT CHECK (risk_level IN (
    'Frontier / High-Impact Model',
    'High-Risk (Sector)',
    'Medium-Risk',
    'Low-Risk'
  )),
  overall_assessment TEXT CHECK (overall_assessment IN (
    'Compliant',
    'Partially compliant',
    'Non-compliant'
  )),
  
  -- Principle Statuses (stored as JSONB)
  safety_and_security JSONB NOT NULL DEFAULT '{"meetsPrinciple": false, "missing": []}'::jsonb,
  transparency JSONB NOT NULL DEFAULT '{"meetsPrinciple": false, "missing": []}'::jsonb,
  fairness JSONB NOT NULL DEFAULT '{"meetsPrinciple": false, "missing": []}'::jsonb,
  governance JSONB NOT NULL DEFAULT '{"meetsPrinciple": false, "missing": []}'::jsonb,
  contestability JSONB NOT NULL DEFAULT '{"meetsPrinciple": false, "missing": []}'::jsonb,
  
  -- Sector Regulation
  sector_regulation JSONB NOT NULL DEFAULT '{"sector": "", "requiredControls": [], "gaps": []}'::jsonb,
  
  -- Summary and raw data
  summary TEXT,
  raw_answers JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_uk_ai_assessments_user_id ON uk_ai_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_uk_ai_assessments_risk_level ON uk_ai_assessments(risk_level);
CREATE INDEX IF NOT EXISTS idx_uk_ai_assessments_overall_assessment ON uk_ai_assessments(overall_assessment);
CREATE INDEX IF NOT EXISTS idx_uk_ai_assessments_created_at ON uk_ai_assessments(created_at DESC);
