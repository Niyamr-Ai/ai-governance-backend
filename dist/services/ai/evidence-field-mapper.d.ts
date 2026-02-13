/**
 * Evidence Field Mapper
 *
 * Maps evidence upload keys to their associated form fields for auto-population.
 * This allows the system to know which fields to populate based on the evidence type.
 */
export interface EvidenceFieldMapping {
    evidenceKey: string;
    formType: 'MAS' | 'UK';
    fieldsToPopulate: string[];
    analysisType: 'governance' | 'inventory' | 'data_quality' | 'transparency' | 'fairness' | 'human_oversight' | 'security' | 'third_party' | 'algorithm' | 'evaluation' | 'robustness' | 'cybersecurity' | 'accountability' | 'risk_management' | 'audit_trail' | 'user_rights' | 'appeal' | 'redress' | 'complaint' | 'foundation_model' | 'disclosure' | 'explainability' | 'safety';
}
/**
 * Mapping of evidence keys to their associated form fields
 */
export declare const EVIDENCE_FIELD_MAPPINGS: EvidenceFieldMapping[];
/**
 * Get field mapping for a specific evidence key
 */
export declare function getEvidenceFieldMapping(evidenceKey: string): EvidenceFieldMapping | undefined;
/**
 * Check if an evidence key has auto-population support
 */
export declare function hasAutoPopulationSupport(evidenceKey: string): boolean;
/**
 * Get all evidence keys that support auto-population for a form type
 */
export declare function getSupportedEvidenceKeys(formType: 'MAS' | 'UK'): string[];
//# sourceMappingURL=evidence-field-mapper.d.ts.map