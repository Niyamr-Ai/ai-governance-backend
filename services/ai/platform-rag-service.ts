/**
 * Platform RAG Service - Retrieval Augmented Generation for Platform Knowledge
 * 
 * Provides semantic search over platform documentation and features.
 * Answers questions about how the platform works, features, terminology, etc.
 */

import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAI } from "openai";

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const OPEN_AI_KEY = process.env.OPEN_AI_KEY;

// Initialize clients only if environment variables are available
let pinecone: Pinecone | null = null;
let openai: OpenAI | null = null;

if (PINECONE_API_KEY) {
  pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });
}

if (OPEN_AI_KEY) {
  openai = new OpenAI({ apiKey: OPEN_AI_KEY });
}

const INDEX_NAME = 'platform-knowledge';

/**
 * Generate embedding for a text query using OpenAI
 */
async function generateEmbedding(text: string): Promise<number[]> {
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
export async function getPlatformContextString(
  query: string,
  topK: number = 5,
  category?: string
): Promise<string> {
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
        const metadata = match.metadata as { 
          text?: string; 
          source?: string;
          category?: string;
          filename?: string;
        };
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
  } catch (error) {
    console.error(`[Platform RAG] Error retrieving context:`, error);
    throw error;
  }
}

/**
 * Get platform knowledge context as an array of chunks (for more detailed processing)
 */
export async function getPlatformContext(
  query: string,
  topK: number = 5,
  category?: string
): Promise<Array<{ text: string; source: string; category?: string; filename?: string }>> {
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
        const metadata = match.metadata as { 
          text?: string;
          source?: string;
          category?: string;
          filename?: string;
        };
        return {
          text: metadata?.text || '',
          source: metadata?.source || 'unknown',
          category: metadata?.category,
          filename: metadata?.filename,
        };
      })
      .filter((item) => item.text.length > 0) || [];

    return chunks;
  } catch (error) {
    console.error(`[Platform RAG] Error retrieving context chunks:`, error);
    throw error;
  }
}

