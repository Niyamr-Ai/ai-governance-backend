"use strict";
/**
 * Lifecycle Governance Utilities
 *
 * Provides logic for lifecycle stage warnings and recommendations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLifecycleWarnings = getLifecycleWarnings;
exports.canEditInLifecycleStage = canEditInLifecycleStage;
exports.canCreateRiskAssessment = canCreateRiskAssessment;
/**
 * Get lifecycle warnings based on current stage and system state
 */
function getLifecycleWarnings(lifecycleStage, hasApprovedRiskAssessments, riskAssessmentCount) {
    const warnings = [];
    switch (lifecycleStage) {
        case 'Draft':
            // No restrictions for draft
            break;
        case 'Development':
            if (riskAssessmentCount === 0) {
                warnings.push({
                    type: 'info',
                    message: 'Consider adding risk assessments during development',
                    action: 'Add Risk Assessment',
                });
            }
            break;
        case 'Testing':
            if (!hasApprovedRiskAssessments) {
                warnings.push({
                    type: 'warning',
                    message: 'No approved risk assessments found. Recommended before testing phase.',
                    action: 'Review Risk Assessments',
                });
            }
            break;
        case 'Deployed':
            if (!hasApprovedRiskAssessments) {
                warnings.push({
                    type: 'warning',
                    message: 'No approved risk assessments found. Recommended for deployed systems.',
                    action: 'Review Risk Assessments',
                });
            }
            break;
        case 'Monitoring':
            // Allow new assessments, preserve history
            warnings.push({
                type: 'info',
                message: 'System is in monitoring phase. New assessments can be added to track ongoing risks.',
            });
            break;
        case 'Retired':
            warnings.push({
                type: 'info',
                message: 'System is retired. View-only mode.',
            });
            break;
    }
    return warnings;
}
/**
 * Check if lifecycle stage allows editing
 */
function canEditInLifecycleStage(stage) {
    return stage !== 'Retired';
}
/**
 * Check if lifecycle stage allows creating risk assessments
 */
function canCreateRiskAssessment(stage) {
    return stage !== 'Retired';
}
//# sourceMappingURL=lifecycle-governance.js.map