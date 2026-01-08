// Policy Tracker Types

export type PolicyType = 'External' | 'Internal';
export type EnforcementLevel = 'Mandatory' | 'Advisory';
export type AppliesTo = 'All AI' | 'High-risk only' | 'Specific systems';
export type PolicyStatus = 'Active' | 'Draft' | 'Retired';
export type ComplianceStatus = 'Compliant' | 'Partially compliant' | 'Non-compliant' | 'Not assessed';
export type AppliesToScope = 'All AI' | 'High-risk' | 'User-facing' | 'Specific systems';

export interface Policy {
  id: string;
  name: string;
  policy_type: PolicyType;
  jurisdiction?: string | null;
  description?: string | null;
  summary?: string | null;
  version: string;
  
  // Internal Policy Specific
  owner?: string | null;
  enforcement_level?: EnforcementLevel | null;
  applies_to?: AppliesTo | null;
  effective_date?: string | null; // ISO date string
  status?: PolicyStatus | null;
  document_url?: string | null;
  
  // Metadata
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PolicyRequirement {
  id: string;
  policy_id: string;
  title: string;
  description?: string | null;
  requirement_code?: string | null;
  applies_to_scope: AppliesToScope;
  compliance_status: ComplianceStatus;
  notes?: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface SystemPolicyMapping {
  id: string;
  policy_id: string;
  ai_system_id: string;
  compliance_status: ComplianceStatus;
  assessed_by?: string | null;
  assessed_at?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RequirementCompliance {
  id: string;
  requirement_id: string;
  ai_system_id: string;
  compliance_status: ComplianceStatus;
  notes?: string | null;
  evidence_links?: string[] | null;
  linked_risk_ids?: string[] | null;
  assessed_by?: string | null;
  assessed_at?: string | null;
  created_at: string;
  updated_at: string;
}

// Extended types with relationships
export interface PolicyWithRequirements extends Policy {
  requirements?: PolicyRequirement[];
  overall_compliance_status?: ComplianceStatus;
}

export interface PolicyRequirementWithCompliance extends PolicyRequirement {
  system_compliance?: RequirementCompliance[];
}

// Input types for creating/updating
export interface CreateInternalPolicyInput {
  name: string;
  description?: string;
  summary?: string;        
  applies_to?: AppliesTo;
  enforcement_level?: EnforcementLevel;
  owner?: string;
  effective_date?: string;
  version?: string;
  document_url?: string;
}

export interface UpdatePolicyInput {
  name?: string;
  description?: string;
  summary?: string;        
  applies_to?: AppliesTo;
  enforcement_level?: EnforcementLevel;
  owner?: string;
  effective_date?: string;
  version?: string;
  status?: PolicyStatus;
  document_url?: string;
}


export interface CreatePolicyRequirementInput {
  policy_id: string;
  title: string;
  description?: string;
  requirement_code?: string;
  applies_to_scope?: AppliesToScope;
  display_order?: number;
}

export interface UpdatePolicyRequirementInput {
  title?: string;
  description?: string;
  requirement_code?: string;
  applies_to_scope?: AppliesToScope;
  compliance_status?: ComplianceStatus;
  notes?: string;
  display_order?: number;
}

export interface CreateSystemPolicyMappingInput {
  policy_id: string;
  ai_system_id: string;
  compliance_status?: ComplianceStatus;
  notes?: string;
}

export interface UpdateSystemPolicyMappingInput {
  compliance_status?: ComplianceStatus;
  notes?: string;
}

export interface CreateRequirementComplianceInput {
  requirement_id: string;
  ai_system_id: string;
  compliance_status?: ComplianceStatus;
  notes?: string;
  evidence_links?: string[];
  linked_risk_ids?: string[];
}

export interface UpdateRequirementComplianceInput {
  compliance_status?: ComplianceStatus;
  notes?: string;
  evidence_links?: string[];
  linked_risk_ids?: string[];
}

