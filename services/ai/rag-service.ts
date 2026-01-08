/**
 * RAG Service - Retrieval Augmented Generation for Regulations
 * 
 * Provides semantic search over regulation documents stored in Pinecone.
 * Supports EU, UK, and MAS regulations with separate indexes.
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

// Map regulation types to Pinecone index names
const INDEX_MAP: Record<RegulationType, string> = {
  'EU': 'eu-ai-act',
  'UK': 'uk-ai-act',
  'MAS': 'mas-ai-act',
};

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

    // Get the appropriate index
    const indexName = INDEX_MAP[regulationType];
    const index = pinecone.index(indexName);

    // Generate embedding for the query
    console.log(`[RAG] Generating embedding for ${regulationType} query`);
    const embedding = await generateEmbedding(normalizedQuery);

    // Query Pinecone
    console.log(`[RAG] Querying ${regulationType} regulation chunks from index: ${indexName}`);
    const queryResponse = await index.query({
      vector: embedding,
      topK: topK,
      includeMetadata: true,
    });

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

    const indexName = INDEX_MAP[regulationType];
    const index = pinecone.index(indexName);

    const embedding = await generateEmbedding(normalizedQuery);

    const queryResponse = await index.query({
      vector: embedding,
      topK: topK,
      includeMetadata: true,
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

