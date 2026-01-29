/**
 * Context Providers
 * 
 * Context provider functions for each chatbot mode with COMPLETE RAG integration.
 * 
 * EXPLAIN mode: 
 *   - Regulation RAG: For regulatory questions (EU/UK/MAS)
 *   - Platform RAG: For platform features, workflows, concepts
 *   - NEVER accesses user system data
 * 
 * SYSTEM_ANALYSIS mode:
 *   - User System RAG: PRIMARY source (tenant-isolated by userId)
 *   - Regulation RAG: SUPPORTING context only
 *   - Strict tenant isolation enforced
 * 
 * ACTION mode:
 *   - Platform RAG: ONLY source for workflows and guidance
 *   - Database: For pending tasks and system state
 *   - NEVER analyzes systems or cites regulations
 * 
 * SAFETY GUARDRAILS:
 * - Never provides legal advice or compliance determinations
 * - Graceful fallback when any RAG fails
 * - Strict tenant isolation via userId filtering
 * - Clear confidence indicators for data completeness
 * - Mode-aware RAG usage prevents data leakage
 */

import type {
  ExplainContext,
  SystemAnalysisContext,
  ActionContext,
  PageContext
} from '../../../types/chatbot';
import { supabaseAdmin } from '../../../src/lib/supabase';
import { getRegulationContextString, type RegulationType } from '../rag-service';
import { getPlatformContextString } from '../platform-rag-service';
import { getUserSystemContextString } from '../user-system-rag-service';

/**
 * Detect regulation type from user message using keyword inference
 * 
 * @param userMessage - The user's question
 * @returns RegulationType - Detected regulation (defaults to EU if unclear)
 */
function detectRegulationType(userMessage: string): RegulationType {
  const message = userMessage.toLowerCase();
  
  // UK keywords
  if (message.includes('uk') || message.includes('united kingdom') || message.includes('britain') || message.includes('british')) {
    return 'UK';
  }
  
  // MAS/Singapore keywords
  if (message.includes('mas') || message.includes('singapore') || message.includes('monetary authority')) {
    return 'MAS';
  }
  
  // Default to EU (includes explicit EU keywords or when unclear)
  return 'EU';
}

/**
 * Detect regulation type from page context (pathname)
 * 
 * @param pageContext - Page context with pathname
 * @returns RegulationType - Detected regulation from URL path, or null if unclear
 */
function detectRegulationTypeFromPageContext(pageContext: PageContext): RegulationType | null {
  const pathname = pageContext.additionalMetadata?.pathname || '';
  const pathLower = pathname.toLowerCase();
  
  console.log(`[Context] 🔍 Detecting regulation from pathname: "${pathname}"`);
  
  if (pathLower.includes('/mas/')) {
    console.log(`[Context] ✅ Detected MAS from pathname`);
    return 'MAS';
  }
  
  if (pathLower.includes('/uk/')) {
    console.log(`[Context] ✅ Detected UK from pathname`);
    return 'UK';
  }
  
  if (pathLower.includes('/eu/') || pathLower.includes('/compliance/')) {
    console.log(`[Context] ✅ Detected EU from pathname`);
    return 'EU';
  }
  
  console.log(`[Context] ⚠️ Could not detect regulation from pathname, returning null`);
  return null;
}

/**
 * Determine if query is about regulations vs platform features
 * 
 * @param userMessage - The user's question
 * @returns boolean - true if regulatory question, false if platform question
 */
function isRegulatoryQuestion(userMessage: string): boolean {
  const message = userMessage.toLowerCase();
  
  // Regulatory keywords
  const regulatoryKeywords = [
    'eu ai act', 'uk ai act', 'mas', 'regulation', 'compliance', 'legal', 'law',
    'prohibited', 'high-risk', 'limited-risk', 'minimal-risk', 'transparency',
    'fundamental rights', 'fria', 'post-market monitoring', 'conformity assessment',
    'ce marking', 'notified body', 'obligations', 'requirements'
  ];
  
  // Platform/product keywords
  const platformKeywords = [
    'how to', 'create', 'add', 'delete', 'update', 'dashboard', 'assessment',
    'red teaming', 'governance task', 'lifecycle', 'workflow', 'feature',
    'platform', 'system registry', 'risk assessment', 'documentation'
  ];
  
  const hasRegulatoryKeywords = regulatoryKeywords.some(keyword => message.includes(keyword));
  const hasPlatformKeywords = platformKeywords.some(keyword => message.includes(keyword));
  
  // If both or neither, default to regulatory (safer for educational content)
  if (hasRegulatoryKeywords && !hasPlatformKeywords) return true;
  if (!hasRegulatoryKeywords && hasPlatformKeywords) return false;
  
  return true; // Default to regulatory
}

/**
 * Get context for EXPLAIN mode
 * 
 * Uses both Regulation RAG and Platform RAG based on question type:
 * - Regulatory questions: Use Regulation RAG for EU/UK/MAS content
 * - Platform questions: Use Platform RAG for features, workflows, concepts
 * 
 * NEVER accesses user-specific system data in EXPLAIN mode.
 * 
 * @param userMessage - The user's question
 * @param pageContext - Current page context
 * @returns ExplainContext with relevant educational content from RAG
 */
