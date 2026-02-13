"use strict";
/**
 * Evidence Field Mapper
 *
 * Maps evidence upload keys to their associated form fields for auto-population.
 * This allows the system to know which fields to populate based on the evidence type.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVIDENCE_FIELD_MAPPINGS = void 0;
exports.getEvidenceFieldMapping = getEvidenceFieldMapping;
exports.hasAutoPopulationSupport = hasAutoPopulationSupport;
exports.getSupportedEvidenceKeys = getSupportedEvidenceKeys;
/**
 * Mapping of evidence keys to their associated form fields
 */
exports.EVIDENCE_FIELD_MAPPINGS = [
    // MAS Form - Governance
    {
        evidenceKey: 'governance_evidence',
        formType: 'MAS',
        fieldsToPopulate: ['governance_policy_type', 'governance_framework', 'governance_board_role', 'governance_senior_management', 'governance_policy_assigned'],
        analysisType: 'governance'
    },
    // MAS Form - Inventory
    {
        evidenceKey: 'inventory_evidence',
        formType: 'MAS',
        fieldsToPopulate: ['inventory_location', 'inventory_risk_classification'],
        analysisType: 'inventory'
    },
    // MAS Form - Data Quality
    {
        evidenceKey: 'data_quality_evidence',
        formType: 'MAS',
        fieldsToPopulate: ['data_quality_methods', 'data_bias_analysis'],
        analysisType: 'data_quality'
    },
    // MAS Form - Transparency
    {
        evidenceKey: 'transparency_evidence',
        formType: 'MAS',
        fieldsToPopulate: ['transparency_doc_types', 'transparency_user_explanations'],
        analysisType: 'transparency'
    },
    // MAS Form - Fairness
    {
        evidenceKey: 'fairness_evidence',
        formType: 'MAS',
        fieldsToPopulate: ['fairness_testing_methods', 'fairness_test_results'],
        analysisType: 'fairness'
    },
    // MAS Form - Human Oversight
    {
        evidenceKey: 'human_oversight_evidence',
        formType: 'MAS',
        fieldsToPopulate: ['human_oversight_type', 'human_oversight_processes'],
        analysisType: 'human_oversight'
    },
    // MAS Form - Security
    {
        evidenceKey: 'security_evidence',
        formType: 'MAS',
        fieldsToPopulate: ['security_cybersecurity_measures', 'security_prompt_injection', 'security_data_leakage'],
        analysisType: 'security'
    },
    // MAS Form - Third Party
    {
        evidenceKey: 'third_party_controls_evidence',
        formType: 'MAS',
        fieldsToPopulate: ['third_party_due_diligence', 'third_party_contracts'],
        analysisType: 'third_party'
    },
    // MAS Form - Algorithm
    {
        evidenceKey: 'algo_documentation_evidence',
        formType: 'MAS',
        fieldsToPopulate: ['algo_selection_process', 'algo_feature_engineering'],
        analysisType: 'algorithm'
    },
    // MAS Form - Evaluation
    {
        evidenceKey: 'evaluation_evidence',
        formType: 'MAS',
        fieldsToPopulate: ['evaluation_test_types', 'evaluation_robustness_checks'],
        analysisType: 'evaluation'
    },
    // UK Form - Accountability
    {
        evidenceKey: 'uk_accountability_evidence',
        formType: 'UK',
        fieldsToPopulate: ['accountability_framework_structure', 'accountability_roles'],
        analysisType: 'accountability'
    },
    // UK Form - Human Oversight
    {
        evidenceKey: 'uk_human_oversight_evidence',
        formType: 'UK',
        fieldsToPopulate: ['human_oversight_who', 'human_oversight_when', 'human_oversight_how'],
        analysisType: 'human_oversight'
    },
    // UK Form - Risk Management
    {
        evidenceKey: 'uk_risk_management_evidence',
        formType: 'UK',
        fieldsToPopulate: ['risk_management_processes', 'risk_management_documentation'],
        analysisType: 'risk_management'
    },
    // UK Form - Audit Trail
    {
        evidenceKey: 'uk_audit_trail_evidence',
        formType: 'UK',
        fieldsToPopulate: ['audit_trail_what', 'audit_trail_retention', 'audit_trail_access'],
        analysisType: 'audit_trail'
    },
    // UK Form - Robustness
    {
        evidenceKey: 'uk_robustness_evidence',
        formType: 'UK',
        fieldsToPopulate: ['robustness_testing', 'robustness_measures'],
        analysisType: 'robustness'
    },
    // UK Form - Cybersecurity
    {
        evidenceKey: 'uk_cybersecurity_evidence',
        formType: 'UK',
        fieldsToPopulate: ['cybersecurity_measures', 'cybersecurity_testing'],
        analysisType: 'cybersecurity'
    },
    // UK Form - Fairness
    {
        evidenceKey: 'uk_fairness_evidence',
        formType: 'UK',
        fieldsToPopulate: ['fairness_testing', 'fairness_mitigation'],
        analysisType: 'fairness'
    },
    // UK Form - User Rights
    {
        evidenceKey: 'uk_user_rights_evidence',
        formType: 'UK',
        fieldsToPopulate: ['user_rights_procedures', 'user_rights_communication'],
        analysisType: 'user_rights'
    },
    // UK Form - Appeal Mechanism
    {
        evidenceKey: 'uk_appeal_mechanism_evidence',
        formType: 'UK',
        fieldsToPopulate: ['appeal_mechanism_process', 'appeal_mechanism_timeline'],
        analysisType: 'appeal'
    },
    // UK Form - Redress
    {
        evidenceKey: 'uk_redress_process_evidence',
        formType: 'UK',
        fieldsToPopulate: ['redress_process', 'redress_timeline'],
        analysisType: 'redress'
    },
    // UK Form - Complaint Handling
    {
        evidenceKey: 'uk_complaint_handling_evidence',
        formType: 'UK',
        fieldsToPopulate: ['complaint_handling_procedures', 'complaint_tracking'],
        analysisType: 'complaint'
    },
    // UK Form - Foundation Model
    {
        evidenceKey: 'uk_foundation_model_evidence',
        formType: 'UK',
        fieldsToPopulate: ['foundation_model_name', 'foundation_model_usage'],
        analysisType: 'foundation_model'
    },
    // UK Form - Disclosure
    {
        evidenceKey: 'uk_user_disclosure_evidence',
        formType: 'UK',
        fieldsToPopulate: ['user_disclosure_method', 'user_disclosure_content'],
        analysisType: 'disclosure'
    },
    // UK Form - Explainability
    {
        evidenceKey: 'uk_explainability_evidence',
        formType: 'UK',
        fieldsToPopulate: ['explainability_methods', 'explainability_scope'],
        analysisType: 'explainability'
    },
    // UK Form - Safety Testing
    {
        evidenceKey: 'uk_safety_testing_evidence',
        formType: 'UK',
        fieldsToPopulate: ['safety_testing_methods', 'safety_testing_results'],
        analysisType: 'safety'
    },
    // UK Form - Red Teaming
    {
        evidenceKey: 'uk_red_teaming_evidence',
        formType: 'UK',
        fieldsToPopulate: ['red_teaming_approach', 'red_teaming_results'],
        analysisType: 'robustness'
    },
];
/**
 * Get field mapping for a specific evidence key
 */
function getEvidenceFieldMapping(evidenceKey) {
    return exports.EVIDENCE_FIELD_MAPPINGS.find(mapping => mapping.evidenceKey === evidenceKey);
}
/**
 * Check if an evidence key has auto-population support
 */
function hasAutoPopulationSupport(evidenceKey) {
    return exports.EVIDENCE_FIELD_MAPPINGS.some(mapping => mapping.evidenceKey === evidenceKey);
}
/**
 * Get all evidence keys that support auto-population for a form type
 */
function getSupportedEvidenceKeys(formType) {
    return exports.EVIDENCE_FIELD_MAPPINGS
        .filter(mapping => mapping.formType === formType)
        .map(mapping => mapping.evidenceKey);
}
//# sourceMappingURL=evidence-field-mapper.js.map