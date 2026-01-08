/**
 * Risk Assessment Guidance Service
 *
 * Provides RAG-powered contextual help and guidance for risk assessment forms.
 * Combines Platform RAG (for process guidance) and Regulation RAG (for compliance context).
 */
import { type RegulationType } from '../ai/rag-service';
export type RiskCategory = 'bias' | 'robustness' | 'privacy' | 'explainability';
export type RiskLevel = 'low' | 'medium' | 'high';
/**
 * Risk category information with descriptions
 */
export declare const RISK_CATEGORIES: {
    readonly bias: {
        readonly title: "Bias & Fairness";
        readonly description: "Assesses potential discrimination, unfair treatment, or biased outcomes across different groups or individuals.";
        readonly examples: readonly ["Demographic parity", "Equal opportunity", "Calibration", "Individual fairness"];
    };
    readonly robustness: {
        readonly title: "Robustness & Performance";
        readonly description: "Evaluates system reliability, accuracy, and resilience to adversarial inputs or edge cases.";
        readonly examples: readonly ["Adversarial robustness", "Performance consistency", "Error handling", "Edge case behavior"];
    };
    readonly privacy: {
        readonly title: "Privacy & Data Leakage";
        readonly description: "Identifies risks related to personal data protection, information leakage, and privacy violations.";
        readonly examples: readonly ["Data minimization", "Anonymization effectiveness", "Inference attacks", "Re-identification risks"];
    };
    readonly explainability: {
        readonly title: "Explainability";
        readonly description: "Assesses the system's ability to provide understandable explanations for its decisions and outputs.";
        readonly examples: readonly ["Feature importance", "Decision transparency", "Counterfactual explanations", "Model interpretability"];
    };
};
/**
 * Risk level guidance
 */
export declare const RISK_LEVEL_GUIDANCE: {
    readonly low: {
        readonly description: "Minimal risk with limited potential for harm. Standard monitoring sufficient.";
        readonly requirements: "Basic documentation and periodic review.";
        readonly examples: "Minor performance variations, low-stakes decisions";
    };
    readonly medium: {
        readonly description: "Moderate risk requiring active management and mitigation measures.";
        readonly requirements: "Detailed mitigation plan, regular monitoring, evidence documentation.";
        readonly examples: "Moderate bias detected, performance degradation in some scenarios";
    };
    readonly high: {
        readonly description: "Significant risk requiring immediate attention and comprehensive mitigation.";
        readonly requirements: "Comprehensive mitigation strategy, continuous monitoring, evidence links mandatory, stakeholder approval.";
        readonly examples: "Severe bias, safety-critical failures, privacy breaches";
    };
};
/**
 * Guidance context for risk assessments
 */
export interface RiskAssessmentGuidance {
    categoryGuidance: string;
    regulatoryContext: string;
    platformGuidance: string;
    riskLevelGuidance: string;
    bestPractices: string[];
    commonPitfalls: string[];
}
/**
 * Get comprehensive guidance for a risk assessment
 *
 * @param category - Risk category (bias, robustness, privacy, explainability)
 * @param riskLevel - Risk level (low, medium, high) - optional
 * @param regulationType - Regulation type for context (EU, UK, MAS) - optional
 * @param systemContext - Additional system context - optional
 * @returns Comprehensive guidance combining Platform RAG and Regulation RAG
 */
export declare function getRiskAssessmentGuidance(category: RiskCategory, riskLevel?: RiskLevel, regulationType?: RegulationType, systemContext?: string): Promise<RiskAssessmentGuidance>;
/**
 * Get quick help text for a specific field
 *
 * @param field - Field name (summary, risk_level, evidence_links, etc.)
 * @param category - Risk category
 * @param riskLevel - Current risk level
 * @returns Quick help text
 */
export declare function getFieldGuidance(field: string, category: RiskCategory, riskLevel?: RiskLevel): Promise<string>;
//# sourceMappingURL=guidance.d.ts.map