export async function getExplainContext(
  userMessage: string,
  pageContext: PageContext
): Promise<ExplainContext> {
  let regulatoryText = '';
  
  try {
    const isRegulatory = isRegulatoryQuestion(userMessage);
    
    if (isRegulatory) {
      // Use Regulation RAG for regulatory questions
      const regulationType = detectRegulationType(userMessage);
      
      console.log(`[Context] ===== EXPLAIN MODE - REGULATION RAG =====`);
      console.log(`[Context] Regulation Type: ${regulationType}`);
      console.log(`[Context] Query: ${userMessage.substring(0, 100)}${userMessage.length > 100 ? '...' : ''}`);
      console.log(`[Context] Using unified 'regulations' index with metadata filter`);
      
      const ragContext = await getRegulationContextString(userMessage, regulationType, 5);
      
      console.log(`[Context] RAG Context Retrieved: ${ragContext ? 'Yes' : 'No'}`);
      if (ragContext && ragContext.length > 0) {
        console.log(`[Context] Context length: ${ragContext.length} characters`);
      }
      
      if (ragContext && ragContext !== 'No relevant context found.' && ragContext !== 'No query provided.') {
        regulatoryText = `**${regulationType} Regulatory Context:**\n\n${ragContext}\n\n**Important:** This information is for educational purposes only and does not constitute legal advice. Always consult with legal professionals for compliance decisions.`;
      } else {
        regulatoryText = `No specific ${regulationType} regulatory context found for this query. The response will be based on general knowledge. For authoritative information, please consult the official ${regulationType} regulatory documents.`;
      }
    } else {
      // Use Platform RAG for platform/product questions
      console.log(`[Context] Querying Platform RAG for EXPLAIN mode`);
      const platformContext = await getPlatformContextString(userMessage, 5);
      
      if (platformContext && platformContext !== 'No relevant platform knowledge found.' && platformContext !== 'No query provided.') {
        regulatoryText = `**Platform Knowledge:**\n\n${platformContext}\n\n**Note:** This explains how our platform works. For regulatory compliance questions, please ask about specific regulations (EU AI Act, UK AI Act, or MAS).`;
      } else {
        regulatoryText = 'No specific platform documentation found for this query. The response will be based on general knowledge about AI governance platforms.';
      }
    }
  } catch (error) {
    console.error('[Context] Error querying RAG for EXPLAIN mode:', error);
    // Graceful fallback on RAG error
    regulatoryText = 'Unable to retrieve specific context at this time. The response will be based on general knowledge. Please note this is not legal advice.';
  }
  
  return {
    regulatoryText,
    conceptDefinitions: [
      'EU AI Act: European Union regulation categorizing AI systems by risk (Prohibited, High-risk, Limited-risk, Minimal-risk)',
      'UK AI Act: UK regulatory framework with five core principles (Safety, Transparency, Fairness, Accountability, Contestability)',
      'MAS: Monetary Authority of Singapore AI and FEAT (Fairness, Ethics, Accountability, Transparency) Guidelines',
      'Risk Assessment: Process of identifying and evaluating risks associated with an AI system',
      'Compliance Status: Whether a system meets regulatory requirements (Compliant, Partially compliant, Non-compliant)'
    ],
    platformBehavior: 'This platform helps organizations manage AI systems, assess compliance, generate documentation, and track governance tasks across multiple regulatory frameworks (EU, UK, MAS).'
  };
}

/**
 * Compute confidence level based on data completeness
 * 
 * @param context - System analysis context
 * @returns Confidence level: high, medium, or low
 */
function computeConfidenceLevel(context: SystemAnalysisContext): 'high' | 'medium' | 'low' {
  // High confidence: Complete system data + recent assessments
  if (
    context.systemName &&
    context.systemName !== 'Unknown' &&
    context.riskLevel &&
    context.riskLevel !== 'Unknown' &&
    context.assessments &&
    context.assessments.length > 0
  ) {
    return 'high';
  }

  // Medium confidence: Partial data available
  if (
    (context.systemName && context.systemName !== 'Unknown') ||
    (context.riskLevel && context.riskLevel !== 'Unknown')
  ) {
    return 'medium';
  }

  // Low confidence: Missing critical information
  return 'low';
}


/**
 * Get context for SYSTEM_ANALYSIS mode
 * 
 * Uses User System RAG as PRIMARY source and Regulation RAG as SUPPORTING context.
 * Maintains strict tenant isolation and confidence indicators.
 * 
 * CRITICAL: Always enforces tenant isolation via userId filtering.
 * 
 * @param userMessage - The user's question
 * @param pageContext - Current page context (must include systemId)
 * @param userId - Authenticated user ID (REQUIRED for tenant isolation)
 * @returns SystemAnalysisContext with system and regulatory data
 */
