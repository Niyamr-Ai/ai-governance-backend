export interface RegulatoryChange {
    id: string;
    title: string;
    description: string;
    regulation_type: 'EU' | 'UK' | 'MAS';
    change_type: 'new_requirement' | 'amendment' | 'clarification' | 'enforcement_update' | 'deadline_change';
    severity: 'low' | 'medium' | 'high' | 'critical';
    effective_date: string;
    compliance_deadline?: string;
    affected_areas: string[];
    source_document: string;
    summary: string;
}
export interface SystemImpactAnalysis {
    system_id: string;
    system_name: string;
    regulation_type: 'EU' | 'UK' | 'MAS';
    overall_impact_level: 'minimal' | 'low' | 'medium' | 'high' | 'critical';
    impact_score: number;
    affected_areas: {
        area: string;
        impact_level: 'minimal' | 'low' | 'medium' | 'high' | 'critical';
        current_compliance_status: 'compliant' | 'partially_compliant' | 'non_compliant' | 'unknown';
        required_actions: string[];
        estimated_effort: 'low' | 'medium' | 'high';
        priority: 'immediate' | 'high' | 'medium' | 'low';
    }[];
    compliance_gaps: {
        gap_description: string;
        regulatory_requirement: string;
        current_state: string;
        target_state: string;
        remediation_steps: string[];
        timeline: string;
        resources_needed: string[];
    }[];
    timeline_analysis: {
        immediate_actions: string[];
        short_term_actions: string[];
        medium_term_actions: string[];
        long_term_actions: string[];
    };
    risk_assessment: {
        non_compliance_risks: string[];
        business_impact: string;
        financial_implications: string;
        reputational_risks: string[];
    };
    confidence_score: number;
}
export interface PortfolioImpactAnalysis {
    total_systems: number;
    systems_analyzed: number;
    overall_portfolio_impact: 'minimal' | 'low' | 'medium' | 'high' | 'critical';
    impact_distribution: {
        minimal: number;
        low: number;
        medium: number;
        high: number;
        critical: number;
    };
    priority_systems: {
        system_id: string;
        system_name: string;
        impact_level: 'high' | 'critical';
        key_concerns: string[];
        estimated_effort: 'low' | 'medium' | 'high';
    }[];
    resource_requirements: {
        total_estimated_effort: 'low' | 'medium' | 'high' | 'very_high';
        skill_areas_needed: string[];
        timeline_pressure: 'low' | 'medium' | 'high';
        budget_implications: 'minimal' | 'moderate' | 'significant' | 'major';
    };
    recommended_approach: {
        prioritization_strategy: string;
        implementation_phases: {
            phase: string;
            timeline: string;
            systems_included: string[];
            key_activities: string[];
        }[];
        risk_mitigation: string[];
    };
}
export interface ComplianceActionPlan {
    regulatory_change_id: string;
    system_id: string;
    action_items: {
        id: string;
        title: string;
        description: string;
        category: 'documentation' | 'technical_implementation' | 'process_change' | 'training' | 'assessment';
        priority: 'immediate' | 'high' | 'medium' | 'low';
        estimated_effort: 'low' | 'medium' | 'high';
        timeline: string;
        dependencies: string[];
        success_criteria: string[];
        responsible_party: string;
        regulatory_basis: string;
    }[];
    milestones: {
        milestone: string;
        target_date: string;
        deliverables: string[];
        success_metrics: string[];
    }[];
    resource_allocation: {
        human_resources: string[];
        budget_estimate: string;
        external_support_needed: boolean;
        tools_and_systems: string[];
    };
    risk_mitigation: {
        risk: string;
        mitigation_strategy: string;
        contingency_plan: string;
    }[];
}
/**
 * Analyze the impact of a regulatory change on a specific AI system
 */
export declare function analyzeRegulatoryImpact(regulatoryChange: RegulatoryChange, systemData: {
    id: string;
    name: string;
    description?: string;
    risk_tier?: string;
    lifecycle_stage?: string;
    compliance_status?: string;
    regulation_type?: 'EU' | 'UK' | 'MAS';
    [key: string]: any;
}, userId: string): Promise<SystemImpactAnalysis>;
/**
 * Generate a comprehensive action plan for compliance with regulatory changes
 */
export declare function generateComplianceActionPlan(impactAnalysis: SystemImpactAnalysis, regulatoryChange: RegulatoryChange, organizationCapacity?: {
    available_resources: string[];
    budget_constraints: 'low' | 'medium' | 'high';
    timeline_flexibility: 'rigid' | 'moderate' | 'flexible';
}, userId?: string): Promise<ComplianceActionPlan>;
/**
 * Estimate compliance effort across multiple systems and changes
 */
export declare function estimateComplianceEffort(requiredChanges: Array<{
    system_id: string;
    system_name: string;
    impact_level: 'minimal' | 'low' | 'medium' | 'high' | 'critical';
    required_actions: string[];
    estimated_effort: 'low' | 'medium' | 'high';
}>, organizationCapacity: {
    team_size: number;
    available_budget: 'low' | 'medium' | 'high';
    external_support_available: boolean;
    timeline_constraints: string;
}, userId?: string): Promise<{
    total_effort_estimate: 'low' | 'medium' | 'high' | 'very_high';
    timeline_estimate: string;
    resource_requirements: {
        human_resources: string[];
        estimated_budget: string;
        external_support_recommended: boolean;
        critical_skills_needed: string[];
    };
    implementation_strategy: {
        recommended_approach: string;
        phases: Array<{
            phase_name: string;
            duration: string;
            systems_included: string[];
            key_activities: string[];
        }>;
        risk_factors: string[];
    };
    confidence_level: number;
}>;
//# sourceMappingURL=regulatory-change-impact-analysis.d.ts.map