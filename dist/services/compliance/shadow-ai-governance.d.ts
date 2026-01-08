/**
 * Shadow AI Governance Helpers
 *
 * Functions to check for Shadow AI and enforce governance rules
 */
/**
 * Check if a system has confirmed Shadow AI
 * @param systemId - The AI system ID to check
 * @returns Object with hasShadowAI flag and details
 */
export declare function checkShadowAI(systemId: string): Promise<{
    hasShadowAI: boolean;
    confirmedShadowCount: number;
    potentialShadowCount: number;
    shadowAssets: Array<{
        id: string;
        detected_name: string;
        shadow_status: string;
    }>;
}>;
/**
 * Check if there are any unlinked discovered assets that could be shadow AI
 * @param systemId - Optional system ID to exclude from check
 * @returns Count of potential shadow AI assets
 */
export declare function checkUnlinkedShadowAI(systemId?: string): Promise<number>;
/**
 * Get shadow AI warning message for a system
 * @param systemId - The AI system ID
 * @returns Warning message or null
 */
export declare function getShadowAIWarning(systemId: string): Promise<string | null>;
/**
 * Check if compliance approval should be blocked due to Shadow AI
 * @param systemId - The AI system ID
 * @returns Object with shouldBlock flag and reason
 */
export declare function shouldBlockComplianceApproval(systemId: string): Promise<{
    shouldBlock: boolean;
    reason: string | null;
}>;
//# sourceMappingURL=shadow-ai-governance.d.ts.map