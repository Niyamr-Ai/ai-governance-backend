/**
 * Regulation PDF Ingestion Script
 * 
 * Processes PDF regulation files and stores them as embeddings in Pinecone.
 * 
 * Usage: npm run ingest-regulations
 */

import * as fs from 'fs';
import * as path from 'path';
import pdf from 'pdf-parse';
import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAI } from 'openai';

// Load environment variables from .env.local or .env
// tsx automatically loads .env.local, but we'll ensure it's loaded
if (process.env.NODE_ENV !== 'production') {
  // Try .env.local first, then .env
  const envFiles = ['.env.local', '.env'];
  
  for (const envFile of envFiles) {
    try {
      const envPath = path.resolve(process.cwd(), envFile);
      if (fs.existsSync(envPath)) {
        console.log(`📄 Loading environment variables from ${envFile}`);
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split('\n').forEach((line) => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
              const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
              if (!process.env[key.trim()]) {
                process.env[key.trim()] = value;
              }
            }
          }
        });
        break; // Stop after loading first file found
      }
    } catch (error) {
      console.warn(`Warning: Could not load ${envFile}:`, error);
    }
  }
}

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
if (!PINECONE_API_KEY) {
  throw new Error('PINECONE_API_KEY is missing from .env or .env.local file');
}

const OPEN_AI_KEY = process.env.OPEN_AI_KEY;
if (!OPEN_AI_KEY) {
  throw new Error('OPEN_AI_KEY is missing from .env or .env.local file');
}

const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });
const openai = new OpenAI({ apiKey: OPEN_AI_KEY });

// Regulation file configuration
interface RegulationFile {
  path: string;
  type: 'EU' | 'UK' | 'MAS';
}

// Unified index name for all regulations
const INDEX_NAME = 'regulations';

const REGULATION_FILES: RegulationFile[] = [
  {
    path: path.join(process.cwd(), 'Regulations_files', 'eu_ai_act.pdf'),
    type: 'EU',
  },
  {
    path: path.join(process.cwd(), 'Regulations_files', 'uk_act.pdf'),
    type: 'UK',
  },
  {
    path: path.join(process.cwd(), 'Regulations_files', 'mas_act_1.pdf'),
    type: 'MAS',
  },
  {
    path: path.join(process.cwd(), 'Regulations_files', 'mas_act_2.pdf'),
    type: 'MAS',
  },
];

// Chunking configuration
const CHUNK_SIZE = 1000; // characters per chunk
const CHUNK_OVERLAP = 200; // characters overlap between chunks

/**
 * Extract text from PDF file
 */
async function extractTextFromPDF(filePath: string): Promise<string> {
  console.log(`📄 Reading PDF: ${path.basename(filePath)}`);
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);
  return data.text;
}

/**
 * Split text into chunks with overlap
 */
function chunkText(text: string, chunkSize: number = CHUNK_SIZE, overlap: number = CHUNK_OVERLAP): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();
    
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    
    start += chunkSize - overlap;
  }

  return chunks;
}

/**
 * Generate embedding for a text chunk
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  
  return response.data[0].embedding;
}

/**
 * Process a single regulation file
 */
async function processRegulationFile(file: RegulationFile): Promise<number> {
  try {
    // Check if file exists
    if (!fs.existsSync(file.path)) {
      console.error(`❌ File not found: ${file.path}`);
      return 0;
    }

    console.log(`\n🔄 Processing ${file.type} regulation: ${path.basename(file.path)}`);

    // Extract text from PDF
    const text = await extractTextFromPDF(file.path);
    console.log(`   Extracted ${text.length} characters`);

    // Split into chunks
    const chunks = chunkText(text);
    console.log(`   Created ${chunks.length} chunks`);

    // Get Pinecone index (unified regulations index)
    const index = pinecone.index(INDEX_NAME);

    // Process chunks in batches to avoid rate limits
    const BATCH_SIZE = 10;
    let totalUpserted = 0;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      
      console.log(`   Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)} (${batch.length} chunks)`);

      // Generate embeddings for batch
      const embeddings = await Promise.all(
        batch.map((chunk) => generateEmbedding(chunk))
      );

      // Prepare vectors for Pinecone
      const vectors = batch.map((chunk, idx) => ({
        id: `${file.type}-${path.basename(file.path)}-chunk-${i + idx}`,
        values: embeddings[idx],
        metadata: {
          text: chunk,
          regulation_type: file.type,
          source_file: path.basename(file.path),
          chunk_index: i + idx,
        },
      }));

      // Upsert to Pinecone
      await index.upsert(vectors);
      totalUpserted += vectors.length;

      // Small delay to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(`✅ Successfully ingested ${totalUpserted} chunks from ${path.basename(file.path)}`);
    return totalUpserted;
  } catch (error) {
    console.error(`❌ Error processing ${file.path}:`, error);
    throw error;
  }
}

/**
 * Main ingestion function
 */
async function ingestRegulations() {
  console.log('🚀 Starting regulation ingestion...\n');
  console.log(`📋 Index: ${INDEX_NAME} (unified regulations index)`);
  console.log('📋 Files to process:');
  REGULATION_FILES.forEach((file) => {
    console.log(`   - ${file.type}: ${path.basename(file.path)}`);
  });
  console.log('');

  const stats: Record<string, number> = {
    EU: 0,
    UK: 0,
    MAS: 0,
  };

  try {
    // Process each regulation file
    for (const file of REGULATION_FILES) {
      const count = await processRegulationFile(file);
      stats[file.type] += count;
    }

    // Print summary
    console.log('\n📊 Ingestion Summary:');
    console.log(`   EU: ${stats.EU} chunks`);
    console.log(`   UK: ${stats.UK} chunks`);
    console.log(`   MAS: ${stats.MAS} chunks`);
    console.log(`   Total: ${stats.EU + stats.UK + stats.MAS} chunks`);

    console.log('\n✅ Ingestion complete!');
    console.log('\n💡 Next steps:');
    console.log('   1. Verify indexes in Pinecone dashboard');
    console.log('   2. Test RAG service with API routes');
    console.log('   3. Chatbot developer can now use the RAG service');
  } catch (error) {
    console.error('\n❌ Ingestion failed:', error);
    process.exit(1);
  }
}

// Run ingestion
ingestRegulations().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

