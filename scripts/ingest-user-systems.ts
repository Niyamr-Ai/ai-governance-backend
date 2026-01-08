/**
 * User System RAG Ingestion Script
 * 
 * Processes user-specific AI system data from Supabase and creates embeddings.
 * Stores embeddings in Pinecone index: user-systems
 * 
 * This script should be run periodically or triggered when system data changes.
 * 
 * Usage: 
 *   npm run ingest-user-systems              # All users
 *   npm run ingest-user-systems -- --user-id <userId>  # Specific user
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAI } from 'openai';
import * as path from 'path';

// Load environment variables
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) must be set');
}

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const OPEN_AI_KEY = process.env.OPEN_AI_KEY;

if (!PINECONE_API_KEY || !OPEN_AI_KEY) {
  throw new Error('PINECONE_API_KEY and OPEN_AI_KEY must be set in .env.local');
}

const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });
const openai = new OpenAI({ apiKey: OPEN_AI_KEY });

const INDEX_NAME = 'user-systems';

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
 * Format system data into a readable text chunk
 */
function formatSystemData(system: any, systemType: 'EU' | 'UK' | 'MAS'): string {
  let text = `AI System: ${system.system_name || system.name || 'Unnamed System'}\n`;
  text += `Type: ${systemType} Compliance Assessment\n`;
  text += `System ID: ${system.id}\n\n`;

  if (system.description) {
    text += `Description: ${system.description}\n\n`;
  }

  if (system.owner) {
    text += `Owner: ${system.owner}\n`;
  }

  if (system.lifecycle_stage) {
    text += `Lifecycle Stage: ${system.lifecycle_stage}\n`;
  }

  // EU AI Act specific
  if (systemType === 'EU') {
    if (system.risk_tier) {
      text += `Risk Tier: ${system.risk_tier}\n`;
    }
    if (system.compliance_status) {
      text += `Compliance Status: ${system.compliance_status}\n`;
    }
    if (system.prohibited_practices_detected !== undefined) {
      text += `Prohibited Practices Detected: ${system.prohibited_practices_detected}\n`;
    }
    if (system.high_risk_missing && system.high_risk_missing.length > 0) {
      text += `High-Risk Obligations Missing: ${system.high_risk_missing.join(', ')}\n`;
    }
    if (system.transparency_missing && system.transparency_missing.length > 0) {
      text += `Transparency Requirements Missing: ${system.transparency_missing.join(', ')}\n`;
    }
    if (system.summary) {
      text += `\nSummary: ${system.summary}\n`;
    }
  }

  // UK AI Act specific
  if (systemType === 'UK') {
    if (system.risk_level) {
      text += `Risk Level: ${system.risk_level}\n`;
    }
    if (system.overall_assessment) {
      text += `Overall Assessment: ${system.overall_assessment}\n`;
    }
    if (system.sector_regulation) {
      const sector = typeof system.sector_regulation === 'string' 
        ? JSON.parse(system.sector_regulation) 
        : system.sector_regulation;
      if (sector.sector) {
        text += `Sector: ${sector.sector}\n`;
      }
      if (sector.gaps && sector.gaps.length > 0) {
        text += `Sector Regulation Gaps: ${sector.gaps.join(', ')}\n`;
      }
    }
    if (system.summary) {
      text += `\nSummary: ${system.summary}\n`;
    }
  }

  // MAS specific
  if (systemType === 'MAS') {
    if (system.overall_risk_level) {
      text += `Overall Risk Level: ${system.overall_risk_level}\n`;
    }
    if (system.overall_compliance_status) {
      text += `Compliance Status: ${system.overall_compliance_status}\n`;
    }
    if (system.sector) {
      text += `Sector: ${system.sector}\n`;
    }
    // Add pillar information if available
    const pillars = ['governance', 'inventory', 'dataManagement', 'transparency', 'fairness', 
                     'humanOversight', 'thirdParty', 'algoSelection', 'modelRobustness', 
                     'monitoring', 'incidentManagement', 'ethics'];
    const pillarGaps: string[] = [];
    pillars.forEach(pillar => {
      const pillarData = system[pillar];
      if (pillarData && typeof pillarData === 'object') {
        const parsed = typeof pillarData === 'string' ? JSON.parse(pillarData) : pillarData;
        if (parsed.status && parsed.status !== 'Compliant') {
          pillarGaps.push(`${pillar}: ${parsed.status}`);
        }
      }
    });
    if (pillarGaps.length > 0) {
      text += `MAS Pillar Gaps: ${pillarGaps.join(', ')}\n`;
    }
  }

  return text;
}

/**
 * Format risk assessment data
 */
