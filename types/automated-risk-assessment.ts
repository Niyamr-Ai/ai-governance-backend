/**
 * Automated Risk Assessment Types
 * 
 * Types for the automated risk assessment feature that generates
 * comprehensive risk reports using AI analysis.
 */

export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export type TriggerType = 'registration' | 'major_change' | 'periodic_review' | 'manual';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'needs_revision';

export interface RiskDimensionScores {
  technical: number; // 1-10
  operational: number; // 1-10
  legal_regulatory: number; // 1-10
  ethical_societal: number; // 1-10
  business: number; // 1-10
}

export interface RiskDimensionWeights {
  technical: number;
  operational: number;
  legal_regulatory: number;
  ethical_societal: number;
  business: number;
}

export interface DimensionDetail {
  score: number;
  rationale: string;
  key_findings: string[];
  compliance_gaps: string[];
  recommendations: string[];
}

export interface DimensionDetails {
  technical: DimensionDetail;
  operational: DimensionDetail;
  legal_regulatory: DimensionDetail;
  ethical_societal: DimensionDetail;
  business: DimensionDetail;
}

export interface ComplianceChecklistItem {
  id: string;
  category: string;
  item: string;
  status: 'compliant' | 'non_compliant' | 'needs_review';
  evidence?: string;
  regulation_reference?: string;
}

export interface RemediationAction {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  action: string;
  dimension: keyof RiskDimensionScores;
  timeline: string;
  responsible_party?: string;
}

export interface AutomatedRiskAssessment {
  id: string;
  ai_system_id: string;
  
  // Scores
  technical_risk_score: number;
  operational_risk_score: number;
  legal_regulatory_risk_score: number;
  ethical_societal_risk_score: number;
  business_risk_score: number;
  composite_score: number;
  overall_risk_level: RiskLevel;
  
  // Weights
  weights: RiskDimensionWeights;
  
  // Detailed Analysis
  dimension_details: DimensionDetails;
  
  // Report Content
  executive_summary: string;
  detailed_findings: string;
  compliance_checklist: ComplianceChecklistItem[];
  remediation_plan: string;
  re_assessment_timeline?: string;
  
  // Metadata
  assessed_at: string;
  assessed_by: string | null;
  trigger_type: TriggerType;
  data_sources: {
    compliance_assessments?: string[];
    risk_assessments?: string[];
    system_metadata?: boolean;
    questionnaire_responses?: boolean;
  };
  
  // Approval Workflow
  approval_status?: ApprovalStatus;
  approved_by?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  reviewer_notes?: string | null;
  
  // Monitoring
  next_review_date?: string | null;
  review_frequency_months?: number;
  monitoring_enabled?: boolean;
  last_monitored_at?: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface CreateAutomatedRiskAssessmentInput {
  ai_system_id: string;
  trigger_type: TriggerType;
  weights?: Partial<RiskDimensionWeights>;
}

export interface RiskAssessmentReport {
  assessment: AutomatedRiskAssessment;
  heatmap_data: {
    dimension: string;
    score: number;
    level: RiskLevel;
  }[];
}

