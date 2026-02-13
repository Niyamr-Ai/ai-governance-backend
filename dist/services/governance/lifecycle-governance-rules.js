"use strict";
/**
 * Lifecycle Governance Rules
 *
 * Enforces lifecycle transition validation and compliance checks
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLifecycleTransition = validateLifecycleTransition;
exports.canEditRiskAssessment = canEditRiskAssessment;
exports.canCreateRiskAssessmentInStage = canCreateRiskAssessmentInStage;
exports.getLifecycleConstraints = getLifecycleConstraints;
/**
 * Validate lifecycle transition based on governance rules
 */
async function validateLifecycleTransition(currentStage, newStage, complianceData, riskAssessmentSummary) {
    // If stage hasn't changed, allow
    if (currentStage === newStage) {
        return { valid: true };
    }
    // Retired systems cannot transition
    if (currentStage === 'Retired') {
        return {
            valid: false,
            reason: "Retired systems cannot be moved to another lifecycle stage. System is read-only."
        };
    }
    // Validate transition to Testing (Staging)
    if (newStage === 'Testing') {
        return validateTransitionToTesting(riskAssessmentSummary);
    }
    // Validate transition to Deployed (Production)
    if (newStage === 'Deployed') {
        return validateTransitionToProduction(complianceData, riskAssessmentSummary);
    }
    // Validate transition from Monitoring - cannot go back
    if (currentStage === 'Monitoring' && ['Draft', 'Development', 'Testing', 'Deployed'].includes(newStage)) {
        return {
            valid: false,
            reason: "Cannot move back from Monitoring stage. Systems in Monitoring can only move forward to Retired."
        };
    }
    // All other transitions are allowed
    return { valid: true };
}
/**
 * Validate transition to Testing (Staging)
 * Rule: Require at least one completed (submitted or approved) risk assessment
 */
function validateTransitionToTesting(riskSummary) {
    const completedAssessments = riskSummary.submitted + riskSummary.approved;
    if (completedAssessments === 0) {
        return {
            valid: false,
            reason: "Cannot move to Testing stage: At least one risk assessment must be submitted or approved before moving to Testing.",
            warnings: [
                "Create and submit a risk assessment to proceed to Testing stage."
            ]
        };
    }
    return { valid: true };
}
/**
 * Validate transition to Deployed (Production)
 * Rules:
 * 1. BLOCK if risk_tier = "Prohibited" (EU AI Act) - Prohibited systems cannot be deployed
 * 2. BLOCK if High-risk and Non-compliant or Partially compliant
 * 3. Require at least one APPROVED risk assessment
 * 4. MAS: Require accountability owner
 * 5. UK: Ensure risk management and governance checks are in place
 */
