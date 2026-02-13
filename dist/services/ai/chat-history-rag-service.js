"use strict";
/**
 * Chat History RAG Service - Retrieval Augmented Generation for Chat History
 *
 * Provides semantic search over conversation history stored in Pinecone.
 * Enables context-aware retrieval of past conversations for better chatbot responses.
 *
 * IMPORTANT: Always filters by org_id and session_id for tenant isolation and security.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChatHistoryContextString = getChatHistoryContextString;
exports.getChatHistoryContext = getChatHistoryContext;
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
const INDEX_NAME = 'chat-history';
/**
 * Generate embedding for a text query using OpenAI
 */
async function generateEmbedding(text) {
    if (!openai) {
        throw new Error('OpenAI client not initialized - missing OPEN_AI_KEY');
    }
    const response = openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
    });
    return (await response).data[0].embedding;
}
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
async function getChatHistoryContextString(query, orgId, sessionId = 'default', topK = 5, systemId) {
    try {
        if (!pinecone) {
            throw new Error('Pinecone client not initialized - missing PINECONE_API_KEY');
        }
        if (!orgId) {
            throw new Error("orgId is required for chat history RAG queries");
        }
        const normalizedQuery = query.trim();
        if (!normalizedQuery) {
            return "No query provided.";
        }
        const index = pinecone.index(INDEX_NAME);
        // Generate embedding for the query
        console.log(`[Chat History RAG] Generating embedding for org ${orgId}, session ${sessionId}`);
        const embedding = await generateEmbedding(normalizedQuery);
        // Build filter - ALWAYS filter by org_id and session_id for security
        const filter = {
            org_id: { $eq: orgId },
            session_id: { $eq: sessionId }
        };
        // Add optional system_id filter
        if (systemId) {
            filter.system_id = { $eq: systemId };
        }
        // Query Pinecone
        console.log(`[Chat History RAG] ===== CHAT HISTORY QUERY =====`);
        console.log(`[Chat History RAG] Index: ${INDEX_NAME}`);
        console.log(`[Chat History RAG] Org ID: ${orgId}`);
        console.log(`[Chat History RAG] Session ID: ${sessionId}`);
        console.log(`[Chat History RAG] System ID: ${systemId || 'N/A'}`);
        console.log(`[Chat History RAG] Filter: ${JSON.stringify(filter, null, 2)}`);
        console.log(`[Chat History RAG] TopK: ${topK}`);
        console.log(`[Chat History RAG] Query: ${normalizedQuery.substring(0, 100)}${normalizedQuery.length > 100 ? '...' : ''}`);
        const queryResponse = await index.query({
            vector: embedding,
            topK: topK,
            includeMetadata: true,
            filter: filter,
        });
        console.log(`[Chat History RAG] Query Response: Found ${queryResponse.matches?.length || 0} matches`);
        // Extract context chunks from matches
        const chunks = queryResponse.matches
            ?.map((match) => {
            const metadata = match.metadata;
            // Combine user query and bot response for context
            if (metadata.user_query && metadata.bot_response) {
                return `User: ${metadata.user_query}\nAssistant: ${metadata.bot_response}`;
            }
            return '';
        })
            .filter((text) => text.length > 0) || [];
        if (chunks.length === 0) {
            console.warn(`[Chat History RAG] No relevant chat history found for org ${orgId}, session ${sessionId}`);
            return "No relevant chat history found.";
        }
        console.log(`[Chat History RAG] Found ${chunks.length} relevant chat history chunks`);
        if (chunks.length > 0) {
            console.log(`[Chat History RAG] First chunk preview: ${chunks[0].substring(0, 150)}...`);
        }
        console.log(`[Chat History RAG] ===== END CHAT HISTORY QUERY =====\n`);
        // Join chunks with double newline for readability
        return chunks.join('\n\n');
    }
    catch (error) {
        console.error(`[Chat History RAG] Error retrieving chat history context:`, error);
        throw error;
    }
}
/**
 * Get chat history context as an array of chunks (for more detailed processing)
 */
async function getChatHistoryContext(query, orgId, sessionId = 'default', topK = 5, systemId) {
    try {
        if (!pinecone) {
            throw new Error('Pinecone client not initialized - missing PINECONE_API_KEY');
        }
        if (!orgId) {
            throw new Error("orgId is required for chat history RAG queries");
        }
        const normalizedQuery = query.trim();
        if (!normalizedQuery) {
            return [];
        }
        const index = pinecone.index(INDEX_NAME);
        const embedding = await generateEmbedding(normalizedQuery);
        // Build filter - ALWAYS filter by org_id and session_id for security
        const filter = {
            org_id: { $eq: orgId },
            session_id: { $eq: sessionId }
        };
        if (systemId) {
            filter.system_id = { $eq: systemId };
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
                user_query: metadata?.user_query || '',
                bot_response: metadata?.bot_response || '',
                created_at: metadata?.created_at,
                metadata: match.metadata,
            };
        })
            .filter((item) => item.user_query.length > 0 && item.bot_response.length > 0) || [];
        return chunks;
    }
    catch (error) {
        console.error(`[Chat History RAG] Error retrieving chat history chunks:`, error);
        throw error;
    }
}
//# sourceMappingURL=chat-history-rag-service.js.map