export interface PolicyComplianceAnalysis {
    policy_id: string;
    system_id: string;
    compliance_status: 'compliant' | 'partially_compliant' | 'non_compliant' | 'not_assessed';
    compliance_score: number;
    gap_analysis: {
        missing_requirements: string[];
        partial_implementations: string[];
        severity: 'low' | 'medium' | 'high' | 'critical';
    };
    recommendations: {
        priority: 'immediate' | 'high' | 'medium' | 'low';
        action: string;
        rationale: string;
        estimated_effort: 'low' | 'medium' | 'high';
    }[];
    regulatory_alignment: {
        regulation: 'EU' | 'UK' | 'MAS';
        alignment_score: number;
        key_requirements: string[];
    }[];
    confidence_score: number;
    assessment_date: string;
}
export interface PolicyConflictAnalysis {
    conflicting_policies: {
        policy_id_1: string;
        policy_name_1: string;
        policy_id_2: string;
        policy_name_2: string;
        conflict_type: 'requirement_contradiction' | 'scope_overlap' | 'enforcement_conflict';
        severity: 'low' | 'medium' | 'high';
        description: string;
        resolution_suggestions: string[];
    }[];
    system_impact: {
        affected_systems: string[];
        risk_level: 'low' | 'medium' | 'high' | 'critical';
        business_impact: string;
    };
    recommended_actions: {
        priority: 'immediate' | 'high' | 'medium' | 'low';
        action: string;
        rationale: string;
    }[];
}
export interface ComplianceGapIdentification {
    system_id: string;
    applicable_policies: {
        policy_id: string;
        policy_name: string;
        compliance_status: 'compliant' | 'partially_compliant' | 'non_compliant' | 'not_assessed';
        gap_score: number;
    }[];
    priority_gaps: {
        gap_type: 'documentation' | 'technical_control' | 'process' | 'governance';
        description: string;
        affected_policies: string[];
        severity: 'low' | 'medium' | 'high' | 'critical';
        remediation_effort: 'low' | 'medium' | 'high';
    }[];
    overall_compliance_score: number;
    next_review_date: string;
}
/**
 * Analyze policy compliance for a specific AI system using all three RAG sources
 */
export declare function analyzePolicyCompliance(aiSystem: {
    id: string;
    name: string;
    description: string;
    risk_level: string;
    regulation_type?: string;
}, policies: Array<{
    id: string;
    name: string;
    description: string;
    policy_type: 'External' | 'Internal';
    jurisdiction?: string;
    requirements?: string[];
}>, userId: string): Promise<PolicyComplianceAnalysis[]>;
/**
 * Identify compliance gaps across all applicable policies for a system
 */
export declare function identifyComplianceGaps(aiSystem: {
    id: string;
    name: string;
    description: string;
    risk_level: string;
}, applicablePolicies: Array<{
    id: string;
    name: string;
    description: string;
    policy_type: 'External' | 'Internal';
    current_compliance_status?: string;
}>, userId: string): Promise<ComplianceGapIdentification>;
/**
 * Detect conflicts between policies that may affect system compliance
 */
export declare function detectPolicyConflicts(policies: Array<{
    id: string;
    name: string;
    description: string;
    policy_type: 'External' | 'Internal';
    jurisdiction?: string;
    requirements?: string[];
}>, systemCharacteristics: {
    risk_level: string;
    system_type: string;
    data_sensitivity: string;
}, userId: string): Promise<PolicyConflictAnalysis>;
//# sourceMappingURL=smart-policy-compliance.d.ts.map