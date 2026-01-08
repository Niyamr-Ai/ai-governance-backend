"use strict";
/**
 * Shadow AI Governance Helpers
 *
 * Functions to check for Shadow AI and enforce governance rules
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkShadowAI = checkShadowAI;
exports.checkUnlinkedShadowAI = checkUnlinkedShadowAI;
exports.getShadowAIWarning = getShadowAIWarning;
exports.shouldBlockComplianceApproval = shouldBlockComplianceApproval;
const server_1 = require("@/ai-governance-backend/utils/supabase/server");
/**
 * Check if a system has confirmed Shadow AI
 * @param systemId - The AI system ID to check
 * @returns Object with hasShadowAI flag and details
 */
async function checkShadowAI(systemId) {
    const supabase = await (0, server_1.createClient)();
    // Check for confirmed shadow AI linked to this system
    const { data: confirmedShadow } = await supabase
        .from("discovered_ai_assets")
        .select("id, detected_name, shadow_status")
        .eq("linked_system_id", systemId)
        .eq("shadow_status", "confirmed");
    // Check for potential shadow AI (not linked)
    // This would be systems that might be related but aren't linked yet
    // For now, we focus on confirmed shadow AI linked to the system
    const confirmedShadowCount = confirmedShadow?.length || 0;
    return {
        hasShadowAI: confirmedShadowCount > 0,
        confirmedShadowCount,
        potentialShadowCount: 0, // Could be enhanced to check for unlinked assets
        shadowAssets: confirmedShadow || [],
    };
}
/**
 * Check if there are any unlinked discovered assets that could be shadow AI
 * @param systemId - Optional system ID to exclude from check
 * @returns Count of potential shadow AI assets
 */
async function checkUnlinkedShadowAI(systemId) {
    const supabase = await (0, server_1.createClient)();
    let query = supabase
        .from("discovered_ai_assets")
        .select("id", { count: "exact", head: true })
        .is("linked_system_id", null)
        .in("shadow_status", ["potential", "confirmed"]);
    const { count } = await query;
    return count || 0;
}
/**
 * Get shadow AI warning message for a system
 * @param systemId - The AI system ID
 * @returns Warning message or null
 */
async function getShadowAIWarning(systemId) {
    const shadowCheck = await checkShadowAI(systemId);
    if (shadowCheck.hasShadowAI) {
        return `Unregistered AI usage detected: ${shadowCheck.confirmedShadowCount} confirmed Shadow AI system${shadowCheck.confirmedShadowCount !== 1 ? 's' : ''} linked to this system. Compliance approval may be blocked.`;
    }
    return null;
}
/**
 * Check if compliance approval should be blocked due to Shadow AI
 * @param systemId - The AI system ID
 * @returns Object with shouldBlock flag and reason
 */
async function shouldBlockComplianceApproval(systemId) {
    const shadowCheck = await checkShadowAI(systemId);
    if (shadowCheck.hasShadowAI) {
        return {
            shouldBlock: true,
            reason: `Cannot approve compliance: ${shadowCheck.confirmedShadowCount} confirmed Shadow AI system${shadowCheck.confirmedShadowCount !== 1 ? 's' : ''} detected. Please resolve Shadow AI issues before approval.`,
        };
    }
    return {
        shouldBlock: false,
        reason: null,
    };
}
//# sourceMappingURL=shadow-ai-governance.js.map