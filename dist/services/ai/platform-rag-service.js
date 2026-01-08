"use strict";
/**
 * Platform RAG Service - Retrieval Augmented Generation for Platform Knowledge
 *
 * Provides semantic search over platform documentation and features.
 * Answers questions about how the platform works, features, terminology, etc.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlatformContextString = getPlatformContextString;
exports.getPlatformContext = getPlatformContext;
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
const INDEX_NAME = 'platform-knowledge';
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
 * Get platform knowledge context chunks from Pinecone
 *
 * @param query - User query text (e.g., "How do I create a risk assessment?")
 * @param topK - Number of chunks to return (default: 5)
 * @param category - Optional category filter (e.g., 'features', 'risk-assessment')
 * @returns Concatenated context string from relevant chunks
 */
async function getPlatformContextString(query, topK = 5, category) {
    try {
        if (!pinecone) {
            throw new Error('Pinecone client not initialized - missing PINECONE_API_KEY');
        }
        const normalizedQuery = query.trim();
        if (!normalizedQuery) {
            return "No query provided.";
        }
        const index = pinecone.index(INDEX_NAME);
        // Generate embedding for the query
        console.log(`[Platform RAG] Generating embedding for query`);
        const embedding = await generateEmbedding(normalizedQuery);
        // Build filter if category is provided
        const filter = category ? { category: { $eq: category } } : undefined;
        // Query Pinecone
        console.log(`[Platform RAG] Querying platform knowledge chunks`);
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
            console.warn(`[Platform RAG] No relevant chunks found`);
            return "No relevant platform knowledge found.";
        }
        console.log(`[Platform RAG] Found ${chunks.length} relevant chunks`);
        // Join chunks with double newline for readability
        return chunks.join('\n\n');
    }
    catch (error) {
        console.error(`[Platform RAG] Error retrieving context:`, error);
        throw error;
    }
}
/**
 * Get platform knowledge context as an array of chunks (for more detailed processing)
 */
async function getPlatformContext(query, topK = 5, category) {
    try {
        if (!pinecone) {
            throw new Error('Pinecone client not initialized - missing PINECONE_API_KEY');
        }
        const normalizedQuery = query.trim();
        if (!normalizedQuery) {
            return [];
        }
        const index = pinecone.index(INDEX_NAME);
        const embedding = await generateEmbedding(normalizedQuery);
        const filter = category ? { category: { $eq: category } } : undefined;
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
                source: metadata?.source || 'unknown',
                category: metadata?.category,
                filename: metadata?.filename,
            };
        })
            .filter((item) => item.text.length > 0) || [];
        return chunks;
    }
    catch (error) {
        console.error(`[Platform RAG] Error retrieving context chunks:`, error);
        throw error;
    }
}
//# sourceMappingURL=platform-rag-service.js.map