function formatRiskAssessment(assessment: any): string {
  let text = `Risk Assessment: ${assessment.category}\n`;
  text += `Assessment ID: ${assessment.id}\n`;
  text += `Risk Level: ${assessment.risk_level}\n`;
  text += `Status: ${assessment.status || 'N/A'}\n`;
  text += `Mitigation Status: ${assessment.mitigation_status || 'not_started'}\n\n`;

  if (assessment.summary) {
    text += `Summary: ${assessment.summary}\n\n`;
  }

  if (assessment.metrics && Object.keys(assessment.metrics).length > 0) {
    text += `Metrics: ${JSON.stringify(assessment.metrics, null, 2)}\n`;
  }

  if (assessment.evidence_links && assessment.evidence_links.length > 0) {
    text += `\nEvidence Links: ${assessment.evidence_links.join(', ')}\n`;
  }

  return text;
}

/**
 * Format automated risk assessment data
 */
function formatAutomatedRiskAssessment(assessment: any): string {
  let text = `Automated Risk Assessment\n`;
  text += `Assessment ID: ${assessment.id}\n`;
  text += `Overall Risk Level: ${assessment.overall_risk_level}\n`;
  text += `Composite Score: ${assessment.composite_score}\n\n`;

  text += `Risk Dimension Scores:\n`;
  text += `- Technical: ${assessment.technical_risk_score}/10\n`;
  text += `- Operational: ${assessment.operational_risk_score}/10\n`;
  text += `- Legal/Regulatory: ${assessment.legal_regulatory_risk_score}/10\n`;
  text += `- Ethical/Societal: ${assessment.ethical_societal_risk_score}/10\n`;
  text += `- Business: ${assessment.business_risk_score}/10\n\n`;

  if (assessment.executive_summary) {
    text += `Executive Summary: ${assessment.executive_summary}\n\n`;
  }

  if (assessment.remediation_plan) {
    text += `Remediation Plan: ${assessment.remediation_plan}\n`;
  }

  return text;
}

/**
 * Format governance task data
 */
function formatGovernanceTask(task: any): string {
  let text = `Governance Task: ${task.title}\n`;
  text += `Regulation: ${task.regulation}\n`;
  text += `Status: ${task.status}\n`;
  if (task.blocking) {
    text += `⚠️ Blocking Task\n`;
  }
  if (task.description) {
    text += `\nDescription: ${task.description}\n`;
  }
  return text;
}

/**
 * Fetch and process all systems for a user
 */
