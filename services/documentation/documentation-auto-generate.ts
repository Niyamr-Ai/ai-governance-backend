/**
 * Auto-Generate Documentation Helper
 * 
 * Automatically generates compliance documentation when assessments are created/updated.
 * This is a non-blocking operation - failures won't prevent assessment saves.
 */

import { supabaseAdmin } from "../../src/lib/supabase";
import { OpenAI } from "openai";
import type { RegulationType } from "../../types/documentation";
import { evaluateGovernanceTasks } from "../governance/governance-tasks";
import { getRegulationContextString, type RegulationType as RagRegulationType } from "../ai/rag-service";

const OPEN_AI_KEY = process.env.OPEN_AI_KEY;
if (!OPEN_AI_KEY) {
  throw new Error("OPEN_AI_KEY is missing");
}

const openai = new OpenAI({ apiKey: OPEN_AI_KEY });

/**
 * Auto-detect which regulation types apply to a system
 */
export async function detectRegulationType(systemId: string): Promise<RegulationType[]> {
  const supabase = supabaseAdmin;
  const types: RegulationType[] = [];

  // Check EU AI Act
  const { data: euSystem } = await supabase
    .from("eu_ai_act_check_results")
    .select("id")
    .eq("id", systemId)
    .maybeSingle();
  if (euSystem) types.push('EU AI Act');

  // Check UK AI Act
  const { data: ukSystem } = await supabase
    .from("uk_ai_assessments")
    .select("id")
    .eq("id", systemId)
    .maybeSingle();
  if (ukSystem) types.push('UK AI Act');

  // Check MAS
  const { data: masSystem } = await supabase
    .from("mas_ai_risk_assessments")
    .select("id")
    .eq("id", systemId)
    .maybeSingle();
  if (masSystem) types.push('MAS');

  return types;
}

/**
 * Gather system data based on regulation type (reused from documentation API)
 */
async function gatherSystemData(
  supabase: any,
  systemId: string,
  regulationType: RegulationType
): Promise<any | null> {
  let query;

  switch (regulationType) {
    case 'EU AI Act':
      query = supabase
        .from("eu_ai_act_check_results")
        .select("*")
        .eq("id", systemId)
        .maybeSingle();
      break;
    case 'UK AI Act':
      query = supabase
        .from("uk_ai_assessments")
        .select("*")
        .eq("id", systemId)
        .maybeSingle();
      break;
    case 'MAS':
      query = supabase
        .from("mas_ai_risk_assessments")
        .select("*")
        .eq("id", systemId)
        .maybeSingle();
      break;
  }

  const { data, error } = await query;
  if (error || !data) {
    return null;
  }

  // Get lifecycle stage if EU AI Act
  if (regulationType === 'EU AI Act') {
    return {
      ...data,
      lifecycle_stage: data.lifecycle_stage || 'Draft',
    };
  }

  return data;
}

/**
 * Generate documentation using OpenAI with RAG-enhanced regulatory context
 */
