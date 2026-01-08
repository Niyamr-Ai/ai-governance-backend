"use strict";
/**
 * Organization System RAG Service - Retrieval Augmented Generation for Organization-Specific AI Systems
 *
 * Provides semantic search over organization's AI system data stored in Pinecone.
 * Answers questions about organization's specific systems, risks, assessments, etc.
 *
 * IMPORTANT: Always filters by org_id for tenant isolation and security.
 * TEMPORARY: Currently org_id maps 1:1 to user_id until true organizations are implemented.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserSystemContextString = getUserSystemContextString;
exports.getUserSystemContext = getUserSystemContext;
const pinecone_1 = require("@pinecone-database/pinecone");
const openai_1 = require("openai");
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const OPEN_AI_KEY = process.env.OPEN_AI_KEY;
// Initialize clients only if environment variables are available
let pinecone = null;
let openai = null;
if (PINECONE_API_KEY) {
    pinecone = new pinecone_1.Pinecone({ apiKey: PINECONE_API_KEY });
}
if (OPEN_AI_KEY) {
    openai = new openai_1.OpenAI({ apiKey: OPEN_AI_KEY });
}
const INDEX_NAME = 'user-systems';
/**
 * Generate embedding for a text query using OpenAI
 */
async function generateEmbedding(text) {
    if (!openai) {
        throw new Error('OpenAI client not initialized - missing OPEN_AI_KEY');
    }
    const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
    });
    return response.data[0].embedding;
}
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
async function getUserSystemContextString(query, orgId, topK = 5, systemId, entityType) {
    try {
        if (!pinecone) {
            throw new Error('Pinecone client not initialized - missing PINECONE_API_KEY');
        }
        if (!orgId) {
            throw new Error("orgId is required for organization system RAG queries");
        }
        const normalizedQuery = query.trim();
        if (!normalizedQuery) {
            return "No query provided.";
        }
        const index = pinecone.index(INDEX_NAME);
        // Generate embedding for the query
        console.log(`[Organization System RAG] Generating embedding for organization ${orgId}`);
        const embedding = await generateEmbedding(normalizedQuery);
        // Build filter - ALWAYS filter by org_id for security
        const filter = {
            org_id: { $eq: orgId }
        };
        // Add optional filters
        if (systemId) {
            filter.system_id = { $eq: systemId };
        }
        if (entityType) {
            filter.entity_type = { $eq: entityType };
        }
        // Query Pinecone
        console.log(`[Organization System RAG] Querying organization system chunks with filter:`, filter);
        const queryResponse = await index.query({
            vector: embedding,
            topK: topK,
            includeMetadata: true,
            filter: filter,
        });
        // Extract context chunks from matches
        const chunks = queryResponse.matches
            ?.map((match) => {
            const metadata = match.metadata;
            return metadata?.text || '';
        })
            .filter((text) => text.length > 0) || [];
        if (chunks.length === 0) {
            console.warn(`[User System RAG] No relevant chunks found for user ${userId}`);
            return "No relevant system data found.";
        }
        console.log(`[User System RAG] Found ${chunks.length} relevant chunks for user ${userId}`);
        // Join chunks with double newline for readability
        return chunks.join('\n\n');
    }
    catch (error) {
        console.error(`[User System RAG] Error retrieving context for user ${userId}:`, error);
        throw error;
    }
}
/**
 * Get user's AI system context as an array of chunks (for more detailed processing)
 */
async function getUserSystemContext(query, userId, topK = 5, systemId, entityType) {
    try {
        if (!pinecone) {
            throw new Error('Pinecone client not initialized - missing PINECONE_API_KEY');
        }
        if (!userId) {
            throw new Error("userId is required for user system RAG queries");
        }
        const normalizedQuery = query.trim();
        if (!normalizedQuery) {
            return [];
        }
        const index = pinecone.index(INDEX_NAME);
        const embedding = await generateEmbedding(normalizedQuery);
        // Build filter - ALWAYS filter by user_id for security
        const filter = {
            user_id: { $eq: userId }
        };
        if (systemId) {
            filter.system_id = { $eq: systemId };
        }
        if (entityType) {
            filter.entity_type = { $eq: entityType };
        }
        const queryResponse = await index.query({
            vector: embedding,
            topK: topK,
            includeMetadata: true,
            filter: filter,
        });
        const chunks = queryResponse.matches
            ?.map((match) => {
            const metadata = match.metadata;
            return {
                text: metadata?.text || '',
                system_id: metadata?.system_id,
                system_type: metadata?.system_type,
                entity_type: metadata?.entity_type,
                metadata: match.metadata,
            };
        })
            .filter((item) => item.text.length > 0) || [];
        return chunks;
    }
    catch (error) {
        console.error(`[User System RAG] Error retrieving context chunks for user ${userId}:`, error);
        throw error;
    }
}
//# sourceMappingURL=user-system-rag-service.js.map