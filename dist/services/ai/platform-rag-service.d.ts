/**
 * Platform RAG Service - Retrieval Augmented Generation for Platform Knowledge
 *
 * Provides semantic search over platform documentation and features.
 * Answers questions about how the platform works, features, terminology, etc.
 */
/**
 * Get platform knowledge context chunks from Pinecone
 *
 * @param query - User query text (e.g., "How do I create a risk assessment?")
 * @param topK - Number of chunks to return (default: 5)
 * @param category - Optional category filter (e.g., 'features', 'risk-assessment')
 * @returns Concatenated context string from relevant chunks
 */
export declare function getPlatformContextString(query: string, topK?: number, category?: string): Promise<string>;
/**
 * Get platform knowledge context as an array of chunks (for more detailed processing)
 */
export declare function getPlatformContext(query: string, topK?: number, category?: string): Promise<Array<{
    text: string;
    source: string;
    category?: string;
    filename?: string;
}>>;
//# sourceMappingURL=platform-rag-service.d.ts.map