async function generateDocumentation(
  regulationType: RegulationType,
  systemData: any,
  riskAssessments: any[]
): Promise<string> {
  // Extract q8 (conformity assessment status) for EU systems
  const rawAnswers = systemData.raw_answers || {};
  const conformityStatus = rawAnswers.q8 || '';
  const isPartiallyCompleted = conformityStatus === 'partial' || conformityStatus === 'Partially completed' || conformityStatus?.toLowerCase() === 'partially completed';
  
  // Map risk assessment status for display
  const getRiskAssessmentStatusText = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'Approved';
      case 'submitted':
        return 'Under Review';
      case 'draft':
        return 'Draft';
      case 'rejected':
        return 'Rejected';
      default:
        return status || 'Unknown';
    }
  };
  
  // Build risk summary with proper status mapping
  const riskSummary = riskAssessments.length > 0
    ? riskAssessments.map(ra => {
        const statusText = getRiskAssessmentStatusText(ra.status);
        return `- ${ra.category}: ${ra.risk_level} risk - ${ra.summary} (Status: ${statusText}, Mitigation: ${ra.mitigation_status})`;
      }).join('\n')
    : isPartiallyCompleted && regulationType === 'EU AI Act'
      ? 'Risk assessments are in progress (Partially completed conformity assessment)'
      : 'No approved risk assessments';

  // Get RAG-enhanced regulatory context
  let regulatoryContext = '';
  try {
    // Map documentation regulation types to RAG regulation types
    const ragRegulationType: RagRegulationType = regulationType === 'EU AI Act' ? 'EU' 
      : regulationType === 'UK AI Act' ? 'UK' 
      : 'MAS';
    
    // Build RAG query based on system characteristics
    const ragQuery = `compliance documentation requirements ${systemData?.system_name || ''} ${systemData?.risk_tier || systemData?.risk_level || ''} technical documentation obligations`;
    
    console.log(`[Auto-Doc RAG] Querying ${ragRegulationType} regulation RAG for auto-documentation`);
    regulatoryContext = await getRegulationContextString(ragQuery, ragRegulationType, 10);
    
    if (regulatoryContext && 
        regulatoryContext !== 'No relevant context found.' && 
        regulatoryContext !== 'No query provided.') {
      console.log(`[Auto-Doc RAG] Retrieved ${regulatoryContext.length} chars of regulatory context`);
    } else {
      console.log(`[Auto-Doc RAG] No specific regulatory context found, using general knowledge`);
      regulatoryContext = '';
    }
  } catch (ragError) {
    console.error('[Auto-Doc RAG] Error retrieving regulatory context:', ragError);
    regulatoryContext = '';
  }

  // Build regulatory context section
  const regulatoryContextSection = regulatoryContext ? `

## Regulatory Context

The following regulatory requirements and obligations are relevant to this documentation:

${regulatoryContext}

**Important:** Use this regulatory context to ensure the documentation accurately reflects specific regulatory requirements and obligations. Reference specific articles, sections, or requirements where applicable.

---

` : '';

  let prompt = '';

  switch (regulationType) {
    case 'EU AI Act':
      prompt = `${regulatoryContextSection}Generate technical documentation for an AI system aligned with EU AI Act Article 11 requirements.

System Information:
- Name: ${systemData.system_name || 'Unspecified'}
- Risk Tier: ${systemData.risk_tier || 'Unknown'}
- Compliance Status: ${systemData.compliance_status || 'Unknown'}
- Lifecycle Stage: ${systemData.lifecycle_stage || 'Draft'}
- Accountable Person: ${systemData.accountable_person || 'Not specified'}
- Prohibited Practices Detected: ${systemData.prohibited_practices_detected ? 'Yes' : 'No'}
- High Risk Obligations Fulfilled: ${systemData.high_risk_all_fulfilled ? 'Yes' : 'No'}
${systemData.high_risk_missing ? `- Missing Obligations: ${JSON.stringify(systemData.high_risk_missing)}` : ''}
- Transparency Required: ${systemData.transparency_required ? 'Yes' : 'No'}
- Post-Market Monitoring: ${systemData.post_market_monitoring ? 'Yes' : 'No'}
- FRIA Completed: ${systemData.fria_completed ? 'Yes' : 'No'}

Risk Assessments:
${riskSummary}

Generate comprehensive technical documentation that includes:
1. System Overview and Purpose
2. Risk Classification and Justification
3. Technical Specifications
4. Data Governance and Quality Measures
5. Risk Management System
6. Human Oversight Mechanisms
7. Accuracy, Robustness, and Cybersecurity Measures
8. Transparency and User Information
9. Post-Market Monitoring Plan (if applicable)
10. Compliance Summary

Format the document professionally with clear sections and subsections. Use markdown formatting.`;
      break;

    case 'UK AI Act':
      const principles = [
        systemData.safety_and_security,
        systemData.transparency,
        systemData.fairness,
        systemData.governance,
        systemData.contestability,
      ].filter(Boolean);

      const principlesStatus = principles.map((p: any, idx: number) => {
        const names = ['Safety & Security', 'Transparency', 'Fairness', 'Governance', 'Contestability'];
        return `- ${names[idx]}: ${p.meetsPrinciple ? 'Met' : 'Not Met'}${p.missing?.length ? ` (Gaps: ${p.missing.join(', ')})` : ''}`;
      }).join('\n');

      prompt = `${regulatoryContextSection}Generate compliance documentation for an AI system aligned with the UK AI Regulatory Framework.

System Information:
- Name: ${systemData.system_name || 'Unspecified'}
- Risk Level: ${systemData.risk_level || 'Unknown'}
- Overall Assessment: ${systemData.overall_assessment || 'Unknown'}
- Sector: ${systemData.sector_regulation?.sector || 'Not specified'}

UK AI Principles Status:
${principlesStatus}

Risk Assessments:
${riskSummary}

Generate comprehensive documentation that addresses all 5 UK AI principles:
1. Safety, Security & Robustness
2. Transparency & Explainability
3. Fairness
4. Accountability & Governance
5. Contestability & Redress

For each principle, document:
- Current compliance status
- Measures in place
- Gaps identified
- Remediation plans
- Evidence of compliance

Format the document professionally with clear sections. Use markdown formatting.`;
      break;

    case 'MAS':
      prompt = `${regulatoryContextSection}Generate compliance documentation for an AI system aligned with MAS (Monetary Authority of Singapore) AI Risk Management Guidelines.

System Information:
- Name: ${systemData.system_name || 'Unspecified'}
- Sector: ${systemData.sector || 'Not specified'}
- Overall Risk Level: ${systemData.overall_risk_level || 'Unknown'}
- Overall Compliance Status: ${systemData.overall_compliance_status || 'Unknown'}
- Owner: ${systemData.owner || 'Not specified'}
- System Status: ${systemData.system_status || 'Unknown'}
- Uses Personal Data: ${systemData.uses_personal_data ? 'Yes' : 'No'}
- Uses Special Category Data: ${systemData.uses_special_category_data ? 'Yes' : 'No'}
- Uses Third-Party AI: ${systemData.uses_third_party_ai ? 'Yes' : 'No'}

MAS 12 Pillars Assessment:
${JSON.stringify({
  governance: systemData.governance,
  inventory: systemData.inventory,
  dataManagement: systemData.dataManagement,
  transparency: systemData.transparency,
  fairness: systemData.fairness,
  humanOversight: systemData.humanOversight,
  thirdParty: systemData.thirdParty,
  algoSelection: systemData.algoSelection,
  evaluationTesting: systemData.evaluationTesting,
  techCybersecurity: systemData.techCybersecurity,
  monitoringChange: systemData.monitoringChange,
  capabilityCapacity: systemData.capabilityCapacity,
}, null, 2)}

Risk Assessments:
${riskSummary}

Generate comprehensive documentation covering all 12 MAS pillars:
1. Governance & Oversight
2. AI System Identification, Inventory & Risk Classification
3. Data Management
4. Transparency & Explainability
5. Fairness
6. Human Oversight
7. Third-Party / Vendor Management
8. Algorithm & Feature Selection
9. Evaluation & Testing
10. Technology & Cybersecurity
11. Monitoring & Change Management
12. Capability & Capacity

For each pillar, document:
- Compliance status and score
- Gaps identified
- Recommendations
- Implementation status
- Evidence

Format the document professionally with clear sections. Use markdown formatting.`;
      break;
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are an expert compliance documentation writer. Generate comprehensive, professional compliance documentation based on the provided system data, risk assessments, and regulatory context. CRITICAL: Use ONLY actual data provided - NEVER use placeholders like [describe...], [provide...], [outline...]. If information is missing, state 'Not specified' or 'Not applicable'. Use the regulatory context to ensure accuracy and include specific regulatory references where applicable.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.3,
  });

  return completion.choices[0]?.message?.content || "Failed to generate documentation";
}

