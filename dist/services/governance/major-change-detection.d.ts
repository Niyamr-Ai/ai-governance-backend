/**
 * Major Change Detection
 *
 * Detects significant changes in compliance assessment data that warrant
 * a new automated risk assessment.
 */
interface ComplianceData {
    compliance_status?: string;
    risk_tier?: string;
    prohibited_practices_detected?: boolean;
    high_risk_all_fulfilled?: boolean;
    high_risk_missing?: string[];
    lifecycle_stage?: string;
    post_market_monitoring?: boolean;
    fria_completed?: boolean;
}
interface PreviousComplianceData extends ComplianceData {
    updated_at?: string;
}
/**
 * Detect if changes are significant enough to trigger a new risk assessment
 */
export declare function detectMajorChange(oldData: PreviousComplianceData | null, newData: ComplianceData): boolean;
/**
 * Auto-trigger automated risk assessment if major change detected
 */
export declare function autoTriggerRiskAssessmentIfMajorChange(systemId: string, oldData: PreviousComplianceData | null, newData: ComplianceData): Promise<void>;
export {};
//# sourceMappingURL=major-change-detection.d.ts.map