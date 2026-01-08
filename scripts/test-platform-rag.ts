/**
 * Test Platform RAG Service
 * 
 * Tests the Platform Knowledge RAG service to verify it can retrieve
 * relevant platform documentation and feature information.
 * 
 * Usage: npm run test-platform-rag
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

async function testPlatformRAG() {
  // Dynamic import AFTER env vars are loaded
  const { getPlatformContextString, getPlatformContext } = await import('../services/ai/platform-rag-service');

  console.log('🧪 Testing Platform Knowledge RAG Service\n');
  console.log('='.repeat(60));

  const testQueries = [
    {
      name: 'Feature Questions',
      queries: [
        'How do I create a risk assessment?',
        'What is lifecycle governance?',
        'How does the discovery feature work?',
        'What are governance tasks?',
      ],
    },
    {
      name: 'Terminology Questions',
      queries: [
        'What does partial compliance mean?',
        'What is a blocking task?',
        'What are the lifecycle stages?',
        'What does shadow AI mean?',
      ],
    },
    {
      name: 'Workflow Questions',
      queries: [
        'How does the risk assessment workflow work?',
        'How do I submit a risk assessment for review?',
        'What happens when I approve a risk assessment?',
        'How do lifecycle transitions work?',
      ],
    },
    {
      name: 'Category-Specific Questions',
      queries: [
        {
          query: 'How do risk assessments work?',
          category: 'risk-assessment',
        },
        {
          query: 'What is lifecycle governance?',
          category: 'lifecycle-governance',
        },
        {
          query: 'How does discovery work?',
          category: 'discovery',
        },
      ],
    },
  ];

  let totalTests = 0;
  let passedTests = 0;

  for (const testGroup of testQueries) {
    console.log(`\n📋 ${testGroup.name}`);
    console.log('-'.repeat(60));

    for (const queryItem of testGroup.queries) {
      totalTests++;
      const query = typeof queryItem === 'string' ? queryItem : queryItem.query;
      const category = typeof queryItem === 'object' ? queryItem.category : undefined;

      try {
        console.log(`\n❓ Query: "${query}"`);
        if (category) {
          console.log(`   Category filter: ${category}`);
        }

        const context = await getPlatformContextString(query, 5, category);

        if (context && context.length > 0 && !context.includes('No relevant')) {
          console.log(`   ✅ Success - Retrieved ${context.length} characters of context`);
          console.log(`   📄 Preview: ${context.substring(0, 150)}...`);
          passedTests++;
        } else {
          console.log(`   ⚠️  Warning - No relevant context found`);
          console.log(`   Response: ${context}`);
        }
      } catch (error: any) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
  }

  // Test array response
  console.log(`\n\n📋 Testing Array Response Function`);
  console.log('-'.repeat(60));
  try {
    totalTests++;
    const chunks = await getPlatformContext('How do I create a compliance assessment?', 3);
    if (chunks && chunks.length > 0) {
      console.log(`   ✅ Success - Retrieved ${chunks.length} chunks`);
      chunks.forEach((chunk, idx) => {
        console.log(`   📄 Chunk ${idx + 1}: ${chunk.text.substring(0, 100)}...`);
        console.log(`      Source: ${chunk.source}`);
        if (chunk.category) {
          console.log(`      Category: ${chunk.category}`);
        }
      });
      passedTests++;
    } else {
      console.log(`   ⚠️  Warning - No chunks returned`);
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Summary
  console.log(`\n\n${'='.repeat(60)}`);
  console.log('📊 Test Summary');
  console.log(`${'='.repeat(60)}`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${passedTests}`);
  console.log(`   Failed: ${totalTests - passedTests}`);
  console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log(`\n   ✨ All tests passed!`);
  } else if (passedTests > 0) {
    console.log(`\n   ⚠️  Some tests had issues - check the output above`);
  } else {
    console.log(`\n   ❌ All tests failed - check your Pinecone index and API keys`);
  }
}

// Run tests
testPlatformRAG().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

