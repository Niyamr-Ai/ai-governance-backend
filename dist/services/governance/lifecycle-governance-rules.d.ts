/**
 * Lifecycle Governance Rules
 *
 * Enforces lifecycle transition validation and compliance checks
 */
import type { LifecycleStage } from "./lifecycle-governance";
export type { LifecycleStage };
export interface LifecycleValidationResult {
    valid: boolean;
    reason?: string;
    warnings?: string[];
}
export interface SystemComplianceData {
    type: 'EU AI Act' | 'MAS' | 'UK AI Act';
    accountable_person?: string;
    owner?: string;
    safety_and_security?: any;
    transparency?: any;
    fairness?: any;
    governance?: any;
    contestability?: any;
}
export interface RiskAssessmentSummary {
    total: number;
    approved: number;
    submitted: number;
    draft: number;
}
/**
 * Validate lifecycle transition based on governance rules
 */
export declare function validateLifecycleTransition(currentStage: LifecycleStage, newStage: LifecycleStage, complianceData: SystemComplianceData | null, riskAssessmentSummary: RiskAssessmentSummary): Promise<LifecycleValidationResult>;
/**
 * Check if risk assessment edits are allowed based on lifecycle stage
 */
export declare function canEditRiskAssessment(lifecycleStage: LifecycleStage, assessmentStatus: 'draft' | 'submitted' | 'approved' | 'rejected'): boolean;
/**
 * Check if creating new risk assessments is allowed
 */
export declare function canCreateRiskAssessmentInStage(lifecycleStage: LifecycleStage): boolean;
/**
 * Get lifecycle-specific constraints message
 */
export declare function getLifecycleConstraints(lifecycleStage: LifecycleStage): string[];
//# sourceMappingURL=lifecycle-governance-rules.d.ts.map