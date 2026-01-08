/**
 * Test RAG Service
 * 
 * Tests the RAG service to verify it can retrieve context from Pinecone.
 * 
 * Usage: npm run test-rag
 */

import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local FIRST (before any imports that need them)
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        process.env[key.trim()] = value;
      }
    }
  });
  console.log('✅ Loaded environment variables from .env.local');
} else {
  console.error('❌ .env.local file not found!');
  process.exit(1);
}

async function testRAG() {
  // Dynamic import AFTER env vars are loaded
  const { getRegulationContextString, getRegulationContext } = await import('../services/ai/rag-service');

  console.log('\n🧪 Testing RAG Service...\n');

  // Test queries for each regulation type
  const testQueries = [
    {
      query: 'credit scoring system with personal data high risk obligations',
      type: 'EU' as const,
      description: 'EU AI Act - Credit Scoring',
    },
    {
      query: 'foundation model safety testing requirements',
      type: 'UK' as const,
      description: 'UK AI Act - Foundation Models',
    },
    {
      query: 'governance oversight financial sector AI system',
      type: 'MAS' as const,
      description: 'MAS Guidelines - Governance',
    },
  ];

  for (const test of testQueries) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${test.description}`);
    console.log(`Query: "${test.query}"`);
    console.log(`Regulation Type: ${test.type}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      // Test getRegulationContextString (returns concatenated string)
      console.log('📝 Testing getRegulationContextString()...');
      const startTime1 = Date.now();
      const contextString = await getRegulationContextString(test.query, test.type, 3);
      const duration1 = Date.now() - startTime1;

      console.log(`✅ Retrieved context in ${duration1}ms`);
      console.log(`📊 Context length: ${contextString.length} characters`);
      
      if (contextString.includes('No relevant context found')) {
        console.log('⚠️  Warning: No context found - check if indexes are populated');
      } else {
        console.log(`\n📄 Context preview (first 500 chars):`);
        console.log(contextString.substring(0, 500) + (contextString.length > 500 ? '...' : ''));
      }

      // Test getRegulationContext (returns array)
      console.log('\n📝 Testing getRegulationContext()...');
      const startTime2 = Date.now();
      const contextArray = await getRegulationContext(test.query, test.type, 3);
      const duration2 = Date.now() - startTime2;

      console.log(`✅ Retrieved ${contextArray.length} chunks in ${duration2}ms`);
      if (contextArray.length > 0) {
        console.log(`📊 Chunk details:`);
        contextArray.forEach((chunk, idx) => {
          console.log(`   Chunk ${idx + 1}: ${chunk.length} characters`);
        });
      }

      console.log(`\n✅ ${test.description} test PASSED`);
    } catch (error: any) {
      console.error(`\n❌ ${test.description} test FAILED`);
      console.error(`Error: ${error.message}`);
      if (error.stack) {
        console.error(`Stack: ${error.stack}`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 RAG Service Test Complete!');
  console.log('='.repeat(60));
  console.log('\n💡 If tests passed, your RAG service is working correctly!');
  console.log('   The compliance APIs will now use this service automatically.');
}

// Run tests
testRAG().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
