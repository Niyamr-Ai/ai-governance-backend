/**
 * Test User System RAG Service
 * 
 * Tests the User System RAG service to verify it can retrieve
 * user-specific AI system data with proper tenant isolation.
 * 
 * Usage: npm run test-user-system-rag
 * 
 * Note: Requires a valid user ID. You can get one from your Supabase auth.users table.
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

// You can set a test user ID here or pass it as an argument
const TEST_USER_ID = process.argv[2] || process.env.TEST_USER_ID;

async function testUserSystemRAG() {
  // Dynamic import AFTER env vars are loaded
  const { getUserSystemContextString, getUserSystemContext } = await import('../services/ai/user-system-rag-service');
  console.log('🧪 Testing User System RAG Service\n');
  console.log('='.repeat(60));

  if (!TEST_USER_ID) {
    console.log('❌ Error: No user ID provided');
    console.log('\nUsage:');
    console.log('  npm run test-user-system-rag -- <user-id>');
    console.log('  or set TEST_USER_ID in .env.local');
    console.log('\nTo get a user ID, check your Supabase auth.users table');
    process.exit(1);
  }

  console.log(`👤 Testing with User ID: ${TEST_USER_ID}\n`);

  const testQueries = [
    {
      name: 'System Overview Questions',
      queries: [
        'What AI systems do I have?',
        'What is the status of my systems?',
        'What are my compliance assessments?',
      ],
    },
    {
      name: 'Risk Questions',
      queries: [
        'What risks exist in my systems?',
        'What risk assessments do I have?',
        'What is my overall risk level?',
      ],
    },
    {
      name: 'Compliance Questions',
      queries: [
        'What compliance gaps do I have?',
        'What governance tasks are pending?',
        'What systems need attention?',
      ],
    },
    {
      name: 'Specific System Questions',
      queries: [
        {
          query: 'What risks exist in my resume screening system?',
          systemId: undefined, // Will search across all systems
        },
        {
          query: 'What is the compliance status?',
          systemId: undefined,
        },
      ],
    },
    {
      name: 'Entity Type Filtering',
      queries: [
        {
          query: 'What risk assessments do I have?',
          entityType: 'risk_assessment',
        },
        {
          query: 'What automated risk assessments exist?',
          entityType: 'automated_risk_assessment',
        },
        {
          query: 'What governance tasks are pending?',
          entityType: 'governance_task',
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
      const systemId = typeof queryItem === 'object' ? queryItem.systemId : undefined;
      const entityType = typeof queryItem === 'object' ? queryItem.entityType : undefined;

      try {
        console.log(`\n❓ Query: "${query}"`);
        if (systemId) {
          console.log(`   System ID filter: ${systemId}`);
        }
        if (entityType) {
          console.log(`   Entity type filter: ${entityType}`);
        }

        const context = await getUserSystemContextString(
          query,
          TEST_USER_ID, // TEMPORARY: using userId as orgId during transition
          5,
          systemId,
          entityType
        );

        if (context && context.length > 0 && !context.includes('No relevant')) {
          console.log(`   ✅ Success - Retrieved ${context.length} characters of context`);
          console.log(`   📄 Preview: ${context.substring(0, 200)}...`);
          passedTests++;
        } else {
          console.log(`   ⚠️  Warning - No relevant context found`);
          console.log(`   Response: ${context}`);
          console.log(`   Note: This might be normal if the user has no systems yet`);
        }
      } catch (error: any) {
        console.log(`   ❌ Error: ${error.message}`);
        if (error.message.includes('userId is required')) {
          console.log(`   Note: Make sure you're providing a valid user ID`);
        }
      }
    }
  }

  // Test array response
  console.log(`\n\n📋 Testing Array Response Function`);
  console.log('-'.repeat(60));
  try {
    totalTests++;
    const chunks = await getUserSystemContext(
      'What systems do I have?',
      TEST_USER_ID,
      3
    );
    if (chunks && chunks.length > 0) {
      console.log(`   ✅ Success - Retrieved ${chunks.length} chunks`);
      chunks.forEach((chunk, idx) => {
        console.log(`   📄 Chunk ${idx + 1}:`);
        console.log(`      Text: ${chunk.text.substring(0, 150)}...`);
        if (chunk.system_id) {
          console.log(`      System ID: ${chunk.system_id}`);
        }
        if (chunk.system_type) {
          console.log(`      System Type: ${chunk.system_type}`);
        }
        if (chunk.entity_type) {
          console.log(`      Entity Type: ${chunk.entity_type}`);
        }
      });
      passedTests++;
    } else {
      console.log(`   ⚠️  Warning - No chunks returned`);
      console.log(`   Note: User might not have any systems in the index yet`);
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test tenant isolation (should fail without user ID)
  console.log(`\n\n📋 Testing Tenant Isolation`);
  console.log('-'.repeat(60));
  try {
    totalTests++;
    // This should fail
    await getUserSystemContextString('test', '', 5);
    console.log(`   ❌ Error - Should have failed without org ID`);
  } catch (error: any) {
    if (error.message.includes('orgId is required')) {
      console.log(`   ✅ Success - Tenant isolation enforced (requires org ID)`);
      passedTests++;
    } else {
      console.log(`   ⚠️  Unexpected error: ${error.message}`);
    }
  }

  // Summary
  console.log(`\n\n${'='.repeat(60)}`);
  console.log('📊 Test Summary');
  console.log(`${'='.repeat(60)}`);
  console.log(`   User ID: ${TEST_USER_ID}`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${passedTests}`);
  console.log(`   Failed: ${totalTests - passedTests}`);
  console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log(`\n   ✨ All tests passed!`);
  } else if (passedTests > 0) {
    console.log(`\n   ⚠️  Some tests had issues - check the output above`);
    console.log(`   Note: If no systems found, run: npm run ingest-user-systems`);
  } else {
    console.log(`\n   ❌ All tests failed - check your Pinecone index and API keys`);
    console.log(`   Make sure you've run: npm run ingest-user-systems`);
  }
}

// Run tests
testUserSystemRAG().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

