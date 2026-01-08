/**
 * Context Providers
 *
 * Context provider functions for each chatbot mode with COMPLETE RAG integration.
 *
 * EXPLAIN mode:
 *   - Regulation RAG: For regulatory questions (EU/UK/MAS)
 *   - Platform RAG: For platform features, workflows, concepts
 *   - NEVER accesses user system data
 *
 * SYSTEM_ANALYSIS mode:
 *   - User System RAG: PRIMARY source (tenant-isolated by userId)
 *   - Regulation RAG: SUPPORTING context only
 *   - Strict tenant isolation enforced
 *
 * ACTION mode:
 *   - Platform RAG: ONLY source for workflows and guidance
 *   - Database: For pending tasks and system state
 *   - NEVER analyzes systems or cites regulations
 *
 * SAFETY GUARDRAILS:
 * - Never provides legal advice or compliance determinations
 * - Graceful fallback when any RAG fails
 * - Strict tenant isolation via userId filtering
 * - Clear confidence indicators for data completeness
 * - Mode-aware RAG usage prevents data leakage
 */
import type { ExplainContext, SystemAnalysisContext, ActionContext, PageContext } from '../../../types/chatbot';
/**
 * Get context for EXPLAIN mode
 *
 * Uses both Regulation RAG and Platform RAG based on question type:
 * - Regulatory questions: Use Regulation RAG for EU/UK/MAS content
 * - Platform questions: Use Platform RAG for features, workflows, concepts
 *
 * NEVER accesses user-specific system data in EXPLAIN mode.
 *
 * @param userMessage - The user's question
 * @param pageContext - Current page context
 * @returns ExplainContext with relevant educational content from RAG
 */
export declare function getExplainContext(userMessage: string, pageContext: PageContext): Promise<ExplainContext>;
/**
 * Get context for SYSTEM_ANALYSIS mode
 *
 * Uses User System RAG as PRIMARY source and Regulation RAG as SUPPORTING context.
 * Maintains strict tenant isolation and confidence indicators.
 *
 * CRITICAL: Always enforces tenant isolation via userId filtering.
 *
 * @param userMessage - The user's question
 * @param pageContext - Current page context (must include systemId)
 * @param userId - Authenticated user ID (REQUIRED for tenant isolation)
 * @returns SystemAnalysisContext with system and regulatory data
 */
export declare function getSystemAnalysisContext(userMessage: string, pageContext: PageContext, userId: string): Promise<SystemAnalysisContext>;
/**
 * Get context for ACTION mode
 *
 * Uses Platform RAG to provide workflow guidance and next steps.
 * Combines RAG knowledge with current system state from database.
 *
 * DOES NOT analyze systems or cite regulations - focuses on actionable steps.
 *
 * @param userMessage - The user's question
 * @param pageContext - Current page context (may include systemId)
 * @param userId - Authenticated user ID (for tenant isolation)
 * @returns ActionContext with workflow and task information
 */
export declare function getActionContext(userMessage: string, pageContext: PageContext, userId: string): Promise<ActionContext>;
//# sourceMappingURL=context-providers.d.ts.map