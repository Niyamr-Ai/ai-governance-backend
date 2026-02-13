/**
 * Chat History Service
 *
 * Manages conversation history storage and retrieval for the AI Governance Copilot.
 *
 * Features:
 * - Stores user queries and bot responses in Supabase
 * - Indexes conversations to Pinecone for semantic search
 * - HYBRID RETRIEVAL: Combines SQL (recent messages) + Pinecone (semantic search of older conversations)
 * - Retrieves conversation history for context (last 3 messages from SQL + top 5 semantically relevant from Pinecone)
 * - Supports session management (multiple conversation sessions per org)
 * - Tenant isolation via org_id
 * - System association for report-related conversations
 * - Automatic deduplication of combined results
 * - Token budget management for combined history
 *
 * Based on doc-intel-backend implementation, adapted for ai-governance architecture.
 */
import type { ChatbotMode, PageContext } from '../../../types/chatbot';
export interface ChatHistoryEntry {
    id: string;
    org_id: string;
    session_id: string;
    session_title?: string;
    system_id?: string;
    user_query: string;
    bot_response: string;
    chatbot_mode?: ChatbotMode;
    page_context?: PageContext;
    user_id?: string;
    created_at: string;
}
export interface LogChatHistoryParams {
    orgId: string;
    userQuery: string;
    botResponse: string;
    sessionId?: string;
    sessionTitle?: string;
    systemId?: string;
    chatbotMode?: ChatbotMode;
    pageContext?: PageContext;
    userId?: string;
}
/**
 * Log a chat conversation to Supabase
 *
 * @param params - Chat history parameters
 * @returns Promise<void>
 */
export declare function logChatHistory(params: LogChatHistoryParams): Promise<void>;
/**
 * Get chat history for an organization and session
 *
 * @param orgId - Organization ID (required for tenant isolation)
 * @param sessionId - Session ID (optional, defaults to 'default')
 * @param systemId - Optional system ID filter
 * @param limit - Number of recent messages to return (default: 3)
 * @returns Promise<ChatHistoryEntry[]>
 */
export declare function getChatHistory(orgId: string, sessionId?: string, systemId?: string, limit?: number): Promise<ChatHistoryEntry[]>;
/**
 * Get recent chat history formatted for prompt inclusion
 * Uses TRUE HYBRID approach: SQL for recent messages + Pinecone RAG for semantic search of older conversations
 * Automatically truncates to fit within token budget
 *
 * @param orgId - Organization ID
 * @param sessionId - Session ID (optional)
 * @param systemId - Optional system ID filter
 * @param limit - Number of recent messages from SQL (default: 3)
 * @param userQuery - Current user query (for semantic search)
 * @param tokenBudget - Maximum tokens allowed for history (optional, will use all available if not provided)
 * @returns Promise<string> - Formatted conversation history string (truncated if needed)
 */
export declare function getFormattedChatHistory(orgId: string, sessionId?: string, systemId?: string, limit?: number, userQuery?: string, tokenBudget?: number): Promise<string>;
/**
 * Get or generate session title
 * If session has no title, generates one from the first user query
 *
 * @param orgId - Organization ID
 * @param sessionId - Session ID
 * @returns Promise<string | null>
 */
export declare function getSessionTitle(orgId: string, sessionId: string): Promise<string | null>;
//# sourceMappingURL=chat-history-service.d.ts.map