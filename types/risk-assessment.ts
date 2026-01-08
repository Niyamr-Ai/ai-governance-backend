/**
 * Risk Assessment Types for AI Governance Platform
 * 
 * These types define the structure for risk assessments across
 * four categories: Bias & Fairness, Robustness & Performance,
 * Privacy & Data Leakage, and Explainability.
 */

export type RiskCategory = 'bias' | 'robustness' | 'privacy' | 'explainability';
export type RiskLevel = 'low' | 'medium' | 'high';
export type MitigationStatus = 'not_started' | 'in_progress' | 'mitigated';
export type AssessmentStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

/**
 * Base risk assessment interface
 */
export interface RiskAssessment {
  id: string;
  ai_system_id: string;
  category: RiskCategory;
  summary: string;
  metrics: Record<string, any>; // JSONB - category-specific metrics
  risk_level: RiskLevel;
  mitigation_status: MitigationStatus;
  status: AssessmentStatus; // Workflow status
  assessed_by: string | null;
  assessed_at: string;
  evidence_links: string[];
  reviewed_by: string | null; // Admin/compliance officer who reviewed
  reviewed_at: string | null; // When review was completed
  review_comment: string | null; // Reviewer's comment
  created_at: string;
  updated_at: string;
}

/**
 * Input for creating a new risk assessment
 */
export interface CreateRiskAssessmentInput {
  ai_system_id: string;
  category: RiskCategory;
  summary: string;
  metrics?: Record<string, any>;
  risk_level: RiskLevel;
  mitigation_status?: MitigationStatus;
  evidence_links?: string[];
  // Status always starts as 'draft' - not user-selectable
}

/**
 * Input for submitting an assessment for review
 */
export interface SubmitAssessmentInput {
  // No additional fields needed - just changes status from draft to submitted
}

/**
 * Input for approving/rejecting an assessment
 */
export interface ReviewAssessmentInput {
  review_comment?: string; // Optional comment from reviewer
}

/**
 * Input for updating an existing risk assessment
 */
export interface UpdateRiskAssessmentInput {
  summary?: string;
  metrics?: Record<string, any>;
  risk_level?: RiskLevel;
  mitigation_status?: MitigationStatus;
  evidence_links?: string[];
}

/**
 * Category-specific metric examples (for type safety and documentation)
 */
export interface BiasMetrics {
  demographic_parity?: number;
  equalized_odds?: number;
  calibration?: number;
  disparate_impact?: number;
  protected_attributes?: string[];
  bias_audit_date?: string;
}

export interface RobustnessMetrics {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1_score?: number;
  adversarial_robustness?: number;
  performance_on_edge_cases?: string;
  stress_test_results?: string;
}

export interface PrivacyMetrics {
  data_leakage_risk?: string;
  differential_privacy_epsilon?: number;
  anonymization_techniques?: string[];
  gdpr_compliance?: boolean;
  data_retention_policy?: string;
  access_controls?: string[];
}

export interface ExplainabilityMetrics {
  model_interpretability_score?: number;
  feature_importance_available?: boolean;
  explanation_method?: string;
  explanation_coverage?: number;
  user_understanding_score?: number;
  documentation_quality?: string;
}

/**
 * Overall risk level calculation result
 */
export interface OverallRiskLevel {
  level: RiskLevel;
  highest_category: RiskCategory | null;
  assessment_count: number;
  mitigated_count: number;
}
