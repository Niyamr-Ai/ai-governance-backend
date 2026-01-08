/**
 * Lifecycle Governance Utilities
 *
 * Provides logic for lifecycle stage warnings and recommendations
 */
export type LifecycleStage = 'Draft' | 'Development' | 'Testing' | 'Deployed' | 'Monitoring' | 'Retired';
export interface LifecycleWarning {
    type: 'info' | 'warning' | 'error';
    message: string;
    action?: string;
}
/**
 * Get lifecycle warnings based on current stage and system state
 */
export declare function getLifecycleWarnings(lifecycleStage: LifecycleStage, hasApprovedRiskAssessments: boolean, riskAssessmentCount: number): LifecycleWarning[];
/**
 * Check if lifecycle stage allows editing
 */
export declare function canEditInLifecycleStage(stage: LifecycleStage): boolean;
/**
 * Check if lifecycle stage allows creating risk assessments
 */
export declare function canCreateRiskAssessment(stage: LifecycleStage): boolean;
//# sourceMappingURL=lifecycle-governance.d.ts.map