/**
 * Auto-generate documentation for a system
 * 
 * This function is non-blocking - errors are logged but don't throw.
 * It can be called after assessment saves without affecting the save operation.
 */
export async function autoGenerateDocumentationIfNeeded(
  systemId: string,
  regulationTypes?: RegulationType[],
  userId?: string
): Promise<void> {
  console.log(`[Auto-Doc] Starting autoGenerateDocumentationIfNeeded for system ${systemId}`);
  try {
    const supabase = supabaseAdmin;

    if (userId) {
      console.log(`[Auto-Doc] User ID: ${userId}, System ID: ${systemId}`);
    } else {
      console.log(`[Auto-Doc] Admin operation (no user ID), System ID: ${systemId}`);
    }

    // Auto-detect regulation types if not provided
    if (!regulationTypes || regulationTypes.length === 0) {
      console.log(`[Auto-Doc] Auto-detecting regulation types for system ${systemId}`);
      regulationTypes = await detectRegulationType(systemId);
      console.log(`[Auto-Doc] Detected regulation types: ${regulationTypes.join(', ')}`);
    }

    // If no regulation types found, skip generation
    if (!regulationTypes || regulationTypes.length === 0) {
      console.error(`[Auto-Doc] No regulation types found for system ${systemId}, skipping generation`);
      return;
    }

    // Generate documentation for each regulation type
    for (const regulationType of regulationTypes) {
      try {
        // Gather system data
        const systemData = await gatherSystemData(supabase, systemId, regulationType);
        if (!systemData) {
          console.log(`[Auto-Doc] No ${regulationType} data found for system ${systemId}, skipping`);
          continue;
        }

        // Get risk assessments - include submitted/approved when conformity assessment is partially completed
        // Extract q8 (conformity assessment status) from raw_answers
        const rawAnswers = systemData.raw_answers || {};
        const conformityStatus = rawAnswers.q8 || '';
        const isPartiallyCompleted = conformityStatus === 'partial' || conformityStatus === 'Partially completed' || conformityStatus?.toLowerCase() === 'partially completed';
        
        // If partially completed, include both submitted and approved risk assessments
        // Otherwise, only include approved
        let riskAssessmentsQuery = supabase
          .from("risk_assessments")
          .select("*")
          .eq("ai_system_id", systemId);
        
        if (isPartiallyCompleted && regulationType === 'EU AI Act') {
          // Include both submitted and approved when conformity assessment is partially completed
          riskAssessmentsQuery = riskAssessmentsQuery.in("status", ["approved", "submitted"]);
        } else {
          // Only approved for fully completed or not started
          riskAssessmentsQuery = riskAssessmentsQuery.eq("status", "approved");
        }
        
        const { data: riskAssessments } = await riskAssessmentsQuery.order("assessed_at", { ascending: false });

        // Generate documentation
        const documentation = await generateDocumentation(
          regulationType,
          systemData,
          riskAssessments || []
        );

        // Determine next version (for Compliance Summary document type)
        const { data: existingDocs } = await supabase
          .from("compliance_documentation")
          .select("version")
          .eq("ai_system_id", systemId)
          .eq("regulation_type", regulationType)
          .eq("document_type", "Compliance Summary")
          .order("created_at", { ascending: false })
          .limit(1);

        let nextVersion = "1.0";
        if (existingDocs && existingDocs.length > 0) {
          const latestVersion = existingDocs[0].version;
          const [major, minor] = latestVersion.split('.').map(Number);
          nextVersion = `${major}.${minor + 1}`;
        }

        // Mark old Compliance Summary documents as outdated
        await supabase
          .from("compliance_documentation")
          .update({ status: "outdated" })
          .eq("ai_system_id", systemId)
          .eq("regulation_type", regulationType)
          .eq("document_type", "Compliance Summary")
          .eq("status", "current");

        // Get latest risk assessment version for traceability
        const latestRiskAssessment = riskAssessments && riskAssessments.length > 0 
          ? riskAssessments[0] 
          : null;
        const riskAssessmentVersion = latestRiskAssessment?.version || null;
        const aiSystemVersion = systemData.version || null;

        // Store generation metadata
        const generationMetadata = {
          system_data_hash: JSON.stringify(systemData).length,
          risk_assessments_count: riskAssessments?.length || 0,
          generated_at: new Date().toISOString(),
        };

        // Save new documentation (default to Compliance Summary for auto-generation)
        const { data: newDoc, error: insertError } = await supabase
          .from("compliance_documentation")
          .insert({
            ai_system_id: systemId,
            regulation_type: regulationType,
            document_type: "Compliance Summary", // Default for auto-generation
            version: nextVersion,
            content: documentation,
            status: "current",
            created_by: userId || null,
            ai_system_version: aiSystemVersion,
            risk_assessment_version: riskAssessmentVersion,
            generation_metadata: generationMetadata,
          })
          .select()
          .single();

        if (insertError) {
          console.error(`[Auto-Doc] Database insert error for ${regulationType}:`, insertError);
          throw new Error(insertError.message);
        }

        console.log(`[Auto-Doc] ✅ Successfully generated ${regulationType} documentation for system ${systemId}, version ${newDoc.version}`);
      } catch (error: any) {
        // Log error but continue with other regulation types
        console.error(`[Auto-Doc] ❌ Failed to auto-generate ${regulationType} docs for system ${systemId}:`, error.message || error);
        console.error(`[Auto-Doc] Error stack:`, error.stack);
      }
    }
    
    console.log(`[Auto-Doc] Completed autoGenerateDocumentationIfNeeded for system ${systemId}`);
    // Update governance tasks since documentation status changed
    await evaluateGovernanceTasks(systemId);
  } catch (error: any) {
    // Log error but don't throw - this is non-blocking
    console.error(`[Auto-Doc] ❌ Fatal error in autoGenerateDocumentationIfNeeded for system ${systemId}:`, error.message || error);
    console.error(`[Auto-Doc] Error stack:`, error.stack);
  }
}

/**
 * Auto-regenerate documentation when risk assessment is approved
 * 
 * Only regenerates if there are approved risk assessments that might affect documentation.
 */
export async function autoRegenerateDocumentationOnRiskApproval(
  systemId: string
): Promise<void> {
  try {
    const supabase = supabaseAdmin;
    
    // Check if there are any approved risk assessments for this system
    const { data: approvedAssessments } = await supabase
      .from("risk_assessments")
      .select("id")
      .eq("ai_system_id", systemId)
      .eq("status", "approved");

    // Only regenerate if there are approved assessments
    if (approvedAssessments && approvedAssessments.length > 0) {
      await autoGenerateDocumentationIfNeeded(systemId);
    }
  } catch (error: any) {
    // Log error but don't throw - this is non-blocking
    console.error(`[Auto-Doc] Error in autoRegenerateDocumentationOnRiskApproval for system ${systemId}:`, error.message || error);
  }
}
