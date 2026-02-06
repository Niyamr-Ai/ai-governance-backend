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
  // Low confidence: No assessments found
  if (!context.assessments || context.assessments.length === 0) {
    return 'low';
  }

  // Check if assessment data is incomplete (has Unknown or missing critical fields)
  const hasIncompleteData = 
    !context.riskLevel || 
    context.riskLevel === 'Unknown' ||
    !context.complianceStatus || 
    context.complianceStatus === 'Unknown' ||
    !context.systemName ||
    context.systemName === 'Unknown';

  // Low confidence: Assessments exist but critical fields are missing/Unknown
  if (hasIncompleteData) {
    return 'low';
  }

  // Medium confidence: Has assessments and basic info, but may have gaps
  if (context.gaps && context.gaps.length > 0) {
    return 'medium';
  }

  // High confidence: Complete system data + recent assessments + no major gaps
  if (
    context.systemName &&
    context.systemName !== 'Unknown' &&
    context.riskLevel &&
    context.riskLevel !== 'Unknown' &&
    context.complianceStatus &&
    context.complianceStatus !== 'Unknown' &&
    context.assessments &&
    context.assessments.length > 0
  ) {
    return 'high';
  }

  // Medium confidence: Partial data available
  return 'medium';
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
      
      // Fetch all systems across all compliance frameworks for this user
      // IMPORTANT: Use user_id to match dashboard API behavior (dashboard uses user_id, not org_id)
      console.log(`[Context] 🔍 Fetching systems for user_id: ${userId}`);
      
      // NOTE: Column names must match database schema:
      // EU: uses user_id (matching /api/compliance endpoint)
      // UK: risk_level, overall_assessment (snake_case), uses user_id (matching /api/uk-compliance endpoint)
      // MAS: overall_risk_level, overall_compliance_status (snake_case), uses user_id (matching /api/mas-compliance endpoint)
      const [euSystems, ukSystems, masSystems] = await Promise.all([
        supabase.from('eu_ai_act_check_results').select('id, system_name, risk_tier, compliance_status').eq('user_id', userId),
        supabase.from('uk_ai_assessments').select('id, system_name, risk_level, overall_assessment').eq('user_id', userId),
        supabase.from('mas_ai_risk_assessments').select('id, system_name, overall_risk_level, overall_compliance_status').eq('user_id', userId)
      ]);

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

      // Calculate TOTAL ASSESSMENT RECORDS (matching dashboard count)
      // Dashboard counts all assessment records, not unique systems
      // Use the actual data arrays (not deduplicated) to match dashboard behavior
      const euCount = euSystems.data?.length || 0;
      const ukCount = ukSystems.data?.length || 0;
      const masCount = masSystems.data?.length || 0;
      const totalAssessmentRecords = euCount + ukCount + masCount;
      const uniqueSystemsCount = allSystems.length;

      console.log(`[Context] ✅ Aggregated ${uniqueSystemsCount} unique systems across all regulations`);
      console.log(`[Context] 📊 Total assessment records: ${totalAssessmentRecords} (EU: ${euSystems.data?.length || 0}, UK: ${ukSystems.data?.length || 0}, MAS: ${masSystems.data?.length || 0})`);
      if (allSystems.length > 0) {
        console.log(`[Context]    Systems breakdown: ${allSystems.map(s => `${s.name} (${s.frameworks.join(', ')})`).join(', ')}`);
      }

      // Calculate overall statistics
      // Use totalAssessmentRecords for "total systems" count to match dashboard
      const totalSystems = totalAssessmentRecords; // Match dashboard: count all assessment records
      
      // Count compliance status from RAW assessment records (not deduplicated systems)
      // This matches dashboard behavior which counts all assessment records
      let compliantCount = 0;
      let nonCompliantCount = 0;
      let partiallyCompliantCount = 0;
      
      // Count EU compliance
      if (euSystems.data) {
        euSystems.data.forEach((sys: any) => {
          const status = (sys.compliance_status || '').toLowerCase();
          if (status.includes('compliant') && !status.includes('non') && !status.includes('partial')) {
            compliantCount++;
          } else if (status.includes('non-compliant') || status.includes('non compliant')) {
            nonCompliantCount++;
          } else if (status.includes('partial')) {
            partiallyCompliantCount++;
          }
        });
      }
      
      // Count UK compliance
      if (ukSystems.data) {
        ukSystems.data.forEach((sys: any) => {
          const status = (sys.overall_assessment || '').toLowerCase();
          if (status.includes('compliant') && !status.includes('non') && !status.includes('partial')) {
            compliantCount++;
          } else if (status.includes('non-compliant') || status.includes('non compliant')) {
            nonCompliantCount++;
          } else if (status.includes('partial')) {
            partiallyCompliantCount++;
          }
        });
      }
      
      // Count MAS compliance
      if (masSystems.data) {
        masSystems.data.forEach((sys: any) => {
          const status = (sys.overall_compliance_status || '').toLowerCase();
          if (status.includes('compliant') && !status.includes('non') && !status.includes('partial')) {
            compliantCount++;
          } else if (status.includes('non-compliant') || status.includes('non compliant')) {
            nonCompliantCount++;
          } else if (status.includes('partial')) {
            partiallyCompliantCount++;
          }
        });
      }
      
      // Count by risk level from RAW assessment records (not deduplicated systems)
      let highRiskCount = 0;
      let mediumRiskCount = 0;
      let lowRiskCount = 0;
      let prohibitedCount = 0;
      let unknownRiskCount = 0; // Track systems without risk level
      
      // Count EU risk
      if (euSystems.data) {
        euSystems.data.forEach((sys: any) => {
          const risk = (sys.risk_tier || '').toLowerCase().trim();
          if (!risk || risk === 'null' || risk === 'undefined') {
            unknownRiskCount++;
          } else if (risk === 'prohibited') {
            prohibitedCount++;
          } else if (risk.includes('high') || risk.includes('critical')) {
            highRiskCount++;
          } else if (risk.includes('medium')) {
            mediumRiskCount++;
          } else if (risk.includes('low')) {
            lowRiskCount++;
          } else {
            unknownRiskCount++; // Unknown risk level
          }
        });
      }
      
      // Count UK risk
      if (ukSystems.data) {
        ukSystems.data.forEach((sys: any) => {
          const risk = (sys.risk_level || '').toLowerCase().trim();
          if (!risk || risk === 'null' || risk === 'undefined') {
            unknownRiskCount++;
          } else if (risk.includes('high') || risk.includes('critical') || risk.includes('frontier')) {
            highRiskCount++;
          } else if (risk.includes('medium')) {
            mediumRiskCount++;
          } else if (risk.includes('low')) {
            lowRiskCount++;
          } else {
            unknownRiskCount++; // Unknown risk level
          }
        });
      }
      
      // Count MAS risk
      if (masSystems.data) {
        masSystems.data.forEach((sys: any) => {
          const risk = (sys.overall_risk_level || '').toLowerCase().trim();
          if (!risk || risk === 'null' || risk === 'undefined') {
            unknownRiskCount++;
          } else if (risk === 'critical') {
            highRiskCount++; // Critical is counted as high-risk only (not prohibited)
          } else if (risk.includes('high')) {
            highRiskCount++;
          } else if (risk.includes('medium')) {
            mediumRiskCount++;
          } else if (risk.includes('low')) {
            lowRiskCount++;
          } else {
            unknownRiskCount++; // Unknown risk level
          }
        });
      }
      
      // Verify total count matches assessment records
      const riskTotal = highRiskCount + mediumRiskCount + lowRiskCount + prohibitedCount + unknownRiskCount;
      if (riskTotal !== totalAssessmentRecords) {
        console.warn(`[Context] ⚠️ Risk count mismatch: ${riskTotal} vs ${totalAssessmentRecords} assessment records`);
      }

      // Calculate regulation-specific statistics for compliance and risk
      let euCompliant = 0, euPartiallyCompliant = 0, euNonCompliant = 0;
      let ukCompliant = 0, ukPartiallyCompliant = 0, ukNonCompliant = 0;
      let masCompliant = 0, masPartiallyCompliant = 0, masNonCompliant = 0;
      
      let euHighRisk = 0, euMediumRisk = 0, euLowRisk = 0, euProhibited = 0;
      let ukHighRisk = 0, ukMediumRisk = 0, ukLowRisk = 0;
      let masHighRisk = 0, masMediumRisk = 0, masLowRisk = 0, masCritical = 0;
      
      // Count EU-specific stats
      if (euSystems.data) {
        euSystems.data.forEach((sys: any) => {
          const status = (sys.compliance_status || '').toLowerCase();
          const risk = (sys.risk_tier || '').toLowerCase();
          if (status.includes('compliant') && !status.includes('non') && !status.includes('partial')) euCompliant++;
          else if (status.includes('non-compliant') || status.includes('non compliant')) euNonCompliant++;
          else if (status.includes('partial')) euPartiallyCompliant++;
          if (risk === 'prohibited') euProhibited++;
          else if (risk.includes('high') || risk.includes('critical')) euHighRisk++;
          else if (risk.includes('medium')) euMediumRisk++;
          else if (risk.includes('low')) euLowRisk++;
        });
      }
      
      // Count UK-specific stats
      if (ukSystems.data) {
        ukSystems.data.forEach((sys: any) => {
          const status = (sys.overall_assessment || '').toLowerCase();
          const risk = (sys.risk_level || '').toLowerCase();
          if (status.includes('compliant') && !status.includes('non') && !status.includes('partial')) ukCompliant++;
          else if (status.includes('non-compliant') || status.includes('non compliant')) ukNonCompliant++;
          else if (status.includes('partial')) ukPartiallyCompliant++;
          if (risk.includes('high') || risk.includes('critical') || risk.includes('frontier')) ukHighRisk++;
          else if (risk.includes('medium')) ukMediumRisk++;
          else if (risk.includes('low')) ukLowRisk++;
        });
      }
      
      // Count MAS-specific stats
      if (masSystems.data) {
        masSystems.data.forEach((sys: any) => {
          const status = (sys.overall_compliance_status || '').toLowerCase();
          const risk = (sys.overall_risk_level || '').toLowerCase().trim();
          if (status.includes('compliant') && !status.includes('non') && !status.includes('partial')) masCompliant++;
          else if (status.includes('non-compliant') || status.includes('non compliant')) masNonCompliant++;
          else if (status.includes('partial')) masPartiallyCompliant++;
          if (risk === 'critical') {
            masCritical++;
            masHighRisk++; // Critical is also counted as high-risk
          } else if (risk.includes('high')) {
            masHighRisk++;
          } else if (risk.includes('medium')) {
            masMediumRisk++;
          } else if (risk.includes('low')) {
            masLowRisk++;
          }
        });
      }
      
      // Build comprehensive dashboard summary with regulation breakdown
      // NOTE: totalSystems now represents TOTAL ASSESSMENT RECORDS (matching dashboard)
      const dashboardSummary = `
**Organization Overview (ALL Regulations):**
- Total Assessments: ${totalSystems} (${uniqueSystemsCount} unique systems)
- Compliant Systems: ${compliantCount}
- Partially Compliant: ${partiallyCompliantCount}
- Non-Compliant Systems: ${nonCompliantCount}

**Risk Distribution (Across All Regulations):**
- High Risk: ${highRiskCount}
- Medium Risk: ${mediumRiskCount}
- Low Risk: ${lowRiskCount}
${prohibitedCount > 0 ? `- Prohibited: ${prohibitedCount}` : ''}
${unknownRiskCount > 0 ? `- Unknown/Unassigned: ${unknownRiskCount}` : ''}
- **Total**: ${riskTotal} assessment records

**Regulation Coverage (Assessment Records):**
- EU AI Act: ${euCount} assessments
  - Compliant: ${euCompliant}, Partially Compliant: ${euPartiallyCompliant}, Non-Compliant: ${euNonCompliant}
  - Risk: High: ${euHighRisk}, Medium: ${euMediumRisk}, Low: ${euLowRisk}${euProhibited > 0 ? `, Prohibited: ${euProhibited}` : ''}
- UK AI Act: ${ukCount} assessments
  - Compliant: ${ukCompliant}, Partially Compliant: ${ukPartiallyCompliant}, Non-Compliant: ${ukNonCompliant}
  - Risk: High: ${ukHighRisk}, Medium: ${ukMediumRisk}, Low: ${ukLowRisk}
- MAS: ${masCount} assessments
  - Compliant: ${masCompliant}, Partially Compliant: ${masPartiallyCompliant}, Non-Compliant: ${masNonCompliant}
  - Risk: High: ${masHighRisk}, Medium: ${masMediumRisk}, Low: ${masLowRisk}${masCritical > 0 ? `, Critical: ${masCritical}` : ''}

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
    
    // Check if this is a risk assessment query (distinct from compliance assessment)
    const isRiskAssessmentQuery = /(has.*completed.*risk assessment|risk assessment.*completed|completed.*risk assessment|what.*risk score|overall risk score|risk score|automated risk assessment)/i.test(userMessage);
    
    // Check if this is a documentation query - should query actual documentation table
    const isDocumentationQuery = /(what.*documentation|documentation.*exists|documentation.*generated|has.*documentation|what.*evidence|evidence.*uploaded|what.*documents|documents.*for this system)/i.test(userMessage);
    
    // Check if this is a comparison query - should fetch all systems for comparison
    const isComparisonQuery = /(compare.*other systems|compare to.*other|more or less risky than.*other|how does.*compare|compare.*systems)/i.test(userMessage);
    
    // For compliance queries, fetch directly from database (more accurate than RAG)
    if (isComplianceQuery || isRiskAssessmentQuery) {
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
        
        // Check if we're on a detailed compliance page and fetch detailed assessment
        const isDetailedPage = pageContext.additionalMetadata?.pathname?.includes('/compliance/detailed/');
        let detailedAssessment = null;
        
        if (isDetailedPage && systemId) {
          console.log(`[Context] 🔍 Detected detailed compliance page, fetching detailed assessment...`);
          const { data: detailedData } = await supabase
            .from('ai_system_compliance')
            .select('*')
            .eq('compliance_id', systemId)
            .maybeSingle();
          
          if (detailedData) {
            detailedAssessment = detailedData;
            console.log(`[Context] ✅ Found detailed assessment data`);
          }
        }
        
        complianceSummary += `**EU AI Act:**\n`;
        complianceSummary += `- Risk Tier: ${euData.risk_tier || 'Unknown'}\n`;
        complianceSummary += `- Compliance Status: ${euData.compliance_status || 'Unknown'}\n`;
        if (euData.high_risk_missing && Array.isArray(euData.high_risk_missing) && euData.high_risk_missing.length > 0) {
          complianceSummary += `- Missing High-Risk Obligations: ${euData.high_risk_missing.join(', ')}\n`;
          allGaps.push(...euData.high_risk_missing);
        }
        
        // Add detailed assessment information if available
        if (detailedAssessment) {
          complianceSummary += `- **Detailed Assessment Available:** Yes\n`;
          complianceSummary += `- Risk Management: ${detailedAssessment.documented_risk_management_system ? 'Fulfilled' : 'Not Fulfilled'}\n`;
          complianceSummary += `- Data Governance: ${detailedAssessment.data_relevance_and_quality ? 'Fulfilled' : 'Not Fulfilled'}\n`;
          complianceSummary += `- Technical Documentation: ${detailedAssessment.technical_documentation_available ? 'Fulfilled' : 'Not Fulfilled'}\n`;
          complianceSummary += `- Transparency: ${detailedAssessment.operation_transparency ? 'Fulfilled' : 'Not Fulfilled'}\n`;
          complianceSummary += `- Security: ${detailedAssessment.accuracy_robustness_cybersecurity ? 'Fulfilled' : 'Not Fulfilled'}\n`;
          complianceSummary += `- Conformity Assessment: ${detailedAssessment.conformity_assessment_completed ? 'Fulfilled' : 'Not Fulfilled'}\n`;
        }
        
        complianceSummary += `\n`;
        allAssessments.push({ framework: 'EU', data: euData, detailed: detailedAssessment });
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
        // Handle both camelCase and snake_case field names
        const ukRiskLevel = ukData.risk_level || ukData.riskLevel || 'Unknown';
        const ukOverallAssessment = ukData.overall_assessment || ukData.overallAssessment || 'Unknown';
        const ukSafetyAndSecurity = ukData.safety_and_security || ukData.safetyAndSecurity;
        const ukTransparency = ukData.transparency;
        const ukFairness = ukData.fairness;
        
        complianceSummary += `**UK AI Act:**\n`;
        complianceSummary += `- Risk Level: ${ukRiskLevel}\n`;
        complianceSummary += `- Overall Assessment: ${ukOverallAssessment}\n`;
        if (ukSafetyAndSecurity?.missing && ukSafetyAndSecurity.missing.length > 0) {
          complianceSummary += `- Safety & Security Gaps: ${ukSafetyAndSecurity.missing.join(', ')}\n`;
          allGaps.push(...ukSafetyAndSecurity.missing);
        }
        if (ukTransparency?.missing && ukTransparency.missing.length > 0) {
          complianceSummary += `- Transparency Gaps: ${ukTransparency.missing.join(', ')}\n`;
          allGaps.push(...ukTransparency.missing);
        }
        if (ukFairness?.missing && ukFairness.missing.length > 0) {
          complianceSummary += `- Fairness Gaps: ${ukFairness.missing.join(', ')}\n`;
          allGaps.push(...ukFairness.missing);
        }
        complianceSummary += `\n`;
        allAssessments.push({ framework: 'UK', data: ukData });
        if (!systemName || systemName === 'Unknown System') {
          systemName = ukData.system_name || systemData?.name || 'Unknown System';
        }
        if (!complianceStatus || complianceStatus === 'Unknown') {
          complianceStatus = ukOverallAssessment;
        }
        if (!riskLevel || riskLevel === 'Unknown') {
          riskLevel = ukRiskLevel;
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
      
      // If this is a risk assessment query, also check for automated risk assessments
      if (isRiskAssessmentQuery) {
        console.log(`[Context] 🔍 Risk assessment query detected - checking for automated risk assessments`);
        const { data: automatedRiskAssessment, error: riskError } = await supabase
          .from('automated_risk_assessments')
          .select('*')
          .eq('ai_system_id', systemId)
          .order('assessed_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (riskError) {
          console.error(`[Context] ❌ Error fetching automated risk assessment:`, riskError);
        } else if (automatedRiskAssessment) {
          console.log(`[Context] ✅ Found automated risk assessment (assessed at: ${automatedRiskAssessment.assessed_at})`);
          complianceSummary += `\n**Automated Risk Assessment:**\n`;
          complianceSummary += `- Status: Completed\n`;
          complianceSummary += `- Assessed At: ${new Date(automatedRiskAssessment.assessed_at).toLocaleString()}\n`;
          complianceSummary += `- Composite Risk Score: ${automatedRiskAssessment.composite_score}/10\n`;
          complianceSummary += `- Overall Risk Level: ${automatedRiskAssessment.overall_risk_level}\n`;
          complianceSummary += `- Technical Risk Score: ${automatedRiskAssessment.technical_risk_score}/10\n`;
          complianceSummary += `- Operational Risk Score: ${automatedRiskAssessment.operational_risk_score}/10\n`;
          complianceSummary += `- Legal/Regulatory Risk Score: ${automatedRiskAssessment.legal_regulatory_risk_score}/10\n`;
          complianceSummary += `- Ethical/Societal Risk Score: ${automatedRiskAssessment.ethical_societal_risk_score}/10\n`;
          complianceSummary += `- Business Risk Score: ${automatedRiskAssessment.business_risk_score}/10\n`;
          if (automatedRiskAssessment.approval_status) {
            complianceSummary += `- Approval Status: ${automatedRiskAssessment.approval_status}\n`;
          }
          complianceSummary += `\n`;
        } else {
          console.log(`[Context] ⚠️ No automated risk assessment found for system ${systemId}`);
          complianceSummary += `\n**Automated Risk Assessment:**\n`;
          complianceSummary += `- Status: Not Completed\n`;
          complianceSummary += `- Note: This system has compliance assessments (${allAssessments.map(a => a.framework).join(', ')}) but no automated risk assessment has been generated yet.\n`;
          complianceSummary += `- Compliance assessments evaluate regulatory compliance, while risk assessments provide comprehensive risk scoring across multiple dimensions.\n`;
          complianceSummary += `\n`;
        }
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

    // For documentation queries, fetch actual documentation records from database
    if (isDocumentationQuery && systemId) {
      console.log(`[Context] 📄 Documentation query detected - fetching actual documentation records from database`);
      
      try {
        const { data: documentationRecords, error: docError } = await supabase
          .from('compliance_documentation')
          .select('*')
          .eq('ai_system_id', systemId)
          .eq('org_id', userId)
          .order('created_at', { ascending: false });
        
        if (docError) {
          console.error(`[Context] ❌ Error fetching documentation:`, docError);
        } else if (documentationRecords && documentationRecords.length > 0) {
          console.log(`[Context] ✅ Found ${documentationRecords.length} documentation record(s) for system ${systemId}`);
          
          let documentationSummary = `\n\n**ACTUAL DOCUMENTATION RECORDS FOR THIS SYSTEM:**\n\n`;
          documentationRecords.forEach((doc: any, idx: number) => {
            documentationSummary += `${idx + 1}. **${doc.document_type || 'Document'}** (${doc.regulation_type || 'Unknown Regulation'})\n`;
            documentationSummary += `   - Status: ${doc.status || 'Unknown'}\n`;
            documentationSummary += `   - Version: ${doc.version || 'N/A'}\n`;
            documentationSummary += `   - Created: ${doc.created_at ? new Date(doc.created_at).toLocaleString() : 'Unknown'}\n`;
            if (doc.ai_system_version) {
              documentationSummary += `   - System Version: ${doc.ai_system_version}\n`;
            }
            if (doc.risk_assessment_version) {
              documentationSummary += `   - Risk Assessment Version: ${doc.risk_assessment_version}\n`;
            }
            documentationSummary += `\n`;
          });
          
          systemDescription += documentationSummary;
        } else {
          console.log(`[Context] ℹ️ No documentation records found for system ${systemId}`);
          systemDescription += `\n\n**DOCUMENTATION STATUS:**\nNo documentation records found in the database for this system. Documentation may need to be generated using the "Generate Compliance Documentation" workflow.`;
        }
      } catch (docQueryError) {
        console.error('[Context] Error querying documentation table:', docQueryError);
        systemDescription += `\n\n**Note:** Unable to query documentation records at this time.`;
      }
    }

    // For comparison queries, fetch all systems in the organization for comparison
    if (isComparisonQuery && systemId && userId) {
      console.log(`[Context] 🔄 Comparison query detected - fetching all systems in organization for comparison`);
      
      try {
        // Fetch all systems from EU, UK, and MAS tables
        const [euSystemsResult, ukSystemsResult, masSystemsResult] = await Promise.all([
          supabase
            .from('eu_ai_act_check_results')
            .select('id, system_name, risk_tier, compliance_status')
            .eq('org_id', userId),
          supabase
            .from('uk_ai_assessments')
            .select('id, system_name, risk_level, compliance_status')
            .eq('org_id', userId),
          supabase
            .from('mas_ai_risk_assessments')
            .select('id, system_name, risk_level, compliance_status')
            .eq('org_id', userId)
        ]);
        
        const allSystems: any[] = [];
        
        // Process EU systems
        if (euSystemsResult.data) {
          euSystemsResult.data.forEach((sys: any) => {
            if (sys.id !== systemId) { // Exclude current system
              allSystems.push({
                id: sys.id,
                name: sys.system_name || `EU System ${sys.id.substring(0, 8)}`,
                regulation: 'EU AI Act',
                riskLevel: sys.risk_tier || 'Unknown',
                complianceStatus: sys.compliance_status || 'Unknown'
              });
            }
          });
        }
        
        // Process UK systems
        if (ukSystemsResult.data) {
          ukSystemsResult.data.forEach((sys: any) => {
            if (sys.id !== systemId) { // Exclude current system
              allSystems.push({
                id: sys.id,
                name: sys.system_name || `UK System ${sys.id.substring(0, 8)}`,
                regulation: 'UK AI Act',
                riskLevel: sys.risk_level || 'Unknown',
                complianceStatus: sys.compliance_status || 'Unknown'
              });
            }
          });
        }
        
        // Process MAS systems
        if (masSystemsResult.data) {
          masSystemsResult.data.forEach((sys: any) => {
            if (sys.id !== systemId) { // Exclude current system
              allSystems.push({
                id: sys.id,
                name: sys.system_name || `MAS System ${sys.id.substring(0, 8)}`,
                regulation: 'MAS',
                riskLevel: sys.risk_level || 'Unknown',
                complianceStatus: sys.compliance_status || 'Unknown'
              });
            }
          });
        }
        
        if (allSystems.length > 0) {
          console.log(`[Context] ✅ Found ${allSystems.length} other system(s) in organization for comparison`);
          
          let comparisonSummary = `\n\n**COMPARISON DATA - ALL OTHER SYSTEMS IN YOUR ORGANIZATION:**\n\n`;
          comparisonSummary += `Total other systems: ${allSystems.length}\n\n`;
          
          // Group by risk level
          const riskDistribution: { [key: string]: number } = {};
          const complianceDistribution: { [key: string]: number } = {};
          
          allSystems.forEach((sys: any) => {
            const risk = sys.riskLevel || 'Unknown';
            const compliance = sys.complianceStatus || 'Unknown';
            riskDistribution[risk] = (riskDistribution[risk] || 0) + 1;
            complianceDistribution[compliance] = (complianceDistribution[compliance] || 0) + 1;
          });
          
          comparisonSummary += `**Risk Level Distribution:**\n`;
          Object.entries(riskDistribution).forEach(([level, count]) => {
            comparisonSummary += `- ${level}: ${count} system(s)\n`;
          });
          
          comparisonSummary += `\n**Compliance Status Distribution:**\n`;
          Object.entries(complianceDistribution).forEach(([status, count]) => {
            comparisonSummary += `- ${status}: ${count} system(s)\n`;
          });
          
          comparisonSummary += `\n**Individual System Details:**\n`;
          allSystems.forEach((sys: any, idx: number) => {
            comparisonSummary += `${idx + 1}. **${sys.name}** (${sys.regulation})\n`;
            comparisonSummary += `   - Risk Level: ${sys.riskLevel}\n`;
            comparisonSummary += `   - Compliance Status: ${sys.complianceStatus}\n`;
            comparisonSummary += `\n`;
          });
          
          systemDescription += comparisonSummary;
        } else {
          console.log(`[Context] ℹ️ No other systems found in organization for comparison`);
          systemDescription += `\n\n**COMPARISON DATA:**\nNo other systems found in your organization. This is the only system registered.`;
        }
      } catch (comparisonError) {
        console.error('[Context] Error fetching systems for comparison:', comparisonError);
        systemDescription += `\n\n**Note:** Unable to fetch other systems for comparison at this time.`;
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
    // Handle both single system queries and dashboard queries
    const isDashboardQuery = pageContext.pageType === 'dashboard' && !pageContext.systemId;
    
    if (userId) {
      try {
        if (isDashboardQuery) {
          // Dashboard query: Fetch pending tasks across ALL systems for this user
          console.log(`[Context] Dashboard query detected - fetching pending tasks across all systems`);
          
          // Get all system IDs for this user across all regulations
          const [euSystems, ukSystems, masSystems] = await Promise.all([
            supabase.from('eu_ai_act_check_results').select('id').eq('user_id', userId),
            supabase.from('uk_ai_assessments').select('id').eq('user_id', userId),
            supabase.from('mas_ai_risk_assessments').select('id').eq('user_id', userId)
          ]);
          
          const allSystemIds = [
            ...(euSystems.data || []).map(s => s.id),
            ...(ukSystems.data || []).map(s => s.id),
            ...(masSystems.data || []).map(s => s.id)
          ];
          
          if (allSystemIds.length > 0) {
            const { data: tasks } = await supabase
              .from('governance_tasks')
              .select('*')
              .in('ai_system_id', allSystemIds)
              .eq('status', 'Pending')
              .order('created_at', { ascending: false })
              .limit(20); // Get more tasks for dashboard view
            
            if (tasks && tasks.length > 0) {
              console.log(`[Context] ✅ Found ${tasks.length} pending tasks across all systems`);
              
              // Fetch system names for each task to provide context
              const systemIdToNameMap = new Map<string, string>();
              
              // Get unique system IDs from tasks
              const uniqueSystemIds = [...new Set(tasks.map(t => t.ai_system_id))];
              
              // Fetch system names from all regulation tables in parallel
              const [euSystemsData, ukSystemsData, masSystemsData] = await Promise.all([
                supabase.from('eu_ai_act_check_results').select('id, system_name').in('id', uniqueSystemIds),
                supabase.from('uk_ai_assessments').select('id, system_name').in('id', uniqueSystemIds),
                supabase.from('mas_ai_risk_assessments').select('id, system_name').in('id', uniqueSystemIds)
              ]);
              
              // Build system name map
              if (euSystemsData.data) {
                euSystemsData.data.forEach(sys => {
                  if (sys.system_name) systemIdToNameMap.set(sys.id, sys.system_name);
                });
              }
              if (ukSystemsData.data) {
                ukSystemsData.data.forEach(sys => {
                  if (sys.system_name && !systemIdToNameMap.has(sys.id)) {
                    systemIdToNameMap.set(sys.id, sys.system_name);
                  }
                });
              }
              if (masSystemsData.data) {
                masSystemsData.data.forEach(sys => {
                  if (sys.system_name && !systemIdToNameMap.has(sys.id)) {
                    systemIdToNameMap.set(sys.id, sys.system_name);
                  }
                });
              }
              
              // Format tasks with system context
              tasks.forEach(task => {
                const systemName = systemIdToNameMap.get(task.ai_system_id) || 'Unknown System';
                const regulation = task.regulation || 'Unknown';
                const taskTitle = task.title || 'Untitled task';
                pendingTasks.push(`${taskTitle} (${systemName} - ${regulation})`);
              });
            } else {
              console.log(`[Context] ℹ️ No pending tasks found across all systems`);
            }
          }
        } else if (pageContext.systemId) {
          // Single system query: Fetch pending tasks for specific system
          const { data: tasks } = await supabase
            .from('governance_tasks')
            .select('*')
            .eq('ai_system_id', pageContext.systemId)
            .eq('status', 'Pending')
            .limit(5);

          if (tasks && tasks.length > 0) {
            tasks.forEach(task => {
              pendingTasks.push(task.title || 'Untitled task');
            });
          }
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

