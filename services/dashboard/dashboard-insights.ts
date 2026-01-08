/**
 * Dashboard Insights Service
 * 
 * Provides RAG-powered contextual insights for compliance dashboards.
 * Uses Regulation RAG to provide specific guidance based on system status and compliance data.
 */

import { getRegulationContextString, type RegulationType } from '../ai/rag-service';

export type ComplianceStatus = 'compliant' | 'partially_compliant' | 'non_compliant' | 'unknown';
export type RiskTier = 'prohibited' | 'high_risk' | 'limited_risk' | 'minimal_risk' | 'unknown';

/**
 * Insight types for different dashboard contexts
 */
export interface ComplianceInsight {
  type: 'obligation' | 'recommendation' | 'warning' | 'next_step';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  regulatoryContext?: string;
  actionable: boolean;
  relatedArticles?: string[];
}

/**
 * Dashboard summary with insights
 */
export interface DashboardInsights {
  overallGuidance: string;
  keyInsights: ComplianceInsight[];
  riskTierGuidance: Record<string, string>;
  complianceStatusGuidance: Record<string, string>;
  nextSteps: string[];
  regulatoryUpdates?: string;
}

/**
 * System-specific insights
 */
export interface SystemInsights {
  systemId: string;
  systemName: string;
  riskTier: RiskTier;
  complianceStatus: ComplianceStatus;
  insights: ComplianceInsight[];
  recommendedActions: string[];
  regulatoryContext: string;
}

/**
 * Get comprehensive dashboard insights
 * 
 * @param systemsData - Array of system compliance data
 * @param regulationType - Primary regulation type (EU, UK, MAS)
 * @returns Dashboard insights with RAG-powered guidance
 */
export async function getDashboardInsights(
  systemsData: any[],
  regulationType: RegulationType = 'EU'
): Promise<DashboardInsights> {
  
  // Analyze systems data to build context
  const riskTierCounts = analyzeRiskTiers(systemsData);
  const complianceStatusCounts = analyzeComplianceStatus(systemsData);
  const criticalSystems = identifyCriticalSystems(systemsData);
  
  // Build RAG queries based on dashboard state
  const overallQuery = buildOverallGuidanceQuery(riskTierCounts, complianceStatusCounts, regulationType);
  const criticalSystemsQuery = buildCriticalSystemsQuery(criticalSystems, regulationType);
  
  let overallGuidance = '';
  let keyInsights: ComplianceInsight[] = [];
  let riskTierGuidance: Record<string, string> = {};
  let complianceStatusGuidance: Record<string, string> = {};
  let nextSteps: string[] = [];
  
  try {
    // Get overall guidance from RAG
    console.log(`[Dashboard Insights] Querying ${regulationType} RAG for overall guidance`);
    const overallContext = await getRegulationContextString(overallQuery, regulationType, 5);
    
    if (overallContext && 
        overallContext !== 'No relevant context found.' && 
        overallContext !== 'No query provided.') {
      overallGuidance = overallContext;
      
      // Extract insights from RAG context
      keyInsights = extractInsightsFromContext(overallContext, regulationType, systemsData);
      nextSteps = extractNextStepsFromContext(overallContext);
    }
    
    // Get specific guidance for risk tiers and compliance statuses
    riskTierGuidance = await getRiskTierGuidance(riskTierCounts, regulationType);
    complianceStatusGuidance = await getComplianceStatusGuidance(complianceStatusCounts, regulationType);
    
  } catch (error) {
    console.error('[Dashboard Insights] Error retrieving RAG context:', error);
    // Provide fallback insights
    overallGuidance = 'Unable to retrieve specific regulatory guidance at this time.';
    keyInsights = generateFallbackInsights(riskTierCounts, complianceStatusCounts, systemsData);
    nextSteps = generateFallbackNextSteps(systemsData);
  }
  
  return {
    overallGuidance,
    keyInsights,
    riskTierGuidance,
    complianceStatusGuidance,
    nextSteps
  };
}

/**
 * Get insights for a specific system
 * 
 * @param systemData - Individual system compliance data
 * @param regulationType - Regulation type (EU, UK, MAS)
 * @returns System-specific insights
 */
