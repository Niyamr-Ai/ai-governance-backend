import type { AutomatedRiskAssessment, RiskLevel, RiskDimensionScores } from "../../types/automated-risk-assessment";
export interface ContextualRiskAssessment extends Omit<AutomatedRiskAssessment, 'id' | 'assessed_at' | 'created_at' | 'updated_at'> {
    context_sources: {
        regulation_context_quality: 'high' | 'medium' | 'low';
        platform_context_quality: 'high' | 'medium' | 'low';
        system_context_quality: 'high' | 'medium' | 'low';
    };
    risk_factor_analysis: {
        regulation_specific_risks: string[];
        industry_best_practice_gaps: string[];
        system_specific_vulnerabilities: string[];
    };
    enhanced_recommendations: {
        priority: 'immediate' | 'high' | 'medium' | 'low';
        category: 'technical' | 'operational' | 'legal_regulatory' | 'ethical_societal' | 'business';
        action: string;
        rationale: string;
        regulatory_basis: string;
        estimated_effort: 'low' | 'medium' | 'high';
        success_metrics: string[];
    }[];
}
export interface RiskMitigationSuggestion {
    risk_factor: string;
    risk_category: 'technical' | 'operational' | 'legal_regulatory' | 'ethical_societal' | 'business';
    severity: 'low' | 'medium' | 'high' | 'critical';
    mitigation_strategies: {
        strategy: string;
        implementation_approach: string;
        regulatory_alignment: string;
        effort_estimate: 'low' | 'medium' | 'high';
        timeline: string;
        success_indicators: string[];
    }[];
    regulatory_requirements: string[];
    industry_best_practices: string[];
}
export interface RiskTrendAnalysis {
    system_id: string;
    historical_assessments: {
        assessment_date: string;
        overall_risk_level: RiskLevel;
        composite_score: number;
        key_changes: string[];
    }[];
    trend_direction: 'improving' | 'stable' | 'deteriorating';
    trend_confidence: number;
    risk_drivers: {
        factor: string;
        impact: 'positive' | 'negative';
        magnitude: 'low' | 'medium' | 'high';
        trend: 'increasing' | 'stable' | 'decreasing';
    }[];
    predictions: {
        next_review_risk_level: RiskLevel;
        confidence: number;
        key_factors: string[];
    };
    recommendations: {
        priority: 'immediate' | 'high' | 'medium' | 'low';
        action: string;
        rationale: string;
    }[];
}
/**
 * Generate contextual risk assessment using all three RAG sources
 */
export declare function generateContextualRiskAssessment(systemData: {
    id: string;
    name: string;
    description?: string;
    risk_tier?: string;
    lifecycle_stage?: string;
    regulation_type?: string;
    compliance_status?: string;
    [key: string]: any;
}, userId: string, organizationHistory?: {
    previous_assessments: Array<{
        date: string;
        risk_level: RiskLevel;
        key_findings: string[];
    }>;
    industry_benchmarks?: {
        average_risk_score: number;
        common_risk_factors: string[];
    };
}): Promise<ContextualRiskAssessment>;
/**
 * Suggest intelligent risk mitigation strategies using RAG context
 */
export declare function suggestRiskMitigations(riskFactors: Array<{
    factor: string;
    category: 'technical' | 'operational' | 'legal_regulatory' | 'ethical_societal' | 'business';
    severity: 'low' | 'medium' | 'high' | 'critical';
}>, systemContext: {
    id: string;
    name: string;
    risk_level: string;
    regulation_type: string;
}, userId: string): Promise<RiskMitigationSuggestion[]>;
/**
 * Analyze risk trends using historical data and RAG context
 */
export declare function analyzeRiskTrends(systemId: string, systemHistory: Array<{
    assessment_date: string;
    overall_risk_level: RiskLevel;
    composite_score: number;
    dimension_scores: RiskDimensionScores;
    key_changes: string[];
}>, industryBenchmarks?: {
    average_risk_score: number;
    trend_direction: 'improving' | 'stable' | 'deteriorating';
    common_factors: string[];
}, userId?: string): Promise<RiskTrendAnalysis>;
//# sourceMappingURL=smart-assessment.d.ts.map