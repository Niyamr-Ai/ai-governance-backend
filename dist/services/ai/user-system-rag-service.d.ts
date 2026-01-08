/**
 * Organization System RAG Service - Retrieval Augmented Generation for Organization-Specific AI Systems
 *
 * Provides semantic search over organization's AI system data stored in Pinecone.
 * Answers questions about organization's specific systems, risks, assessments, etc.
 *
 * IMPORTANT: Always filters by org_id for tenant isolation and security.
 * TEMPORARY: Currently org_id maps 1:1 to user_id until true organizations are implemented.
 */
/**
 * Get organization's AI system context chunks from Pinecone
 *
 * @param query - Query text (e.g., "What risks exist in our resume screening AI?")
 * @param orgId - Organization ID (REQUIRED for tenant isolation)
 * @param topK - Number of chunks to return (default: 5)
 * @param systemId - Optional filter by specific system ID
 * @param entityType - Optional filter by entity type (e.g., 'risk_assessment', 'governance_task')
 * @returns Concatenated context string from relevant chunks
 */
export declare function getUserSystemContextString(query: string, orgId: string, topK?: number, systemId?: string, entityType?: string): Promise<string>;
/**
 * Get user's AI system context as an array of chunks (for more detailed processing)
 */
export declare function getUserSystemContext(query: string, userId: string, topK?: number, systemId?: string, entityType?: string): Promise<Array<{
    text: string;
    system_id?: string;
    system_type?: string;
    entity_type?: string;
    metadata?: any;
}>>;
//# sourceMappingURL=user-system-rag-service.d.ts.map