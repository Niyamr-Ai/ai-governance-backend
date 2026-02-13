/**
 * Chat History RAG Service - Retrieval Augmented Generation for Chat History
 *
 * Provides semantic search over conversation history stored in Pinecone.
 * Enables context-aware retrieval of past conversations for better chatbot responses.
 *
 * IMPORTANT: Always filters by org_id and session_id for tenant isolation and security.
 */
/**
 * Get chat history context chunks from Pinecone
 *
 * @param query - User query text (e.g., "What did we discuss about risk assessment?")
 * @param orgId - Organization ID (REQUIRED for tenant isolation)
 * @param sessionId - Session ID (optional, defaults to 'default')
 * @param topK - Number of chunks to return (default: 5)
 * @param systemId - Optional filter by specific system ID
 * @returns Concatenated context string from relevant chat history chunks
 */
export declare function getChatHistoryContextString(query: string, orgId: string, sessionId?: string, topK?: number, systemId?: string): Promise<string>;
/**
 * Get chat history context as an array of chunks (for more detailed processing)
 */
export declare function getChatHistoryContext(query: string, orgId: string, sessionId?: string, topK?: number, systemId?: string): Promise<Array<{
    user_query: string;
    bot_response: string;
    created_at?: string;
    metadata?: any;
}>>;
//# sourceMappingURL=chat-history-rag-service.d.ts.map