export async function getSystemAnalysisContext(
  userMessage: string,
  pageContext: PageContext,
  userId: string
): Promise<SystemAnalysisContext> {
  // Validate required parameters for tenant isolation
  if (!userId) {
    return {
      systemName: 'Error',
      systemDescription: 'User ID is required for system analysis (tenant isolation)',
      riskLevel: 'Unknown',
      complianceStatus: 'Unknown',
      assessments: [],
      gaps: ['Authentication required'],
      confidenceLevel: 'low'
    };
  }

  // Handle dashboard-level queries (organization-wide, no systemId)
  const isDashboardQuery = pageContext.pageType === 'dashboard' && !pageContext.systemId;
  
  if (!pageContext.systemId && !isDashboardQuery) {
    return {
      systemName: 'Unknown',
      systemDescription: 'No system ID provided in context. For dashboard queries, ensure pageType is "dashboard".',
      riskLevel: 'Unknown',
      complianceStatus: 'Unknown',
      assessments: [],
      gaps: ['System ID is required for analysis'],
      confidenceLevel: 'low'
    };
  }

  // For dashboard queries, fetch all systems for the organization
  if (isDashboardQuery) {
    console.log(`[Context] 📊 Dashboard query detected - fetching all systems for organization ${userId}`);
    try {
      const supabase = supabaseAdmin;
      
      // Fetch all systems across all compliance frameworks for this user's organization
      console.log(`[Context] 🔍 Fetching systems for org_id/user_id: ${userId}`);
      
      // Try org_id first, fallback to user_id if org_id returns no results (for backwards compatibility)
      // NOTE: Column names must match database schema:
      // UK: risk_level, overall_assessment (snake_case)
      // MAS: overall_risk_level, overall_compliance_status (snake_case)
      const [euSystems, ukSystemsByOrg, masSystemsByOrg] = await Promise.all([
        supabase.from('eu_ai_act_check_results').select('id, system_name, risk_tier, compliance_status').eq('org_id', userId),
        supabase.from('uk_ai_assessments').select('id, system_name, risk_level, overall_assessment').eq('org_id', userId),
        supabase.from('mas_ai_risk_assessments').select('id, system_name, overall_risk_level, overall_compliance_status').eq('org_id', userId)
      ]);

      // If org_id query returned no results, try user_id as fallback (for backwards compatibility)
      let ukSystems = ukSystemsByOrg;
      let masSystems = masSystemsByOrg;
      
      if (!ukSystemsByOrg.data || ukSystemsByOrg.data.length === 0) {
        console.log(`[Context] ⚠️ UK: No systems found with org_id, trying user_id fallback...`);
        const ukByUserId = await supabase.from('uk_ai_assessments').select('id, system_name, risk_level, overall_assessment').eq('user_id', userId);
        if (ukByUserId.data && ukByUserId.data.length > 0) {
          console.log(`[Context] ✅ UK: Found ${ukByUserId.data.length} systems using user_id`);
          ukSystems = ukByUserId;
        }
      }
      
      if (!masSystemsByOrg.data || masSystemsByOrg.data.length === 0) {
        console.log(`[Context] ⚠️ MAS: No systems found with org_id, trying user_id fallback...`);
        const masByUserId = await supabase.from('mas_ai_risk_assessments').select('id, system_name, overall_risk_level, overall_compliance_status').eq('user_id', userId);
        if (masByUserId.data && masByUserId.data.length > 0) {
          console.log(`[Context] ✅ MAS: Found ${masByUserId.data.length} systems using user_id`);
          masSystems = masByUserId;
        }
      }

      // Log query results
      console.log(`[Context] 📊 Query Results:`);
      console.log(`[Context]    EU AI Act: ${euSystems.data?.length || 0} systems (error: ${euSystems.error ? euSystems.error.message : 'none'})`);
      console.log(`[Context]    UK AI Act: ${ukSystems.data?.length || 0} systems (error: ${ukSystems.error ? ukSystems.error.message : 'none'})`);
      console.log(`[Context]    MAS: ${masSystems.data?.length || 0} systems (error: ${masSystems.error ? masSystems.error.message : 'none'})`);
      
      if (euSystems.error) {
        console.error(`[Context] ❌ EU query error:`, euSystems.error);
      }
      if (ukSystems.error) {
        console.error(`[Context] ❌ UK query error:`, ukSystems.error);
      }
      if (masSystems.error) {
        console.error(`[Context] ❌ MAS query error:`, masSystems.error);
      }

      const allSystems: any[] = [];
      const systemMap = new Map<string, any>();

      // Process EU systems
      if (euSystems.data) {
        euSystems.data.forEach((sys: any) => {
          if (!systemMap.has(sys.id)) {
            systemMap.set(sys.id, {
              id: sys.id,
              name: sys.system_name,
              frameworks: [],
              riskLevels: [],
              complianceStatuses: []
            });
          }
          const system = systemMap.get(sys.id);
          system.frameworks.push('EU AI Act');
          if (sys.risk_tier) system.riskLevels.push(`EU: ${sys.risk_tier}`);
          if (sys.compliance_status) system.complianceStatuses.push(`EU: ${sys.compliance_status}`);
        });
      }

      // Process UK systems
      if (ukSystems.data) {
        ukSystems.data.forEach((sys: any) => {
          if (!systemMap.has(sys.id)) {
            systemMap.set(sys.id, {
              id: sys.id,
              name: sys.system_name,
              frameworks: [],
              riskLevels: [],
              complianceStatuses: []
            });
          }
          const system = systemMap.get(sys.id);
          system.frameworks.push('UK AI Act');
          if (sys.risk_level) system.riskLevels.push(`UK: ${sys.risk_level}`);
          if (sys.overall_assessment) system.complianceStatuses.push(`UK: ${sys.overall_assessment}`);
        });
      }

      // Process MAS systems
      if (masSystems.data) {
        masSystems.data.forEach((sys: any) => {
          if (!systemMap.has(sys.id)) {
            systemMap.set(sys.id, {
              id: sys.id,
              name: sys.system_name,
              frameworks: [],
              riskLevels: [],
              complianceStatuses: []
            });
          }
          const system = systemMap.get(sys.id);
          system.frameworks.push('MAS');
          if (sys.overall_risk_level) system.riskLevels.push(`MAS: ${sys.overall_risk_level}`);
          if (sys.overall_compliance_status) system.complianceStatuses.push(`MAS: ${sys.overall_compliance_status}`);
        });
      }

      allSystems.push(...Array.from(systemMap.values()));

      console.log(`[Context] ✅ Aggregated ${allSystems.length} unique systems across all regulations`);
      if (allSystems.length > 0) {
        console.log(`[Context]    Systems breakdown: ${allSystems.map(s => `${s.name} (${s.frameworks.join(', ')})`).join(', ')}`);
      }

      // Calculate overall statistics
      const totalSystems = allSystems.length;
      const compliantCount = allSystems.filter(s => 
        s.complianceStatuses.some((status: string) => 
          status.toLowerCase().includes('compliant') && !status.toLowerCase().includes('non') && !status.toLowerCase().includes('partial')
        )
      ).length;
      const nonCompliantCount = allSystems.filter(s => 
        s.complianceStatuses.some((status: string) => 
          status.toLowerCase().includes('non-compliant') || status.toLowerCase().includes('non compliant')
        )
      ).length;
      const partiallyCompliantCount = totalSystems - compliantCount - nonCompliantCount;

      // Count by risk level
      const highRiskCount = allSystems.filter(s => 
        s.riskLevels.some((risk: string) => risk.toLowerCase().includes('high'))
      ).length;
      const mediumRiskCount = allSystems.filter(s => 
        s.riskLevels.some((risk: string) => risk.toLowerCase().includes('medium'))
      ).length;
      const lowRiskCount = allSystems.filter(s => 
        s.riskLevels.some((risk: string) => risk.toLowerCase().includes('low'))
      ).length;

      // Calculate regulation-specific statistics
      const euSystemsList = allSystems.filter(s => s.frameworks.includes('EU AI Act'));
      const ukSystemsList = allSystems.filter(s => s.frameworks.includes('UK AI Act'));
      const masSystemsList = allSystems.filter(s => s.frameworks.includes('MAS'));
      
      // Build comprehensive dashboard summary with regulation breakdown
      const dashboardSummary = `
**Organization Overview (ALL Regulations):**
- Total AI Systems: ${totalSystems}
- Compliant Systems: ${compliantCount}
- Partially Compliant: ${partiallyCompliantCount}
- Non-Compliant Systems: ${nonCompliantCount}

**Risk Distribution (Across All Regulations):**
- High Risk: ${highRiskCount}
- Medium Risk: ${mediumRiskCount}
- Low Risk: ${lowRiskCount}

**Regulation Coverage:**
- EU AI Act Systems: ${euSystemsList.length}
- UK AI Act Systems: ${ukSystemsList.length}
- MAS Systems: ${masSystemsList.length}

**Systems List (All Regulations):**
${allSystems.length > 0 ? allSystems.map(s => {
  const complianceStatus = s.complianceStatuses.length > 0 ? s.complianceStatuses[0] : 'Unknown';
  const riskLevel = s.riskLevels.length > 0 ? s.riskLevels[0] : 'Unknown';
  return `- ${s.name} (${s.frameworks.join(', ')}) - Status: ${complianceStatus}, Risk: ${riskLevel}`;
}).join('\n') : 'No systems found'}
      `.trim();

      return {
        systemName: 'Organization Dashboard',
        systemDescription: dashboardSummary,
        riskLevel: highRiskCount > 0 ? 'High' : mediumRiskCount > 0 ? 'Medium' : 'Low',
        complianceStatus: compliantCount === totalSystems ? 'Compliant' : nonCompliantCount > 0 ? 'Non-Compliant' : 'Partially Compliant',
        assessments: allSystems,
        gaps: [],
        confidenceLevel: totalSystems > 0 ? 'high' : 'low'
      };
    } catch (error: any) {
      console.error(`[Context] ❌ Error fetching dashboard systems:`, error);
      return {
        systemName: 'Error',
        systemDescription: `Error fetching organization systems: ${error.message}`,
        riskLevel: 'Unknown',
        complianceStatus: 'Unknown',
        assessments: [],
        gaps: ['Failed to fetch systems data'],
        confidenceLevel: 'low'
      };
    }
  }

  try {
    const supabase = supabaseAdmin;
    const systemId = pageContext.systemId!;

    // PRIMARY SOURCE: User System RAG (tenant-isolated)
    let systemDescription = 'No system data available';
    let systemName = 'Unknown System';
    let riskLevel = 'Unknown';
    let complianceStatus = 'Unknown';
    let assessments: any[] = [];
    let gaps: string[] = [];

    // Check if this is a compliance query or system attribute query - if so, fetch ALL compliance assessments directly from database
    // System attribute queries include questions about governance policy type, framework, risk level, etc.
    const isComplianceQuery = /(are we|am i|is (my|our)|compliance|compliant|comply|what.*compliance|what.*status|what are the|what is the|what.*in this system|what.*of this system)/i.test(userMessage);
    
    // For compliance queries, fetch directly from database (more accurate than RAG)
    if (isComplianceQuery) {
      console.log(`[Context] 🔍 Compliance query detected - fetching all available compliance assessments directly from database`);
      
      const { data: systemData } = await supabase
        .from('ai_system_registry')
        .select('*')
        .eq('system_id', systemId)
        .single();
      
      // Try to fetch EU, UK, and MAS assessments in parallel
      const [euResult, ukResult, masResult] = await Promise.all([
        supabase.from('eu_ai_act_check_results').select('*').eq('id', systemId).maybeSingle(),
        supabase.from('uk_ai_assessments').select('*').eq('id', systemId).maybeSingle(),
        supabase.from('mas_ai_risk_assessments').select('*').eq('id', systemId).maybeSingle()
      ]);
      
      const euData = euResult.data;
      const ukData = ukResult.data;
      const masData = masResult.data;
      
      // Build comprehensive compliance summary
      let complianceSummary = `\n\n**Compliance Status Summary for ${systemData?.name || 'System'}:**\n\n`;
      const allAssessments: any[] = [];
      const allGaps: string[] = [];
      
      if (euData) {
        console.log(`[Context] ✅ Found EU assessment for system ${euData.system_name}`);
        complianceSummary += `**EU AI Act:**\n`;
        complianceSummary += `- Risk Tier: ${euData.risk_tier || 'Unknown'}\n`;
        complianceSummary += `- Compliance Status: ${euData.compliance_status || 'Unknown'}\n`;
        if (euData.high_risk_missing && Array.isArray(euData.high_risk_missing) && euData.high_risk_missing.length > 0) {
          complianceSummary += `- Missing High-Risk Obligations: ${euData.high_risk_missing.join(', ')}\n`;
          allGaps.push(...euData.high_risk_missing);
        }
        complianceSummary += `\n`;
        allAssessments.push({ framework: 'EU', data: euData });
        if (!systemName || systemName === 'Unknown System') {
          systemName = euData.system_name || systemData?.name || 'Unknown System';
        }
        if (!complianceStatus || complianceStatus === 'Unknown') {
          complianceStatus = euData.compliance_status || 'Unknown';
        }
        if (!riskLevel || riskLevel === 'Unknown') {
          riskLevel = euData.risk_tier || 'Unknown';
        }
      }
      
      if (ukData) {
        console.log(`[Context] ✅ Found UK assessment for system ${ukData.system_name}`);
        complianceSummary += `**UK AI Act:**\n`;
        complianceSummary += `- Risk Level: ${ukData.riskLevel || 'Unknown'}\n`;
        complianceSummary += `- Overall Assessment: ${ukData.overallAssessment || 'Unknown'}\n`;
        if (ukData.safetyAndSecurity?.missing && ukData.safetyAndSecurity.missing.length > 0) {
          complianceSummary += `- Safety & Security Gaps: ${ukData.safetyAndSecurity.missing.join(', ')}\n`;
          allGaps.push(...ukData.safetyAndSecurity.missing);
        }
        if (ukData.transparency?.missing && ukData.transparency.missing.length > 0) {
          complianceSummary += `- Transparency Gaps: ${ukData.transparency.missing.join(', ')}\n`;
          allGaps.push(...ukData.transparency.missing);
        }
        if (ukData.fairness?.missing && ukData.fairness.missing.length > 0) {
          complianceSummary += `- Fairness Gaps: ${ukData.fairness.missing.join(', ')}\n`;
          allGaps.push(...ukData.fairness.missing);
        }
        complianceSummary += `\n`;
        allAssessments.push({ framework: 'UK', data: ukData });
        if (!systemName || systemName === 'Unknown System') {
          systemName = ukData.system_name || systemData?.name || 'Unknown System';
        }
        if (!complianceStatus || complianceStatus === 'Unknown') {
          complianceStatus = ukData.overallAssessment || 'Unknown';
        }
        if (!riskLevel || riskLevel === 'Unknown') {
          riskLevel = ukData.riskLevel || 'Unknown';
        }
      }
      
      if (masData) {
        console.log(`[Context] ✅ Found MAS assessment for system ${masData.system_name}`);
        complianceSummary += `**MAS Guidelines:**\n`;
        complianceSummary += `- Overall Risk Level: ${masData.overall_risk_level || 'Unknown'}\n`;
        complianceSummary += `- Overall Compliance Status: ${masData.overall_compliance_status || 'Unknown'}\n`;
        
        // Extract governance policy type and framework from raw_answers if question asks about them
        const userMsgLower = userMessage.toLowerCase();
        if (userMsgLower.includes('governance') && (userMsgLower.includes('policy type') || userMsgLower.includes('framework') || userMsgLower.includes('policy'))) {
          const rawAnswers = masData.raw_answers as any;
          if (rawAnswers) {
            if (rawAnswers.governance_policy_type) {
              complianceSummary += `- Governance Policy Type: ${rawAnswers.governance_policy_type}\n`;
            }
            if (rawAnswers.governance_framework) {
              complianceSummary += `- Governance Framework: ${rawAnswers.governance_framework}\n`;
            }
            if (rawAnswers.governance_board_role) {
              complianceSummary += `- Board Role: ${rawAnswers.governance_board_role}\n`;
            }
            if (rawAnswers.governance_senior_management) {
              complianceSummary += `- Senior Management: ${rawAnswers.governance_senior_management}\n`;
            }
            if (rawAnswers.governance_policy_assigned) {
              complianceSummary += `- Policy Assigned To: ${rawAnswers.governance_policy_assigned}\n`;
            }
          }
        }
        
        // Extract gaps from all MAS pillars
        const masPillars = ['governance', 'inventory', 'dataManagement', 'transparency', 'fairness', 
                          'humanOversight', 'thirdParty', 'algoSelection', 'evaluationTesting', 
                          'techCybersecurity', 'monitoringChange', 'capabilityCapacity'];
        masPillars.forEach(pillar => {
          const pillarData = masData[pillar] as any;
          if (pillarData?.gaps && Array.isArray(pillarData.gaps) && pillarData.gaps.length > 0) {
            complianceSummary += `- ${pillar} Gaps: ${pillarData.gaps.join(', ')}\n`;
            allGaps.push(...pillarData.gaps);
          }
        });
        complianceSummary += `\n`;
        allAssessments.push({ framework: 'MAS', data: masData });
        if (!systemName || systemName === 'Unknown System') {
          systemName = masData.system_name || systemData?.name || 'Unknown System';
        }
        if (!complianceStatus || complianceStatus === 'Unknown') {
          complianceStatus = masData.overall_compliance_status || 'Unknown';
        }
        if (!riskLevel || riskLevel === 'Unknown') {
          riskLevel = masData.overall_risk_level || 'Unknown';
        }
      }
      
      if (allAssessments.length === 0) {
        complianceSummary += `⚠️ No compliance assessments found for this system. Please complete a compliance assessment first.\n`;
        console.log(`[Context] ⚠️ No compliance assessments found for system ${systemId}`);
      } else {
        console.log(`[Context] ✅ Found ${allAssessments.length} compliance assessment(s): ${allAssessments.map(a => a.framework).join(', ')}`);
      }
      
      systemDescription = (systemData?.description || 'No description available') + complianceSummary;
      assessments = allAssessments;
      gaps = [...new Set(allGaps)]; // Remove duplicates
      
    } else {
      // Non-compliance query - use RAG first, then fallback to database
      try {
        console.log(`[Context] Querying Organization System RAG for SYSTEM_ANALYSIS mode (org: ${userId}, system: ${systemId})`);
        const userSystemContext = await getUserSystemContextString(
          userMessage,
          userId, // TEMPORARY: using userId as orgId during transition
          5,
          systemId // Filter by specific system
        );

        if (userSystemContext && 
            userSystemContext !== 'No relevant system data found.' && 
            userSystemContext !== 'No query provided.') {
          
          systemDescription = `**System Analysis (from your data):**\n\n${userSystemContext}`;
        } else {
          // Fallback to database query if RAG has no data
          console.log(`[Context] No User System RAG data found, falling back to database`);
          
          // Detect regulation framework from page context (pathname)
          const regulationFromPage = detectRegulationTypeFromPageContext(pageContext);
          console.log(`[Context] Detected regulation from page context: ${regulationFromPage || 'none (will try all tables)'}`);
          
          const { data: systemData } = await supabase
            .from('ai_system_registry')
            .select('*')
            .eq('system_id', systemId)
            .single();

          let complianceData: any = null;

          // Non-compliance query - use original logic (query based on page context)
          // Query the correct compliance table based on page context
          if (regulationFromPage === 'MAS') {
            console.log(`[Context] Querying MAS compliance table for system ${systemId}`);
            const { data: masData } = await supabase
              .from('mas_ai_risk_assessments')
              .select('*')
              .eq('id', systemId)
              .single();
            
            if (masData) {
              console.log(`[Context] ✅ Found MAS assessment data for system ${masData.system_name}`);
              complianceData = masData;
              systemName = masData.system_name || systemData?.name || 'Unknown System';
              systemDescription = masData.description || systemData?.description || 'No description available';
              riskLevel = masData.overall_risk_level || 'Unknown';
              complianceStatus = masData.overall_compliance_status || 'Unknown';
              assessments = [masData];
              
              // Build MAS-specific context with pillar information
              let masContext = `\n\n**MAS Compliance Framework - ${systemName}:**\n`;
              masContext += `- Overall Risk Level: ${riskLevel}\n`;
              masContext += `- Overall Compliance Status: ${complianceStatus}\n`;
              masContext += `- Sector: ${masData.sector || 'Not specified'}\n`;
              masContext += `- System Status: ${masData.system_status || 'Not specified'}\n`;
              
              // Extract governance policy type and framework from raw_answers if question asks about them
              const userMsgLower = userMessage.toLowerCase();
              if (userMsgLower.includes('governance') && (userMsgLower.includes('policy type') || userMsgLower.includes('framework') || userMsgLower.includes('policy'))) {
                const rawAnswers = masData.raw_answers as any;
                if (rawAnswers) {
                  if (rawAnswers.governance_policy_type) {
                    masContext += `\n**Governance Policy Type:** ${rawAnswers.governance_policy_type}\n`;
                  }
                  if (rawAnswers.governance_framework) {
                    masContext += `\n**Governance Framework:** ${rawAnswers.governance_framework}\n`;
                  }
                  if (rawAnswers.governance_board_role) {
                    masContext += `\n**Board Role:** ${rawAnswers.governance_board_role}\n`;
                  }
                  if (rawAnswers.governance_senior_management) {
                    masContext += `\n**Senior Management:** ${rawAnswers.governance_senior_management}\n`;
                  }
                  if (rawAnswers.governance_policy_assigned) {
                    masContext += `\n**Policy Assigned To:** ${rawAnswers.governance_policy_assigned}\n`;
                  }
                }
              }
              
              // Extract gaps from relevant MAS pillars based on user question
              if (userMsgLower.includes('fairness')) {
                const fairnessPillar = masData.fairness as any;
                gaps = fairnessPillar?.gaps || [];
                masContext += `\n**Fairness Pillar:**\n`;
                masContext += `- Status: ${fairnessPillar?.status || 'Unknown'}\n`;
                masContext += `- Score: ${fairnessPillar?.score || 0}/100\n`;
                if (fairnessPillar?.gaps && fairnessPillar.gaps.length > 0) {
                  masContext += `- Gaps: ${fairnessPillar.gaps.join(', ')}\n`;
                }
              } else if (userMsgLower.includes('third') || userMsgLower.includes('vendor')) {
                const thirdPartyPillar = masData.thirdParty as any;
                gaps = thirdPartyPillar?.gaps || [];
                masContext += `\n**Third-Party/Vendor Management Pillar:**\n`;
                masContext += `- Status: ${thirdPartyPillar?.status || 'Unknown'}\n`;
                masContext += `- Score: ${thirdPartyPillar?.score || 0}/100\n`;
                if (thirdPartyPillar?.gaps && thirdPartyPillar.gaps.length > 0) {
                  masContext += `- Gaps: ${thirdPartyPillar.gaps.join(', ')}\n`;
                }
              }
              
              systemDescription += masContext;
            } else {
              console.log(`[Context] ⚠️ No MAS assessment found for system ${systemId}, using basic system data`);
              systemName = systemData?.name || 'Unknown System';
              systemDescription = systemData?.description || 'No description available';
            }
          } else if (regulationFromPage === 'UK') {
            console.log(`[Context] Querying UK compliance table for system ${systemId}`);
            const { data: ukData } = await supabase
              .from('uk_ai_assessments')
              .select('*')
              .eq('id', systemId)
              .single();
            complianceData = ukData;
            systemName = ukData?.system_name || systemData?.name || 'Unknown System';
            systemDescription = ukData?.description || systemData?.description || 'No description available';
            riskLevel = ukData?.risk_tier || 'Unknown';
            complianceStatus = ukData?.compliance_status || 'Unknown';
            assessments = ukData ? [ukData] : [];
            gaps = ukData?.gaps || [];
          } else {
            // Default to EU or try all if unclear
            console.log(`[Context] Querying EU compliance table for system ${systemId}`);
            const { data: euData } = await supabase
              .from('eu_ai_act_check_results')
              .select('*')
              .eq('id', systemId)
              .single();
            complianceData = euData;
            systemName = euData?.system_name || systemData?.name || 'Unknown System';
            systemDescription = euData?.description || systemData?.description || 'No description available';
            riskLevel = euData?.risk_tier || 'Unknown';
            complianceStatus = euData?.compliance_status || 'Unknown';
            assessments = euData ? [euData] : [];
            gaps = euData?.high_risk_obligations?.missing || [];
          }
        }
      } catch (userRagError) {
        console.error('[Context] Error querying User System RAG:', userRagError);
        systemDescription = 'Error retrieving system data. Please ensure the system exists and you have access.';
        gaps.push('Unable to load system data');
      }
    }

    // SUPPORTING SOURCE: Regulation RAG (enrichment only)
    try {
      // Prioritize regulation type from page context over user message
      const regulationFromPage = detectRegulationTypeFromPageContext(pageContext);
      const regulationFromMessage = detectRegulationType(userMessage);
      const regulationType = regulationFromPage || regulationFromMessage;
      
      console.log(`[Context] 📋 Regulation detection results:`);
      console.log(`[Context]    From page context: ${regulationFromPage || 'null'}`);
      console.log(`[Context]    From user message: ${regulationFromMessage}`);
      console.log(`[Context]    Final selection: ${regulationType}`);
      console.log(`[Context] Querying ${regulationType} regulation RAG for supporting context`);
      const regulatoryContext = await getRegulationContextString(userMessage, regulationType, 3);
      
      if (regulatoryContext && 
          regulatoryContext !== 'No relevant context found.' && 
          regulatoryContext !== 'No query provided.') {
        
        // Add regulatory context as supporting information (NOT primary analysis)
        const regulatoryNote = `\n\n**Supporting Regulatory Context (${regulationType}):**\n${regulatoryContext}\n\n**Important:** This regulatory context supports your analysis but does not constitute a compliance determination. The primary analysis is based on your system-specific data above.`;
        
        systemDescription += regulatoryNote;
      }
    } catch (regulationRagError) {
      console.error('[Context] Error enriching with regulation RAG:', regulationRagError);
      // Continue without regulatory enrichment - user system data is still valid
      systemDescription += '\n\n**Note:** Unable to retrieve additional regulatory context at this time.';
    }

    // Build final context
    const context: SystemAnalysisContext = {
      systemName,
      systemDescription,
      riskLevel,
      complianceStatus,
      assessments,
      gaps
    };

    // Compute confidence level based on data completeness
    context.confidenceLevel = computeConfidenceLevel(context);

    return context;
  } catch (error) {
    console.error('Error fetching system analysis context:', error);
    return {
      systemName: 'Error',
      systemDescription: 'Failed to fetch system data. Please check your access permissions and try again.',
      riskLevel: 'Unknown',
      complianceStatus: 'Unknown',
      assessments: [],
      gaps: ['Error loading system data'],
      confidenceLevel: 'low'
    };
  }
}

