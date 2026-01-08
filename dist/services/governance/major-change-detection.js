"use strict";
/**
 * Major Change Detection
 *
 * Detects significant changes in compliance assessment data that warrant
 * a new automated risk assessment.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectMajorChange = detectMajorChange;
exports.autoTriggerRiskAssessmentIfMajorChange = autoTriggerRiskAssessmentIfMajorChange;
/**
 * Detect if changes are significant enough to trigger a new risk assessment
 */
function detectMajorChange(oldData, newData) {
    if (!oldData) {
        // First assessment - always trigger
        return true;
    }
    // Check for critical status changes
    if (oldData.compliance_status !== newData.compliance_status) {
        return true; // Compliance status changed
    }
    if (oldData.risk_tier !== newData.risk_tier) {
        return true; // Risk tier changed (e.g., Limited-risk -> High-risk)
    }
    if (oldData.prohibited_practices_detected !== newData.prohibited_practices_detected) {
        return true; // Prohibited practices status changed
    }
    if (oldData.high_risk_all_fulfilled !== newData.high_risk_all_fulfilled) {
        return true; // High-risk obligations fulfillment changed
    }
    // Check for significant changes in missing obligations
    const oldMissing = oldData.high_risk_missing || [];
    const newMissing = newData.high_risk_missing || [];
    if (oldMissing.length !== newMissing.length) {
        return true; // Number of missing obligations changed
    }
    // Check if any critical obligations were added/removed
    const oldSet = new Set(oldMissing);
    const newSet = new Set(newMissing);
    const hasNewMissing = newMissing.some(item => !oldSet.has(item));
    const hasResolvedMissing = oldMissing.some(item => !newSet.has(item));
    if (hasNewMissing || hasResolvedMissing) {
        return true; // Critical obligations changed
    }
    // Lifecycle stage changes (draft -> deployed, etc.)
    if (oldData.lifecycle_stage !== newData.lifecycle_stage) {
        const significantStages = ['draft', 'deployed', 'monitoring'];
        if (significantStages.includes(oldData.lifecycle_stage || '') ||
            significantStages.includes(newData.lifecycle_stage || '')) {
            return true; // Significant lifecycle transition
        }
    }
    // Critical monitoring changes
    if (oldData.post_market_monitoring !== newData.post_market_monitoring) {
        return true; // Post-market monitoring status changed
    }
    if (oldData.fria_completed !== newData.fria_completed) {
        return true; // FRIA completion status changed
    }
    // No major changes detected
    return false;
}
/**
 * Auto-trigger automated risk assessment if major change detected
 */
async function autoTriggerRiskAssessmentIfMajorChange(systemId, oldData, newData) {
    const isMajorChange = detectMajorChange(oldData, newData);
    if (!isMajorChange) {
        return; // No major change, skip
    }
    try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ||
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
        const res = await fetch(`${baseUrl}/api/ai-systems/${systemId}/automated-risk-assessment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trigger_type: 'major_change' }),
        });
        if (res.ok) {
            console.log(`[Major Change] Triggered automated risk assessment for system ${systemId}`);
        }
        else {
            console.error(`[Major Change] Failed to trigger risk assessment for system ${systemId}`);
        }
    }
    catch (err) {
        console.error(`[Major Change] Error triggering risk assessment:`, err.message || err);
    }
}
//# sourceMappingURL=major-change-detection.js.map