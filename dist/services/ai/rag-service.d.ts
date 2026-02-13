/**
 * RAG Service - Retrieval Augmented Generation for Regulations
 *
 * Provides semantic search over regulation documents stored in Pinecone.
 * Supports EU, UK, and MAS regulations in a unified index with metadata filtering.
 */
export type RegulationType = 'EU' | 'UK' | 'MAS';
/**
 * Get regulation context chunks from Pinecone
 *
 * @param query - User query text (e.g., assessment answers)
 * @param regulationType - Type of regulation to search (EU, UK, MAS)
 * @param topK - Number of chunks to return (default: 5)
 * @returns Concatenated context string from relevant chunks
 */
export declare function getRegulationContextString(query: string, regulationType: RegulationType, topK?: number): Promise<string>;
/**
 * Get regulation context as an array of chunks (for more detailed processing)
 */
export declare function getRegulationContext(query: string, regulationType: RegulationType, topK?: number): Promise<string[]>;
//# sourceMappingURL=rag-service.d.ts.map