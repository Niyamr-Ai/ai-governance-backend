import type { DiscoveredAIAsset } from "../../types/discovery";
export interface ShadowAIAssessment {
    asset_id: string;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    shadow_probability: number;
    regulatory_concerns: string[];
    classification: {
        system_type: string;
        use_case: string;
        data_sensitivity: 'low' | 'medium' | 'high';
        user_facing: boolean;
    };
    compliance_gaps: {
        regulation: 'EU' | 'UK' | 'MAS';
        missing_requirements: string[];
        severity: 'low' | 'medium' | 'high';
    }[];
    recommended_actions: {
        priority: 'immediate' | 'high' | 'medium' | 'low';
        action: string;
        rationale: string;
    }[];
    confidence_score: number;
}
export interface SystemLinkSuggestion {
    existing_system_id: string;
    system_name: string;
    similarity_score: number;
    matching_factors: string[];
    confidence: 'high' | 'medium' | 'low';
    rationale: string;
}
export interface DiscoveryPrioritization {
    asset_id: string;
    priority_score: number;
    priority_level: 'critical' | 'high' | 'medium' | 'low';
    risk_factors: string[];
    business_impact: string;
    urgency_rationale: string;
}
/**
 * Generate comprehensive Shadow AI assessment using all three RAG sources
 */
export declare function generateShadowAIAssessment(asset: DiscoveredAIAsset, userId: string, organizationContext?: {
    existing_systems: Array<{
        id: string;
        name: string;
        description: string;
        risk_level: string;
    }>;
    compliance_focus: 'EU' | 'UK' | 'MAS';
}): Promise<ShadowAIAssessment>;
/**
 * Suggest links to existing systems using User System RAG
 */
export declare function suggestSystemLinks(asset: DiscoveredAIAsset, userId: string, maxSuggestions?: number): Promise<SystemLinkSuggestion[]>;
/**
 * Prioritize discovered systems based on risk and business impact
 */
export declare function prioritizeDiscoveredSystems(assets: DiscoveredAIAsset[], userId: string): Promise<DiscoveryPrioritization[]>;
//# sourceMappingURL=smart-shadow-ai-discovery.d.ts.map