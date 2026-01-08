/**
 * Automated Risk Scoring Engine
 *
 * Rules-based engine for calculating risk scores across 5 dimensions:
 * Technical, Operational, Legal/Regulatory, Ethical/Societal, Business
 */
import type { RiskDimensionScores, RiskDimensionWeights, DimensionDetails, RiskLevel } from "@/ai-governance-backend/types/automated-risk-assessment";
interface SystemData {
    compliance_status?: string;
    risk_tier?: string;
    prohibited_practices_detected?: boolean;
    high_risk_all_fulfilled?: boolean;
    high_risk_missing?: string[];
    transparency_required?: boolean;
    post_market_monitoring?: boolean;
    fria_completed?: boolean;
    lifecycle_stage?: string;
    approved_risk_assessments?: Array<{
        category: string;
        risk_level: string;
        mitigation_status: string;
    }>;
    sector?: string;
    accountable_person?: string;
    system_name?: string;
    _framework?: 'EU' | 'UK' | 'MAS';
    _original_risk_level?: string;
}
/**
 * Calculate all risk dimension scores
 */
export declare function calculateRiskScores(systemData: SystemData, weights?: Partial<RiskDimensionWeights>): {
    scores: RiskDimensionScores;
    compositeScore: number;
    overallRiskLevel: RiskLevel;
    dimensionDetails: DimensionDetails;
    finalWeights: RiskDimensionWeights;
};
export {};
//# sourceMappingURL=automated-risk-scoring.d.ts.map