/**
 * RAG Service - Retrieval Augmented Generation for Regulations
 * 
 * Provides semantic search over regulation documents stored in Pinecone.
 * Supports EU, UK, and MAS regulations in a unified index with metadata filtering.
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

export type RegulationType = 'EU' | 'UK' | 'MAS';

// Unified index name for all regulations
const INDEX_NAME = 'regulations';

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
 * Get regulation context chunks from Pinecone
 * 
 * @param query - User query text (e.g., assessment answers)
 * @param regulationType - Type of regulation to search (EU, UK, MAS)
 * @param topK - Number of chunks to return (default: 5)
 * @returns Concatenated context string from relevant chunks
 */
export async function getRegulationContextString(
  query: string,
  regulationType: RegulationType,
  topK: number = 5
): Promise<string> {
  try {
    if (!pinecone) {
      throw new Error('Pinecone client not initialized - missing PINECONE_API_KEY');
    }

    // Normalize query
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      return "No query provided.";
    }

    // Get the unified regulations index
    const index = pinecone.index(INDEX_NAME);

    // Generate embedding for the query
    console.log(`[RAG] Generating embedding for ${regulationType} query`);
    const embedding = await generateEmbedding(normalizedQuery);

    // Build filter to get only the specific regulation type
    const filter = {
      regulation_type: { $eq: regulationType }
    };

    // Query Pinecone with metadata filter
    console.log(`[RAG] ===== REGULATION QUERY =====`);
    console.log(`[RAG] Index: ${INDEX_NAME} (unified regulations index)`);
    console.log(`[RAG] Regulation Type: ${regulationType}`);
    console.log(`[RAG] Filter: ${JSON.stringify(filter, null, 2)}`);
    console.log(`[RAG] TopK: ${topK}`);
    console.log(`[RAG] Query: ${normalizedQuery.substring(0, 100)}${normalizedQuery.length > 100 ? '...' : ''}`);
    
    const queryResponse = await index.query({
      vector: embedding,
      topK: topK,
      includeMetadata: true,
      filter: filter,
    });
    
    console.log(`[RAG] Query Response: Found ${queryResponse.matches?.length || 0} matches`);

    // Extract context chunks from matches
    const chunks = queryResponse.matches
      ?.map((match) => {
        const metadata = match.metadata as { text?: string; regulation_type?: string };
        return metadata?.text || '';
      })
      .filter((text) => text.length > 0) || [];

    if (chunks.length === 0) {
      console.warn(`[RAG] No relevant chunks found for ${regulationType} query`);
      return "No relevant context found.";
    }

    console.log(`[RAG] Found ${chunks.length} relevant chunks for ${regulationType}`);
    if (chunks.length > 0) {
      console.log(`[RAG] First chunk preview: ${chunks[0].substring(0, 150)}...`);
    }
    console.log(`[RAG] ===== END REGULATION QUERY =====\n`);
    
    // Join chunks with double newline for readability
    return chunks.join('\n\n');
  } catch (error) {
    console.error(`[RAG] Error retrieving context for ${regulationType}:`, error);
    throw error;
  }
}

/**
 * Get regulation context as an array of chunks (for more detailed processing)
 */
export async function getRegulationContext(
  query: string,
  regulationType: RegulationType,
  topK: number = 5
): Promise<string[]> {
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

    // Build filter to get only the specific regulation type
    const filter = {
      regulation_type: { $eq: regulationType }
    };

    const queryResponse = await index.query({
      vector: embedding,
      topK: topK,
      includeMetadata: true,
      filter: filter,
    });

    const chunks = queryResponse.matches
      ?.map((match) => {
        const metadata = match.metadata as { text?: string };
        return metadata?.text || '';
      })
      .filter((text) => text.length > 0) || [];

    return chunks;
  } catch (error) {
    console.error(`[RAG] Error retrieving context chunks for ${regulationType}:`, error);
    throw error;
  }
}