function validateTransitionToProduction(complianceData, riskSummary) {
    const errors = [];
    const warnings = [];
    // Rule 1: BLOCK Prohibited systems from Production deployment
    if (complianceData?.type === 'EU AI Act') {
        if (complianceData.risk_tier === 'Prohibited' || complianceData.prohibited_practices_detected) {
            return {
                valid: false,
                reason: "Cannot deploy to Production: This system has been classified as 'Prohibited' under the EU AI Act. Prohibited AI practices (social scoring, real-time biometric identification in public spaces, influencing law enforcement decisions) are strictly forbidden and cannot be deployed. Immediate action required to remove prohibited practices before deployment.",
                warnings: [
                    "Prohibited practices detected: " + (complianceData.prohibited_practices_detected ? "Yes" : "Risk tier is Prohibited"),
                    "According to EU AI Act Article 5, prohibited AI systems cannot be placed on the market, put into service, or used.",
                    "You must modify the system to remove all prohibited practices before it can be deployed."
                ]
            };
        }
        // Rule 2: BLOCK High-risk systems that are Non-compliant or Partially compliant
        if (complianceData.risk_tier === 'High-risk') {
            if (complianceData.compliance_status === 'Non-compliant') {
                return {
                    valid: false,
                    reason: "Cannot deploy to Production: This High-risk system is 'Non-compliant'. All high-risk obligations must be fulfilled and compliance status must be 'Compliant' or 'Partially compliant' before deployment.",
                    warnings: [
                        "High-risk AI systems require full compliance with EU AI Act obligations before deployment.",
                        "Review and address all missing high-risk obligations to achieve compliance."
                    ]
                };
            }
            if (complianceData.compliance_status === 'Partially compliant') {
                warnings.push("System is 'Partially compliant'. Ensure all critical high-risk obligations are met before deployment.");
            }
        }
    }
    // Rule 3: Require approved risk assessment
    if (riskSummary.approved === 0) {
        errors.push("At least one APPROVED risk assessment is required before moving to Production.");
    }
    // Rule 2: MAS compliance - accountability owner
    if (complianceData?.type === 'MAS') {
        const owner = complianceData.owner || complianceData.accountable_person;
        if (!owner || owner.trim() === '' || owner === 'Not specified') {
            errors.push("MAS compliance requires an accountability owner to be specified before Production deployment.");
        }
    }
    // Rule 3: UK AI principles - check governance and risk management
    if (complianceData?.type === 'UK AI Act') {
        // Check if governance principle is met
        const governanceMet = complianceData.governance?.meetsPrinciple === true;
        if (!governanceMet) {
            warnings.push("UK AI Act: Governance principle should be met before Production deployment.");
        }
        // Check if safety/security principle is met
        const safetyMet = complianceData.safety_and_security?.meetsPrinciple === true;
        if (!safetyMet) {
            warnings.push("UK AI Act: Safety and Security principle should be met before Production deployment.");
        }
    }
    if (errors.length > 0) {
        return {
            valid: false,
            reason: errors.join(' '),
            warnings: warnings.length > 0 ? warnings : undefined
        };
    }
    if (warnings.length > 0) {
        return {
            valid: true,
            warnings
        };
    }
    return { valid: true };
}
/**
 * Check if risk assessment edits are allowed based on lifecycle stage
 */
function canEditRiskAssessment(lifecycleStage, assessmentStatus) {
    // Retired: no edits allowed
    if (lifecycleStage === 'Retired') {
        return false;
    }
    // Production (Deployed) and Monitoring: lock edits on approved/submitted assessments
    if (lifecycleStage === 'Deployed' || lifecycleStage === 'Monitoring') {
        // Only draft assessments can be edited in Production/Monitoring
        return assessmentStatus === 'draft';
    }
    // All other stages: allow edits for draft assessments
    return assessmentStatus === 'draft';
}
/**
 * Check if creating new risk assessments is allowed
 */
function canCreateRiskAssessmentInStage(lifecycleStage) {
    // Retired: no new assessments
    return lifecycleStage !== 'Retired';
}
/**
 * Get lifecycle-specific constraints message
 */
function getLifecycleConstraints(lifecycleStage) {
    const constraints = [];
    switch (lifecycleStage) {
        case 'Draft':
        case 'Development':
            constraints.push("Draft risk assessments are allowed.");
            break;
        case 'Testing':
            constraints.push("At least one completed risk assessment is required.");
            break;
        case 'Deployed':
            constraints.push("At least one APPROVED risk assessment is required.");
            constraints.push("Risk assessment edits are locked (only draft assessments can be edited).");
            constraints.push("All changes are logged for audit purposes.");
            break;
        case 'Monitoring':
            constraints.push("New assessments can be added to track ongoing risks.");
            constraints.push("Risk assessment edits are locked (only draft assessments can be edited).");
            constraints.push("Historical assessments are preserved.");
            constraints.push("Cannot move back to earlier lifecycle stages (forward-only to Retired).");
            break;
        case 'Retired':
            constraints.push("System is read-only. No edits or new assessments allowed.");
            break;
    }
    return constraints;
}
//# sourceMappingURL=lifecycle-governance-rules.js.map