/**
 * Get context for ACTION mode
 * 
 * Uses Platform RAG to provide workflow guidance and next steps.
 * Combines RAG knowledge with current system state from database.
 * 
 * DOES NOT analyze systems or cite regulations - focuses on actionable steps.
 * 
 * @param userMessage - The user's question
 * @param pageContext - Current page context (may include systemId)
 * @param userId - Authenticated user ID (for tenant isolation)
 * @returns ActionContext with workflow and task information
 */
export async function getActionContext(
  userMessage: string,
  pageContext: PageContext,
  userId: string
): Promise<ActionContext> {
  try {
    const supabase = supabaseAdmin;

    let availableWorkflows: string[] = [];
    const pendingTasks: string[] = [];
    let nextSteps: string[] = [];

    // PRIMARY SOURCE: Platform RAG for workflows and guidance
    try {
      console.log(`[Context] Querying Platform RAG for ACTION mode`);
      
      // Query Platform RAG for workflow information
      const platformContext = await getPlatformContextString(
        userMessage + ' workflow steps actions', // Enhance query for workflow content
        5,
        'workflows' // Filter for workflow-specific content if available
      );

      if (platformContext && 
          platformContext !== 'No relevant platform knowledge found.' && 
          platformContext !== 'No query provided.') {
        
        // Extract workflow suggestions from RAG context
        // The RAG context should contain step-by-step guides and workflows
        const workflowLines = platformContext.split('\n').filter(line => 
          line.toLowerCase().includes('workflow') || 
          line.toLowerCase().includes('step') ||
          line.toLowerCase().includes('action') ||
          line.toLowerCase().includes('create') ||
          line.toLowerCase().includes('generate')
        );

        // Add workflows found in RAG
        workflowLines.forEach(line => {
          if (line.trim().length > 0) {
            availableWorkflows.push(line.trim());
          }
        });

        // Generate next steps from RAG context
        const stepLines = platformContext.split('\n').filter(line => 
          line.toLowerCase().includes('next') || 
          line.toLowerCase().includes('then') ||
          line.toLowerCase().includes('follow')
        );

        stepLines.forEach(line => {
          if (line.trim().length > 0) {
            nextSteps.push(line.trim());
          }
        });
      }
    } catch (platformRagError) {
      console.error('[Context] Error querying Platform RAG for ACTION mode:', platformRagError);
      // Continue with fallback workflows
    }

    // Fallback workflows if RAG doesn't provide enough
    if (availableWorkflows.length === 0) {
      availableWorkflows = [
        'Create Risk Assessment',
        'Generate Compliance Documentation', 
        'Run Red Teaming Tests',
        'Update System Lifecycle Stage',
        'Review System Registry',
        'Generate Governance Tasks'
      ];
    }

    // SUPPORTING SOURCE: Database for current system state and pending tasks
    if (pageContext.systemId && userId) {
      try {
        const { data: tasks } = await supabase
          .from('governance_tasks')
          .select('*')
          .eq('ai_system_id', pageContext.systemId)
          .eq('status', 'Pending')
          .limit(5);

        if (tasks) {
          tasks.forEach(task => {
            pendingTasks.push(task.title || 'Untitled task');
          });
        }
      } catch (dbError) {
        console.error('[Context] Error fetching pending tasks:', dbError);
        // Continue without pending tasks
      }
    }

    // Generate context-aware next steps if RAG didn't provide enough
    if (nextSteps.length === 0) {
      if (pageContext.pageType === 'ai-system') {
        nextSteps = ['Review risk assessments', 'Check compliance status', 'Update documentation'];
      } else if (pageContext.pageType === 'dashboard') {
        nextSteps = ['View system details', 'Start new assessment', 'Review pending tasks'];
      } else {
        nextSteps = ['Navigate to AI Systems', 'Create new system', 'Review compliance dashboard'];
      }
    }

    return {
      availableWorkflows: availableWorkflows.slice(0, 10), // Limit to top 10
      systemMetadata: pageContext.additionalMetadata || {},
      pendingTasks,
      nextSteps: nextSteps.slice(0, 5) // Limit to top 5
    };
  } catch (error) {
    console.error('Error fetching action context:', error);
    return {
      availableWorkflows: ['Error loading workflows'],
      systemMetadata: {},
      pendingTasks: [],
      nextSteps: ['Error loading action context - please try again']
    };
  }
}

