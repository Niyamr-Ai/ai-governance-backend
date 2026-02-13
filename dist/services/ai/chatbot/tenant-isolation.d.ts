/**
 * Tenant Isolation Enforcement
 *
 * Explicitly enforces tenant isolation at the backend level.
 *
 * CRITICAL: AI system data MUST be scoped strictly by user_id.
 * NEVER allow cross-organization data access.
 */
/**
 * Verify user has access to a system
 *
 * @param userId - Authenticated user ID
 * @param systemId - System ID to verify access for
 * @returns true if user has access, false otherwise
 */
export declare function verifySystemAccess(userId: string, systemId: string): Promise<boolean>;
/**
 * Verify user has access to system for SYSTEM_ANALYSIS or ACTION modes
 *
 * @param userId - Authenticated user ID
 * @param systemId - System ID (optional)
 * @param mode - Chatbot mode
 * @param pageContext - Page context to determine if dashboard-level query
 * @returns true if access is valid, throws error if access denied
 */
export declare function enforceTenantIsolation(userId: string, systemId: string | undefined, mode: 'SYSTEM_ANALYSIS' | 'ACTION', pageContext?: {
    pageType?: string;
}): Promise<void>;
//# sourceMappingURL=tenant-isolation.d.ts.map