export async function getSystemInsights(
  systemData: any,
  regulationType: RegulationType = 'EU'
): Promise<SystemInsights> {
  
  const systemQuery = buildSystemSpecificQuery(systemData, regulationType);
  
  let insights: ComplianceInsight[] = [];
  let recommendedActions: string[] = [];
  let regulatoryContext = '';
  
  try {
    console.log(`[System Insights] Querying ${regulationType} RAG for system-specific guidance`);
    const context = await getRegulationContextString(systemQuery, regulationType, 3);
    
    if (context && 
        context !== 'No relevant context found.' && 
        context !== 'No query provided.') {
      regulatoryContext = context;
      insights = extractInsightsFromContext(context, regulationType, [systemData]);
      recommendedActions = extractActionsFromContext(context, systemData);
    }
    
  } catch (error) {
    console.error('[System Insights] Error retrieving system insights:', error);
    insights = generateFallbackSystemInsights(systemData);
    recommendedActions = generateFallbackActions(systemData);
  }
  
  return {
    systemId: systemData.id || systemData.system_id,
    systemName: systemData.system_name || systemData.name || 'Unknown System',
    riskTier: normalizeRiskTier(systemData.risk_tier || systemData.risk_level),
    complianceStatus: normalizeComplianceStatus(systemData.compliance_status),
    insights,
    recommendedActions,
    regulatoryContext
  };
}

/**
 * Analyze risk tier distribution
 */
function analyzeRiskTiers(systemsData: any[]): Record<string, number> {
  const counts: Record<string, number> = {
    prohibited: 0,
    high_risk: 0,
    limited_risk: 0,
    minimal_risk: 0,
    unknown: 0
  };
  
  systemsData.forEach(system => {
    const riskTier = normalizeRiskTier(system.risk_tier || system.risk_level);
    counts[riskTier] = (counts[riskTier] || 0) + 1;
  });
  
  return counts;
}

/**
 * Analyze compliance status distribution
 */
function analyzeComplianceStatus(systemsData: any[]): Record<string, number> {
  const counts: Record<string, number> = {
    compliant: 0,
    partially_compliant: 0,
    non_compliant: 0,
    unknown: 0
  };
  
  systemsData.forEach(system => {
    const status = normalizeComplianceStatus(system.compliance_status);
    counts[status] = (counts[status] || 0) + 1;
  });
  
  return counts;
}

/**
 * Identify critical systems requiring attention
 */
function identifyCriticalSystems(systemsData: any[]): any[] {
  return systemsData.filter(system => {
    const riskTier = normalizeRiskTier(system.risk_tier || system.risk_level);
    const complianceStatus = normalizeComplianceStatus(system.compliance_status);
    
    return (
      riskTier === 'prohibited' ||
      (riskTier === 'high_risk' && complianceStatus !== 'compliant') ||
      system.prohibited_practices_detected ||
      !system.high_risk_all_fulfilled
    );
  });
}

/**
 * Build overall guidance query for RAG
 */
function buildOverallGuidanceQuery(
  riskTierCounts: Record<string, number>,
  complianceStatusCounts: Record<string, number>,
  regulationType: RegulationType
): string {
  const totalSystems = Object.values(riskTierCounts).reduce((sum, count) => sum + count, 0);
  const highRiskSystems = riskTierCounts.high_risk + riskTierCounts.prohibited;
  const nonCompliantSystems = complianceStatusCounts.non_compliant + complianceStatusCounts.partially_compliant;
  
  return `compliance dashboard guidance ${totalSystems} AI systems ${highRiskSystems} high risk ${nonCompliantSystems} non compliant obligations requirements next steps`;
}

/**
 * Build critical systems query for RAG
 */
function buildCriticalSystemsQuery(criticalSystems: any[], regulationType: RegulationType): string {
  if (criticalSystems.length === 0) return '';
  
  const issues = criticalSystems.map(system => {
    const issues = [];
    if (system.prohibited_practices_detected) issues.push('prohibited practices');
    if (!system.high_risk_all_fulfilled) issues.push('missing high risk obligations');
    if (system.compliance_status === 'non_compliant') issues.push('non compliant');
    return issues.join(' ');
  }).join(' ');
  
  return `critical AI systems ${issues} immediate actions required obligations`;
}

/**
 * Build system-specific query for RAG
 */
