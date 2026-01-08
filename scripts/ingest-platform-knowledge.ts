/**
 * Platform Knowledge Ingestion Script
 * 
 * Processes all documentation files (.md) and creates embeddings for platform knowledge.
 * Stores embeddings in Pinecone index: platform-knowledge
 * 
 * Usage: npm run ingest-platform-knowledge
 */

import * as fs from 'fs';
import * as path from 'path';
import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAI } from 'openai';

// Load environment variables
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const OPEN_AI_KEY = process.env.OPEN_AI_KEY;

if (!PINECONE_API_KEY || !OPEN_AI_KEY) {
  throw new Error('PINECONE_API_KEY and OPEN_AI_KEY must be set in .env.local');
}

const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });
const openai = new OpenAI({ apiKey: OPEN_AI_KEY });

const INDEX_NAME = 'platform-knowledge';
const CHUNK_SIZE = 1000;
const OVERLAP = 200;

/**
 * Get all markdown files from the repository
 */
function getAllMarkdownFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, .git, .cursor, and other common directories
      if (!['node_modules', '.git', '.next', 'dist', 'build', '.cursor'].includes(file)) {
        getAllMarkdownFiles(filePath, fileList);
      }
    } else if (file.endsWith('.md')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Read and extract content from markdown file
 */
function readMarkdownFile(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return '';
  }
}

/**
 * Chunk text into smaller pieces for embedding
 */
function chunkText(text: string, chunkSize: number = CHUNK_SIZE, overlap: number = OVERLAP): string[] {
  // Ensure overlap is less than chunkSize to prevent infinite loops
  const safeOverlap = Math.min(overlap, Math.floor(chunkSize / 2));
  
  const chunks: string[] = [];
  let start = 0;
  const maxChunks = Math.ceil(text.length / (chunkSize - safeOverlap)) + 100; // Safety limit
  let iterations = 0;

  while (start < text.length && iterations < maxChunks) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);
    
    if (chunk.trim().length > 0) {
      chunks.push(chunk);
    }
    
    // Move start forward, ensuring we make progress
    const nextStart = end - safeOverlap;
    if (nextStart <= start) {
      // Safety check: ensure we always move forward
      start = end;
    } else {
      start = nextStart;
    }
    
    iterations++;
  }

  // Safety check: if we hit max iterations, log a warning
  if (iterations >= maxChunks) {
    console.warn(`   ⚠️  Hit max iterations while chunking (file may be very large)`);
  }

  return chunks.filter((chunk) => chunk.trim().length > 0);
}

/**
 * Generate embedding for text
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  return response.data[0].embedding;
}

/**
 * Extract metadata from file path
 */
function extractMetadata(filePath: string): {
  source: string;
  category: string;
  filename: string;
} {
  const relativePath = path.relative(process.cwd(), filePath);
  const filename = path.basename(filePath, '.md');
  
  // Categorize based on filename patterns
  // Check more specific patterns first to avoid conflicts
  let category = 'general';
  if (filename.includes('DISCOVERY') || filename.includes('discovery')) {
    category = 'discovery';
  } else if (filename.includes('RISK') || filename.includes('risk')) {
    category = 'risk-assessment';
  } else if (filename.includes('LIFECYCLE') || filename.includes('lifecycle')) {
    category = 'lifecycle-governance';
  } else if (filename.includes('GOVERNANCE') || filename.includes('governance')) {
    category = 'governance';
  } else if (filename.includes('DOCUMENTATION') || filename.includes('documentation')) {
    category = 'documentation';
  } else if (filename.includes('REGISTRY') || filename.includes('registry')) {
    category = 'registry';
  } else if (filename.includes('COMPLIANCE') || filename.includes('compliance')) {
    category = 'compliance';
  } else if (filename.includes('FEATURE') || filename.includes('feature')) {
    category = 'features';
  }

  return {
    source: relativePath,
    category,
    filename,
  };
}

/**
 * Process a single markdown file
 */
async function processFile(filePath: string): Promise<void> {
  console.log(`\n📄 Processing: ${filePath}`);

  // Check file size first (skip files larger than 10MB)
  try {
    const stats = fs.statSync(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);
    if (fileSizeMB > 10) {
      console.log(`   ⚠️  Skipping large file (${fileSizeMB.toFixed(2)}MB)`);
      return;
    }
  } catch (error) {
    console.log(`   ⚠️  Could not read file stats`);
  }

  const content = readMarkdownFile(filePath);
  if (!content.trim()) {
    console.log(`   ⚠️  Skipping empty file`);
    return;
  }

  // Additional safety check for content length
  if (content.length > 50_000_000) { // 50MB text limit
    console.log(`   ⚠️  Skipping extremely large file (${(content.length / 1024 / 1024).toFixed(2)}MB)`);
    return;
  }

  const metadata = extractMetadata(filePath);
  let chunks: string[];
  
  try {
    chunks = chunkText(content);
  } catch (error) {
    console.error(`   ❌ Error chunking file: ${error}`);
    return;
  }
  
  if (chunks.length === 0) {
    console.log(`   ⚠️  No valid chunks created`);
    return;
  }

  console.log(`   📦 Created ${chunks.length} chunks`);

  const index = pinecone.index(INDEX_NAME);
  const vectors = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = await generateEmbedding(chunk);

    vectors.push({
      id: `${metadata.filename}-chunk-${i}`,
      values: embedding,
      metadata: {
        text: chunk,
        source: metadata.source,
        category: metadata.category,
        filename: metadata.filename,
        chunk_index: i,
        total_chunks: chunks.length,
      },
    });

    // Batch upsert every 100 vectors
    if (vectors.length >= 100) {
      await index.upsert(vectors);
      console.log(`   ✅ Upserted batch of ${vectors.length} vectors`);
      vectors.length = 0;
    }
  }

  // Upsert remaining vectors
  if (vectors.length > 0) {
    await index.upsert(vectors);
    console.log(`   ✅ Upserted final batch of ${vectors.length} vectors`);
  }

  console.log(`   ✨ Completed: ${filePath}`);
}

/**
 * Main ingestion function
 */
async function ingestPlatformKnowledge() {
  console.log('🚀 Starting Platform Knowledge Ingestion...\n');
  console.log(`📚 Index: ${INDEX_NAME}`);
  console.log(`🔑 Using OpenAI model: text-embedding-3-small\n`);

  try {
    // Get all markdown files
    const mdFiles = getAllMarkdownFiles(process.cwd());
    console.log(`📋 Found ${mdFiles.length} markdown files\n`);

    if (mdFiles.length === 0) {
      console.log('⚠️  No markdown files found!');
      return;
    }

    // Process each file
    let processed = 0;
    for (const file of mdFiles) {
      try {
        await processFile(file);
        processed++;
      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error);
      }
    }

    console.log(`\n✨ Ingestion complete!`);
    console.log(`   📊 Processed: ${processed}/${mdFiles.length} files`);
    console.log(`   📦 Index: ${INDEX_NAME}`);
  } catch (error) {
    console.error('❌ Ingestion failed:', error);
    process.exit(1);
  }
}

// Run ingestion
ingestPlatformKnowledge().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

