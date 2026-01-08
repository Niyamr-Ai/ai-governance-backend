/**
 * Risk Assessment Utilities
 *
 * Helper functions for calculating overall risk levels and managing risk assessments.
 */
import type { RiskAssessment, RiskLevel, OverallRiskLevel } from "@/ai-governance-backend/types/risk-assessment";
/**
 * Calculate the overall risk level for an AI system based on its assessments.
 *
 * Governance Rule: Only APPROVED assessments count toward overall risk level
 * Overall risk = highest individual risk among APPROVED assessments
 *
 * @param assessments Array of risk assessments for the system
 * @returns Overall risk level with metadata
 */
export declare function calculateOverallRiskLevel(assessments: RiskAssessment[]): OverallRiskLevel;
/**
 * Get risk level badge styling classes
 */
export declare function getRiskLevelClasses(level: RiskLevel): string;
/**
 * Get category display label
 */
export declare function getCategoryLabel(category: string): string;
/**
 * Get mitigation status display label
 */
export declare function getMitigationStatusLabel(status: string): string;
//# sourceMappingURL=index.d.ts.map