function buildSystemSpecificQuery(systemData: any, regulationType: RegulationType): string {
  const riskTier = normalizeRiskTier(systemData.risk_tier || systemData.risk_level);
  const complianceStatus = normalizeComplianceStatus(systemData.compliance_status);
  
  let query = `${riskTier} AI system ${complianceStatus} obligations requirements`;
  
  // Add specific issues
  if (systemData.prohibited_practices_detected) {
    query += ' prohibited practices detected';
  }
  if (!systemData.high_risk_all_fulfilled && systemData.high_risk_missing) {
    query += ` missing obligations ${systemData.high_risk_missing.join(' ')}`;
  }
  if (systemData.transparency_required && systemData.transparency_missing) {
    query += ` transparency requirements ${systemData.transparency_missing.join(' ')}`;
  }
  
  return query;
}

/**
 * Get risk tier specific guidance
 */
async function getRiskTierGuidance(
  riskTierCounts: Record<string, number>,
  regulationType: RegulationType
): Promise<Record<string, string>> {
  const guidance: Record<string, string> = {};
  
  for (const [tier, count] of Object.entries(riskTierCounts)) {
    if (count > 0) {
      try {
        const query = `${tier} AI systems obligations requirements compliance ${count} systems`;
        const context = await getRegulationContextString(query, regulationType, 2);
        
        if (context && context !== 'No relevant context found.') {
          guidance[tier] = context;
        }
      } catch (error) {
        console.error(`Error getting guidance for ${tier}:`, error);
      }
    }
  }
  
  return guidance;
}

/**
 * Get compliance status specific guidance
 */
async function getComplianceStatusGuidance(
  statusCounts: Record<string, number>,
  regulationType: RegulationType
): Promise<Record<string, string>> {
  const guidance: Record<string, string> = {};
  
  for (const [status, count] of Object.entries(statusCounts)) {
    if (count > 0 && status !== 'compliant') {
      try {
        const query = `${status} AI systems remediation actions compliance improvement ${count} systems`;
        const context = await getRegulationContextString(query, regulationType, 2);
        
        if (context && context !== 'No relevant context found.') {
          guidance[status] = context;
        }
      } catch (error) {
        console.error(`Error getting guidance for ${status}:`, error);
      }
    }
  }
  
  return guidance;
}

/**
 * Extract insights from RAG context
 */
function extractInsightsFromContext(context: string, regulationType: RegulationType, systemsData: any[]): ComplianceInsight[] {
  const insights: ComplianceInsight[] = [];
  const lines = context.split('\n').filter(line => line.trim());

  // Get specific system names for non-compliant systems
  const nonCompliantSystems = systemsData
    .filter(system => normalizeComplianceStatus(system.compliance_status) === 'non_compliant')
    .map(system => system.system_name || system.name || `ID: ${system.id?.substring(0, 8)}`)
    .slice(0, 3);

  const prohibitedSystems = systemsData
    .filter(system => normalizeRiskTier(system.risk_tier || system.risk_level) === 'prohibited')
    .map(system => system.system_name || system.name || `ID: ${system.id?.substring(0, 8)}`)
    .slice(0, 3);

  const highRiskSystems = systemsData
    .filter(system => normalizeRiskTier(system.risk_tier || system.risk_level) === 'high_risk')
    .map(system => system.system_name || system.name || `ID: ${system.id?.substring(0, 8)}`)
    .slice(0, 3);

  // Look for obligation patterns
  lines.forEach(line => {
    const trimmed = line.trim();

    if (trimmed.toLowerCase().includes('must') || trimmed.toLowerCase().includes('shall')) {
      insights.push({
        type: 'obligation',
        title: 'Regulatory Obligation',
        description: trimmed,
        priority: 'high',
        actionable: true,
        regulatoryContext: `${regulationType} Regulation`
      });
    } else if (trimmed.toLowerCase().includes('should') || trimmed.toLowerCase().includes('recommend')) {
      insights.push({
        type: 'recommendation',
        title: 'Recommended Action',
        description: trimmed,
        priority: 'medium',
        actionable: true,
        regulatoryContext: `${regulationType} Regulation`
      });
    } else if (trimmed.toLowerCase().includes('risk') || trimmed.toLowerCase().includes('warning')) {
      insights.push({
        type: 'warning',
        title: 'Compliance Risk',
        description: trimmed,
        priority: 'high',
        actionable: false,
        regulatoryContext: `${regulationType} Regulation`
      });
    }
  });

  // Add specific system-based insights if we have non-compliant systems
  if (nonCompliantSystems.length > 0 && insights.length < 4) {
    const systemList = nonCompliantSystems.join(', ');
    const additionalCount = systemsData.filter(system =>
      normalizeComplianceStatus(system.compliance_status) === 'non_compliant'
    ).length - nonCompliantSystems.length;

    insights.push({
      type: 'recommendation',
      title: 'Non-Compliant Systems Identified',
      description: `The following systems require compliance remediation: ${systemList}${additionalCount > 0 ? ` and ${additionalCount} more` : ''}.`,
      priority: 'medium',
      actionable: true,
      regulatoryContext: `${regulationType} Regulation`
    });
  }

  // Add prohibited systems insight if we have them
  if (prohibitedSystems.length > 0 && insights.length < 4) {
    const systemList = prohibitedSystems.join(', ');
    const additionalCount = systemsData.filter(system =>
      normalizeRiskTier(system.risk_tier || system.risk_level) === 'prohibited'
    ).length - prohibitedSystems.length;

    insights.push({
      type: 'warning',
      title: 'Prohibited AI Systems',
      description: `Immediate action required for prohibited systems: ${systemList}${additionalCount > 0 ? ` and ${additionalCount} more` : ''}.`,
      priority: 'high',
      actionable: true,
      regulatoryContext: `${regulationType} Regulation`
    });
  }

  // Add high-risk systems insight if we have them
  if (highRiskSystems.length > 0 && insights.length < 4) {
    const systemList = highRiskSystems.join(', ');
    const additionalCount = systemsData.filter(system =>
      normalizeRiskTier(system.risk_tier || system.risk_level) === 'high_risk'
    ).length - highRiskSystems.length;

    insights.push({
      type: 'obligation',
      title: 'High-Risk Systems Requiring Attention',
      description: `Comprehensive compliance measures needed for: ${systemList}${additionalCount > 0 ? ` and ${additionalCount} more` : ''}.`,
      priority: 'high',
      actionable: true,
      regulatoryContext: `${regulationType} Regulation`
    });
  }

  return insights.slice(0, 5); // Limit to top 5 insights
}