async function processUserSystems(userId: string) {
  console.log(`\n👤 Processing systems for user: ${userId}`);

  const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const index = pinecone.index(INDEX_NAME);
  const vectors: any[] = [];

  // Fetch EU AI Act systems
  const { data: euSystems } = await supabase
    .from('eu_ai_act_check_results')
    .select('*')
    .eq('user_id', userId);

  if (euSystems && euSystems.length > 0) {
    console.log(`   📋 Found ${euSystems.length} EU AI Act systems`);
    for (const system of euSystems) {
      const text = formatSystemData(system, 'EU');
      const embedding = await generateEmbedding(text);
      vectors.push({
        id: `eu-${system.id}-system`,
        values: embedding,
        metadata: {
          text,
          user_id: userId,
          system_id: system.id,
          system_type: 'EU',
          system_name: system.system_name || 'Unnamed',
        },
      });
    }
  }

  // Fetch UK AI Act systems
  const { data: ukSystems } = await supabase
    .from('uk_ai_assessments')
    .select('*')
    .eq('user_id', userId);

  if (ukSystems && ukSystems.length > 0) {
    console.log(`   📋 Found ${ukSystems.length} UK AI Act systems`);
    for (const system of ukSystems) {
      const text = formatSystemData(system, 'UK');
      const embedding = await generateEmbedding(text);
      vectors.push({
        id: `uk-${system.id}-system`,
        values: embedding,
        metadata: {
          text,
          user_id: userId,
          system_id: system.id,
          system_type: 'UK',
          system_name: system.system_name || 'Unnamed',
        },
      });
    }
  }

  // Fetch MAS systems
  const { data: masSystems } = await supabase
    .from('mas_ai_risk_assessments')
    .select('*')
    .eq('user_id', userId);

  if (masSystems && masSystems.length > 0) {
    console.log(`   📋 Found ${masSystems.length} MAS systems`);
    for (const system of masSystems) {
      const text = formatSystemData(system, 'MAS');
      const embedding = await generateEmbedding(text);
      vectors.push({
        id: `mas-${system.id}-system`,
        values: embedding,
        metadata: {
          text,
          user_id: userId,
          system_id: system.id,
          system_type: 'MAS',
          system_name: system.system_name || 'Unnamed',
        },
      });
    }
  }

  // Fetch risk assessments for all systems
  const allSystemIds = [
    ...(euSystems || []).map(s => s.id),
    ...(ukSystems || []).map(s => s.id),
    ...(masSystems || []).map(s => s.id),
  ];

  if (allSystemIds.length > 0) {
    const { data: riskAssessments } = await supabase
      .from('risk_assessments')
      .select('*')
      .in('ai_system_id', allSystemIds);

    if (riskAssessments && riskAssessments.length > 0) {
      console.log(`   📋 Found ${riskAssessments.length} risk assessments`);
      for (const assessment of riskAssessments) {
        const text = formatRiskAssessment(assessment);
        const embedding = await generateEmbedding(text);
        vectors.push({
          id: `risk-${assessment.id}`,
          values: embedding,
          metadata: {
            text,
            user_id: userId,
            system_id: assessment.ai_system_id,
            entity_type: 'risk_assessment',
            category: assessment.category,
            risk_level: assessment.risk_level,
          },
        });
      }
    }

    // Fetch automated risk assessments
    const { data: autoRiskAssessments } = await supabase
      .from('automated_risk_assessments')
      .select('*')
      .in('ai_system_id', allSystemIds);

    if (autoRiskAssessments && autoRiskAssessments.length > 0) {
      console.log(`   📋 Found ${autoRiskAssessments.length} automated risk assessments`);
      for (const assessment of autoRiskAssessments) {
        const text = formatAutomatedRiskAssessment(assessment);
        const embedding = await generateEmbedding(text);
        vectors.push({
          id: `auto-risk-${assessment.id}`,
          values: embedding,
          metadata: {
            text,
            user_id: userId,
            system_id: assessment.ai_system_id,
            entity_type: 'automated_risk_assessment',
            risk_level: assessment.overall_risk_level,
          },
        });
      }
    }

    // Fetch governance tasks
    const { data: tasks } = await supabase
      .from('governance_tasks')
      .select('*')
      .in('ai_system_id', allSystemIds)
      .eq('status', 'Pending');

    if (tasks && tasks.length > 0) {
      console.log(`   📋 Found ${tasks.length} pending governance tasks`);
      for (const task of tasks) {
        const text = formatGovernanceTask(task);
        const embedding = await generateEmbedding(text);
        vectors.push({
          id: `task-${task.id}`,
          values: embedding,
          metadata: {
            text,
            user_id: userId,
            system_id: task.ai_system_id,
            entity_type: 'governance_task',
            regulation: task.regulation,
            status: task.status,
          },
        });
      }
    }
  }

  // Upsert all vectors in batches
  if (vectors.length > 0) {
    console.log(`   📦 Upserting ${vectors.length} vectors...`);
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await index.upsert(batch);
      console.log(`   ✅ Upserted batch ${Math.floor(i / batchSize) + 1}`);
    }
    console.log(`   ✨ Completed processing for user: ${userId}`);
  } else {
    console.log(`   ⚠️  No data found for user: ${userId}`);
  }
}

/**
 * Main ingestion function
 */
async function ingestUserSystems() {
  console.log('🚀 Starting User System RAG Ingestion...\n');
  console.log(`📚 Index: ${INDEX_NAME}`);
  console.log(`🔑 Using OpenAI model: text-embedding-3-small\n`);

  try {
    // Check for user ID argument
    const args = process.argv.slice(2);
    const userIdArg = args.find(arg => arg.startsWith('--user-id='));
    const userId = userIdArg ? userIdArg.split('=')[1] : undefined;

    const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    if (userId && userId.trim()) {
      // Process specific user
      await processUserSystems(userId.trim());
    } else {
      // Process all users
      console.log('📋 Processing all users...\n');
      
      // Get all unique user IDs from all system tables
      const [euResult, ukResult, masResult] = await Promise.all([
        supabase.from('eu_ai_act_check_results').select('user_id').not('user_id', 'is', null),
        supabase.from('uk_ai_assessments').select('user_id').not('user_id', 'is', null),
        supabase.from('mas_ai_risk_assessments').select('user_id').not('user_id', 'is', null),
      ]);

      const userIds = new Set<string>();
      [euResult.data, ukResult.data, masResult.data].forEach(results => {
        results?.forEach((row: any) => {
          if (row.user_id) userIds.add(row.user_id);
        });
      });

      console.log(`   Found ${userIds.size} unique users\n`);

      const userIdArray = Array.from(userIds);
      for (const uid of userIdArray) {
        await processUserSystems(uid);
      }
    }

    console.log(`\n✨ Ingestion complete!`);
    console.log(`   📦 Index: ${INDEX_NAME}`);
  } catch (error) {
    console.error('❌ Ingestion failed:', error);
    process.exit(1);
  }
}

// Run ingestion
ingestUserSystems().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

