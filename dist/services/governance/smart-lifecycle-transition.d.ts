export interface LifecycleStage {
    stage: 'Draft' | 'Development' | 'Testing' | 'Deployed' | 'Monitoring' | 'Retired';
    description: string;
    typical_duration: string;
    key_activities: string[];
    exit_criteria: string[];
}
export interface TransitionReadinessAssessment {
    system_id: string;
    current_stage: LifecycleStage['stage'];
    target_stage: LifecycleStage['stage'];
    overall_readiness: 'ready' | 'mostly_ready' | 'partially_ready' | 'not_ready';
    readiness_score: number;
    readiness_criteria: {
        criterion: string;
        status: 'met' | 'partially_met' | 'not_met' | 'not_applicable';
        description: string;
        regulatory_requirement: boolean;
        blocking: boolean;
        evidence: string[];
        recommendations: string[];
    }[];
    regulatory_requirements: {
        regulation: 'EU' | 'UK' | 'MAS';
        requirement: string;
        status: 'compliant' | 'partially_compliant' | 'non_compliant' | 'not_assessed';
        mandatory: boolean;
        evidence_needed: string[];
    }[];
    blockers: {
        blocker_type: 'regulatory' | 'technical' | 'process' | 'documentation' | 'governance';
        description: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        resolution_steps: string[];
        estimated_resolution_time: string;
        responsible_party: string;
    }[];
    recommendations: {
        priority: 'immediate' | 'high' | 'medium' | 'low';
        category: 'regulatory' | 'technical' | 'process' | 'documentation' | 'governance';
        action: string;
        rationale: string;
        estimated_effort: 'low' | 'medium' | 'high';
        timeline: string;
    }[];
    confidence_score: number;
}
export interface TransitionPlan {
    system_id: string;
    from_stage: LifecycleStage['stage'];
    to_stage: LifecycleStage['stage'];
    transition_strategy: 'immediate' | 'phased' | 'conditional' | 'delayed';
    estimated_timeline: string;
    phases: {
        phase_name: string;
        duration: string;
        activities: {
            activity: string;
            category: 'regulatory' | 'technical' | 'process' | 'documentation' | 'governance';
            priority: 'immediate' | 'high' | 'medium' | 'low';
            estimated_effort: 'low' | 'medium' | 'high';
            dependencies: string[];
            deliverables: string[];
            success_criteria: string[];
        }[];
        milestones: {
            milestone: string;
            target_date: string;
            success_criteria: string[];
            dependencies: string[];
        }[];
        risks: {
            risk: string;
            probability: 'low' | 'medium' | 'high';
            impact: 'low' | 'medium' | 'high';
            mitigation: string;
        }[];
    }[];
    resource_requirements: {
        human_resources: string[];
        technical_resources: string[];
        budget_estimate: string;
        external_support_needed: boolean;
    };
    success_metrics: {
        metric: string;
        target_value: string;
        measurement_method: string;
    }[];
    contingency_plans: {
        scenario: string;
        trigger_conditions: string[];
        response_actions: string[];
    }[];
}
export interface BlockerResolution {
    blocker_id: string;
    blocker_description: string;
    blocker_type: 'regulatory' | 'technical' | 'process' | 'documentation' | 'governance';
    severity: 'low' | 'medium' | 'high' | 'critical';
    resolution_strategies: {
        strategy: string;
        approach: string;
        estimated_effort: 'low' | 'medium' | 'high';
        timeline: string;
        success_probability: 'low' | 'medium' | 'high';
        resources_needed: string[];
        regulatory_alignment: string;
        risks: string[];
        benefits: string[];
    }[];
    recommended_strategy: string;
    implementation_steps: {
        step: string;
        description: string;
        estimated_duration: string;
        dependencies: string[];
        deliverables: string[];
        success_criteria: string[];
    }[];
    monitoring_plan: {
        progress_indicators: string[];
        review_frequency: string;
        escalation_triggers: string[];
    };
}
/**
 * Assess readiness for lifecycle transition using all three RAG sources
 */
export declare function assessTransitionReadiness(systemData: {
    id: string;
    name: string;
    description?: string;
    risk_tier?: string;
    current_stage: LifecycleStage['stage'];
    regulation_type?: string;
    compliance_status?: string;
    [key: string]: any;
}, targetStage: LifecycleStage['stage'], userId: string): Promise<TransitionReadinessAssessment>;
/**
 * Generate intelligent transition plan using RAG context
 */
export declare function generateTransitionPlan(systemData: {
    id: string;
    name: string;
    description?: string;
    risk_tier?: string;
    regulation_type?: string;
}, fromStage: LifecycleStage['stage'], toStage: LifecycleStage['stage'], readinessAssessment: TransitionReadinessAssessment, userId: string): Promise<TransitionPlan>;
/**
 * Suggest resolutions for transition blockers using RAG context
 */
export declare function suggestBlockerResolutions(blockers: TransitionReadinessAssessment['blockers'], systemContext: {
    id: string;
    name: string;
    risk_tier: string;
    regulation_type: string;
}, userId: string): Promise<BlockerResolution[]>;
//# sourceMappingURL=smart-lifecycle-transition.d.ts.map