/**
 * Extract next steps from RAG context
 */
function extractNextStepsFromContext(context: string): string[] {
  const steps: string[] = [];
  const lines = context.split('\n').filter(line => line.trim());
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.toLowerCase().includes('next') || 
        trimmed.toLowerCase().includes('action') ||
        trimmed.toLowerCase().includes('step')) {
      steps.push(trimmed);
    }
  });
  
  return steps.slice(0, 3); // Limit to top 3 steps
}

/**
 * Extract actions from context for specific system
 */
function extractActionsFromContext(context: string, systemData: any): string[] {
  const actions: string[] = [];
  const lines = context.split('\n').filter(line => line.trim());
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.toLowerCase().includes('implement') || 
        trimmed.toLowerCase().includes('complete') ||
        trimmed.toLowerCase().includes('conduct') ||
        trimmed.toLowerCase().includes('ensure')) {
      actions.push(trimmed);
    }
  });
  
  return actions.slice(0, 3);
}

/**
 * Normalize risk tier values
 */
function normalizeRiskTier(riskTier: string | undefined): RiskTier {
  if (!riskTier) return 'unknown';
  
  const normalized = riskTier.toLowerCase().replace(/[^a-z]/g, '');
  
  if (normalized.includes('prohibited')) return 'prohibited';
  if (normalized.includes('high')) return 'high_risk';
  if (normalized.includes('limited')) return 'limited_risk';
  if (normalized.includes('minimal')) return 'minimal_risk';
  
  return 'unknown';
}

/**
 * Normalize compliance status values
 */
function normalizeComplianceStatus(status: string | undefined): ComplianceStatus {
  if (!status) return 'unknown';
  
  const normalized = status.toLowerCase().replace(/[^a-z]/g, '');
  
  if (normalized.includes('compliant') && !normalized.includes('non') && !normalized.includes('partial')) {
    return 'compliant';
  }
  if (normalized.includes('partial')) return 'partially_compliant';
  if (normalized.includes('non')) return 'non_compliant';
  
  return 'unknown';
}

/**
 * Generate fallback insights when RAG is unavailable
 */
