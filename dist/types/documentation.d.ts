/**
 * Compliance Documentation Types
 */
export type DocumentType = 'AI System Card' | 'Technical Documentation' | 'Data Protection Impact Assessment' | 'Risk Assessment Report' | 'Algorithm Impact Assessment' | 'Audit Trail' | 'Compliance Summary';
export type RegulationType = 'EU AI Act' | 'UK AI Act' | 'MAS';
export type DocumentationStatus = 'current' | 'outdated' | 'requires_regeneration';
export interface ComplianceDocumentation {
    id: string;
    ai_system_id: string;
    regulation_type: RegulationType;
    document_type?: DocumentType;
    version: string;
    content: string;
    status: DocumentationStatus;
    created_by: string | null;
    created_at: string;
    ai_system_version?: string | null;
    risk_assessment_version?: string | null;
    regulation_version?: string | null;
    generation_metadata?: {
        system_data_hash?: number;
        risk_assessments_count?: number;
        generated_at?: string;
        risk_scores?: Record<string, number>;
        bias_metrics?: Record<string, any>;
        monitoring_references?: string[];
        change_history?: string[];
        approval_metadata?: {
            approved_by?: string;
            approved_at?: string;
            sign_off?: string;
        };
    };
}
export interface GenerateDocumentationRequest {
    regulation_type: RegulationType;
    document_type?: DocumentType;
}
export interface DocumentationListResponse {
    documentation: ComplianceDocumentation[];
}
export interface DocumentationWithSystemInfo extends ComplianceDocumentation {
    system_name?: string;
    system_type?: RegulationType;
}
//# sourceMappingURL=documentation.d.ts.map