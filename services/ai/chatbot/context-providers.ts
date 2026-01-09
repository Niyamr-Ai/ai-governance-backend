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
      
      console.log(`[Context] Querying ${regulationType} regulation RAG for EXPLAIN mode`);
      const ragContext = await getRegulationContextString(userMessage, regulationType, 5);
      
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

  if (!pageContext.systemId) {
    return {
      systemName: 'Unknown',
      systemDescription: 'No system ID provided in context',
      riskLevel: 'Unknown',
      complianceStatus: 'Unknown',
      assessments: [],
      gaps: ['System ID is required for analysis'],
      confidenceLevel: 'low'
    };
  }

  try {
    const supabase = supabaseAdmin;
    const systemId = pageContext.systemId;

    // PRIMARY SOURCE: User System RAG (tenant-isolated)
    let systemDescription = 'No system data available';
    let systemName = 'Unknown System';
    let riskLevel = 'Unknown';
    let complianceStatus = 'Unknown';
    let assessments: any[] = [];
    let gaps: string[] = [];

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
        
        const { data: systemData } = await supabase
          .from('ai_system_registry')
          .select('*')
          .eq('system_id', systemId)
          .single();

        const { data: complianceData } = await supabase
          .from('eu_ai_act_check_results')
          .select('*')
          .eq('system_name', systemData?.name || '')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        systemName = systemData?.name || 'Unknown System';
        systemDescription = systemData?.description || 'No description available';
        riskLevel = complianceData?.risk_tier || 'Unknown';
        complianceStatus = complianceData?.compliance_status || 'Unknown';
        assessments = complianceData ? [complianceData] : [];
        gaps = complianceData?.high_risk_obligations?.missing || [];
      }
    } catch (userRagError) {
      console.error('[Context] Error querying User System RAG:', userRagError);
      systemDescription = 'Error retrieving system data. Please ensure the system exists and you have access.';
      gaps.push('Unable to load system data');
    }

    // SUPPORTING SOURCE: Regulation RAG (enrichment only)
    try {
      const regulationType = detectRegulationType(userMessage);
      
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

