/**
 * Governance Document Analyzer Service
 *
 * Analyzes governance policy documents (PDF/DOC/TXT) and extracts structured information
 * to auto-populate compliance form fields.
 */
export interface GovernanceAnalysisResult {
    governance_policy_type?: string;
    governance_framework?: string;
    governance_board_role?: string;
    governance_senior_management?: string;
    governance_policy_assigned?: string;
    accountability_framework_structure?: string;
    accountability_roles?: string;
    governance_board_involvement?: string;
    senior_management_oversight?: string;
}
/**
 * Analyze governance document text and extract structured information
 *
 * @param documentText - Extracted text from the governance document
 * @param formType - 'MAS' or 'UK' to determine which fields to extract
 * @returns Structured data for form auto-population
 */
export declare function analyzeGovernanceDocument(documentText: string, formType?: 'MAS' | 'UK'): Promise<GovernanceAnalysisResult>;
//# sourceMappingURL=governance-document-analyzer.d.ts.map