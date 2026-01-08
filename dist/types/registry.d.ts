export type SystemStatus = 'development' | 'staging' | 'production' | 'deprecated';
export type RiskClassification = 'low' | 'medium' | 'high' | 'prohibited';
export type RiskAssessmentStatus = 'done' | 'partial' | 'not_started';
export type ComplianceStatus = 'compliant' | 'non-compliant' | 'needs_review';
export interface AISystemRegistry {
    system_id?: string;
    id?: string;
    name: string;
    description?: string | null;
    owner?: string | null;
    status?: SystemStatus | null;
    business_purpose?: string | null;
    risk_classification?: RiskClassification | null;
    model_type?: string | null;
    framework?: string | null;
    hosting_environment?: string | null;
    api_endpoints?: string | null;
    version?: string | null;
    training_data_sources?: string | null;
    performance_metrics?: string | null;
    applicable_regulations?: string[] | null;
    risk_assessment_status?: RiskAssessmentStatus | null;
    last_audit_date?: string | null;
    compliance_status?: ComplianceStatus | null;
    approvals_required?: string[] | null;
    approvals_obtained?: string[] | null;
    documentation_completeness?: number | null;
    basic_compliance_id?: string | null;
    detailed_compliance_id?: string | null;
    created_at?: string;
    updated_at?: string;
    created_by?: string | null;
    updated_by?: string | null;
}
export interface CreateAISystemInput {
    name: string;
    description?: string;
    owner?: string;
    status?: SystemStatus;
    business_purpose?: string;
    risk_classification?: RiskClassification;
    model_type?: string;
    framework?: string;
    hosting_environment?: string;
    api_endpoints?: string;
    version?: string;
    training_data_sources?: string;
    performance_metrics?: string;
    applicable_regulations?: string[];
    risk_assessment_status?: RiskAssessmentStatus;
    last_audit_date?: string;
    compliance_status?: ComplianceStatus;
    approvals_required?: string[];
    approvals_obtained?: string[];
    documentation_completeness?: number;
    basic_compliance_id?: string;
    detailed_compliance_id?: string;
}
export interface UpdateAISystemInput extends Partial<CreateAISystemInput> {
    system_id?: string;
    id?: string;
}
export interface RegistryFilters {
    search?: string;
    risk_classification?: RiskClassification;
    compliance_status?: ComplianceStatus;
    owner?: string;
    model_type?: string;
    status?: SystemStatus;
}
//# sourceMappingURL=registry.d.ts.map