function generateFallbackInsights(
  riskTierCounts: Record<string, number>,
  complianceStatusCounts: Record<string, number>,
  systemsData: any[]
): ComplianceInsight[] {
  const insights: ComplianceInsight[] = [];

  if (riskTierCounts.prohibited > 0) {
    const prohibitedSystems = systemsData
      .filter(system => normalizeRiskTier(system.risk_tier || system.risk_level) === 'prohibited')
      .map(system => system.system_name || system.name || `ID: ${system.id?.substring(0, 8)}`)
      .slice(0, 3); // Limit to first 3 for readability

    const systemList = prohibitedSystems.join(', ');
    const additionalCount = riskTierCounts.prohibited - prohibitedSystems.length;

    insights.push({
      type: 'warning',
      title: 'Prohibited AI Systems Detected',
      description: `Systems classified as prohibited: ${systemList}${additionalCount > 0 ? ` and ${additionalCount} more` : ''}. Immediate action required.`,
      priority: 'high',
      actionable: true
    });
  }

  if (riskTierCounts.high_risk > 0) {
    const highRiskSystems = systemsData
      .filter(system => normalizeRiskTier(system.risk_tier || system.risk_level) === 'high_risk')
      .map(system => system.system_name || system.name || `ID: ${system.id?.substring(0, 8)}`)
      .slice(0, 3);

    const systemList = highRiskSystems.join(', ');
    const additionalCount = riskTierCounts.high_risk - highRiskSystems.length;

    insights.push({
      type: 'obligation',
      title: 'High-Risk System Obligations',
      description: `High-risk systems requiring attention: ${systemList}${additionalCount > 0 ? ` and ${additionalCount} more` : ''}. Comprehensive compliance measures required.`,
      priority: 'high',
      actionable: true
    });
  }

  if (complianceStatusCounts.non_compliant > 0) {
    const nonCompliantSystems = systemsData
      .filter(system => normalizeComplianceStatus(system.compliance_status) === 'non_compliant')
      .map(system => system.system_name || system.name || `ID: ${system.id?.substring(0, 8)}`)
      .slice(0, 3);

    const systemList = nonCompliantSystems.join(', ');
    const additionalCount = complianceStatusCounts.non_compliant - nonCompliantSystems.length;

    insights.push({
      type: 'recommendation',
      title: 'Non-Compliant Systems',
      description: `Systems requiring remediation: ${systemList}${additionalCount > 0 ? ` and ${additionalCount} more` : ''}. Compliance remediation needed.`,
      priority: 'medium',
      actionable: true
    });
  }

  return insights;
}

/**
 * Generate fallback next steps
 */
function generateFallbackNextSteps(systemsData: any[]): string[] {
  const steps: string[] = [];
  
  const criticalSystems = identifyCriticalSystems(systemsData);
  if (criticalSystems.length > 0) {
    steps.push('Review and address critical system compliance issues');
  }
  
  const incompleteSystems = systemsData.filter(s => !s.high_risk_all_fulfilled);
  if (incompleteSystems.length > 0) {
    steps.push('Complete missing high-risk obligations for affected systems');
  }
  
  steps.push('Conduct regular compliance monitoring and updates');
  
  return steps;
}

/**
 * Generate fallback system insights
 */
function generateFallbackSystemInsights(systemData: any): ComplianceInsight[] {
  const insights: ComplianceInsight[] = [];
  
  if (systemData.prohibited_practices_detected) {
    insights.push({
      type: 'warning',
      title: 'Prohibited Practices Detected',
      description: 'This system has been flagged for prohibited AI practices.',
      priority: 'high',
      actionable: true
    });
  }
  
  if (!systemData.high_risk_all_fulfilled) {
    insights.push({
      type: 'obligation',
      title: 'Missing High-Risk Obligations',
      description: 'Some high-risk obligations are not yet fulfilled.',
      priority: 'high',
      actionable: true
    });
  }
  
  return insights;
}

/**
 * Generate fallback actions for system
 */
function generateFallbackActions(systemData: any): string[] {
  const actions: string[] = [];
  
  if (systemData.prohibited_practices_detected) {
    actions.push('Immediately cease prohibited AI practices');
  }
  
  if (!systemData.high_risk_all_fulfilled && systemData.high_risk_missing) {
    actions.push(`Complete missing obligations: ${systemData.high_risk_missing.join(', ')}`);
  }
  
  if (systemData.transparency_required && systemData.transparency_missing) {
    actions.push(`Implement transparency measures: ${systemData.transparency_missing.join(', ')}`);
  }
  
  return actions;
}
