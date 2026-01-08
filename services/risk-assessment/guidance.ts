/**
 * Risk Assessment Guidance Service
 * 
 * Provides RAG-powered contextual help and guidance for risk assessment forms.
 * Combines Platform RAG (for process guidance) and Regulation RAG (for compliance context).
 */

import { getPlatformContextString } from '../ai/platform-rag-service';
import { getRegulationContextString, type RegulationType } from '../ai/rag-service';

export type RiskCategory = 'bias' | 'robustness' | 'privacy' | 'explainability';
export type RiskLevel = 'low' | 'medium' | 'high';

/**
 * Risk category information with descriptions
 */
export const RISK_CATEGORIES = {
  bias: {
    title: 'Bias & Fairness',
    description: 'Assesses potential discrimination, unfair treatment, or biased outcomes across different groups or individuals.',
    examples: ['Demographic parity', 'Equal opportunity', 'Calibration', 'Individual fairness']
  },
  robustness: {
    title: 'Robustness & Performance',
    description: 'Evaluates system reliability, accuracy, and resilience to adversarial inputs or edge cases.',
    examples: ['Adversarial robustness', 'Performance consistency', 'Error handling', 'Edge case behavior']
  },
  privacy: {
    title: 'Privacy & Data Leakage',
    description: 'Identifies risks related to personal data protection, information leakage, and privacy violations.',
    examples: ['Data minimization', 'Anonymization effectiveness', 'Inference attacks', 'Re-identification risks']
  },
  explainability: {
    title: 'Explainability',
    description: 'Assesses the system\'s ability to provide understandable explanations for its decisions and outputs.',
    examples: ['Feature importance', 'Decision transparency', 'Counterfactual explanations', 'Model interpretability']
  }
} as const;

/**
 * Risk level guidance
 */
export const RISK_LEVEL_GUIDANCE = {
  low: {
    description: 'Minimal risk with limited potential for harm. Standard monitoring sufficient.',
    requirements: 'Basic documentation and periodic review.',
    examples: 'Minor performance variations, low-stakes decisions'
  },
  medium: {
    description: 'Moderate risk requiring active management and mitigation measures.',
    requirements: 'Detailed mitigation plan, regular monitoring, evidence documentation.',
    examples: 'Moderate bias detected, performance degradation in some scenarios'
  },
  high: {
    description: 'Significant risk requiring immediate attention and comprehensive mitigation.',
    requirements: 'Comprehensive mitigation strategy, continuous monitoring, evidence links mandatory, stakeholder approval.',
    examples: 'Severe bias, safety-critical failures, privacy breaches'
  }
} as const;

/**
 * Guidance context for risk assessments
 */
export interface RiskAssessmentGuidance {
  categoryGuidance: string;
  regulatoryContext: string;
  platformGuidance: string;
  riskLevelGuidance: string;
  bestPractices: string[];
  commonPitfalls: string[];
}

/**
 * Get comprehensive guidance for a risk assessment
 * 
 * @param category - Risk category (bias, robustness, privacy, explainability)
 * @param riskLevel - Risk level (low, medium, high) - optional
 * @param regulationType - Regulation type for context (EU, UK, MAS) - optional
 * @param systemContext - Additional system context - optional
 * @returns Comprehensive guidance combining Platform RAG and Regulation RAG
 */
export async function getRiskAssessmentGuidance(
  category: RiskCategory,
  riskLevel?: RiskLevel,
  regulationType?: RegulationType,
  systemContext?: string
): Promise<RiskAssessmentGuidance> {
  
  const categoryInfo = RISK_CATEGORIES[category];
  const riskLevelInfo = riskLevel ? RISK_LEVEL_GUIDANCE[riskLevel] : null;
  
  // Build queries for RAG
  const platformQuery = `risk assessment ${category} guidance best practices process steps ${riskLevel || ''}`;
  const regulationQuery = regulationType 
    ? `${category} risk assessment requirements obligations ${riskLevel || ''} ${systemContext || ''}`
    : '';

  let platformGuidance = '';
  let regulatoryContext = '';

  try {
    // Get Platform RAG guidance (process and best practices)
    console.log(`[Risk Guidance] Querying Platform RAG for ${category} guidance`);
    const platformContext = await getPlatformContextString(
      platformQuery,
      5,
      'risk-assessment' // Filter for risk assessment content if available
    );

    if (platformContext && 
        platformContext !== 'No relevant platform knowledge found.' && 
        platformContext !== 'No query provided.') {
      platformGuidance = platformContext;
    }

    // Get Regulation RAG context (compliance requirements)
    if (regulationType && regulationQuery) {
      console.log(`[Risk Guidance] Querying ${regulationType} Regulation RAG for ${category} requirements`);
      const regulationContext = await getRegulationContextString(regulationQuery, regulationType, 3);

      if (regulationContext && 
          regulationContext !== 'No relevant context found.' && 
          regulationContext !== 'No query provided.') {
        regulatoryContext = regulationContext;
      }
    }

  } catch (error) {
    console.error('[Risk Guidance] Error retrieving RAG context:', error);
    // Continue with static guidance if RAG fails
  }

  // Build comprehensive guidance
  const categoryGuidance = `**${categoryInfo.title}**

${categoryInfo.description}

**Key Areas to Assess:**
${categoryInfo.examples.map(example => `• ${example}`).join('\n')}`;

  const riskLevelGuidance = riskLevelInfo ? `**${riskLevel?.toUpperCase()} Risk Level**

${riskLevelInfo.description}

**Requirements:** ${riskLevelInfo.requirements}

**Examples:** ${riskLevelInfo.examples}` : '';

  // Extract best practices and pitfalls from platform guidance
  const bestPractices = extractBestPractices(platformGuidance, category);
  const commonPitfalls = extractCommonPitfalls(platformGuidance, category);

  return {
    categoryGuidance,
    regulatoryContext: regulatoryContext || 'No specific regulatory requirements found for this assessment.',
    platformGuidance: platformGuidance || 'No specific platform guidance available.',
    riskLevelGuidance,
    bestPractices,
    commonPitfalls
  };
}

/**
 * Get quick help text for a specific field
 * 
 * @param field - Field name (summary, risk_level, evidence_links, etc.)
 * @param category - Risk category
 * @param riskLevel - Current risk level
 * @returns Quick help text
 */
export async function getFieldGuidance(
  field: string,
  category: RiskCategory,
  riskLevel?: RiskLevel
): Promise<string> {
  
  const baseGuidance = getStaticFieldGuidance(field, category, riskLevel);
  
  try {
    // Get targeted platform guidance for the specific field
    const query = `risk assessment ${field} ${category} guidance examples`;
    const platformContext = await getPlatformContextString(query, 2);
    
    if (platformContext && 
        platformContext !== 'No relevant platform knowledge found.' && 
        platformContext !== 'No query provided.') {
      return `${baseGuidance}\n\n**Additional Guidance:**\n${platformContext}`;
    }
  } catch (error) {
    console.error('[Field Guidance] Error retrieving platform context:', error);
  }

  return baseGuidance;
}

/**
 * Static field guidance as fallback
 */
function getStaticFieldGuidance(field: string, category: RiskCategory, riskLevel?: RiskLevel): string {
  const categoryInfo = RISK_CATEGORIES[category];
  
  switch (field) {
    case 'summary':
      return `Provide a clear, concise summary of the ${categoryInfo.title.toLowerCase()} assessment. Include key findings, metrics, and potential impacts. Be specific about what was tested and what risks were identified.`;
    
    case 'risk_level':
      return `Select the appropriate risk level based on the severity and likelihood of potential harm. Consider the impact on users, system performance, and regulatory compliance.`;
    
    case 'evidence_links':
      const evidenceGuidance = `Provide links to supporting evidence such as test results, analysis reports, or documentation.`;
      if (riskLevel === 'high') {
        return `${evidenceGuidance} **Required for high-risk assessments** - at least one evidence link must be provided.`;
      }
      return `${evidenceGuidance} Evidence links help validate your assessment and support decision-making.`;
    
    case 'metrics':
      return `Include relevant quantitative metrics for ${categoryInfo.title.toLowerCase()}. Examples: ${categoryInfo.examples.join(', ')}. Use JSON format for structured data.`;
    
    default:
      return `Provide accurate information for ${field} related to ${categoryInfo.title.toLowerCase()} assessment.`;
  }
}

/**
 * Extract best practices from platform guidance text
 */
function extractBestPractices(text: string, category: RiskCategory): string[] {
  if (!text) return getDefaultBestPractices(category);
  
  // Look for best practices patterns in the text
  const practices: string[] = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.toLowerCase().includes('best practice') || 
        trimmed.toLowerCase().includes('recommended') ||
        trimmed.toLowerCase().includes('should') ||
        trimmed.startsWith('•') || 
        trimmed.startsWith('-')) {
      practices.push(trimmed.replace(/^[•\-]\s*/, ''));
    }
  }
  
  return practices.length > 0 ? practices.slice(0, 5) : getDefaultBestPractices(category);
}

/**
 * Extract common pitfalls from platform guidance text
 */
function extractCommonPitfalls(text: string, category: RiskCategory): string[] {
  if (!text) return getDefaultCommonPitfalls(category);
  
  // Look for pitfall patterns in the text
  const pitfalls: string[] = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.toLowerCase().includes('avoid') || 
        trimmed.toLowerCase().includes('pitfall') ||
        trimmed.toLowerCase().includes('mistake') ||
        trimmed.toLowerCase().includes('don\'t')) {
      pitfalls.push(trimmed);
    }
  }
  
  return pitfalls.length > 0 ? pitfalls.slice(0, 3) : getDefaultCommonPitfalls(category);
}

/**
 * Default best practices by category
 */
function getDefaultBestPractices(category: RiskCategory): string[] {
  switch (category) {
    case 'bias':
      return [
        'Test across multiple demographic groups',
        'Use multiple fairness metrics',
        'Document data collection and preprocessing steps',
        'Involve diverse stakeholders in evaluation',
        'Consider intersectional bias'
      ];
    case 'robustness':
      return [
        'Test with adversarial examples',
        'Evaluate performance on edge cases',
        'Monitor model degradation over time',
        'Implement input validation',
        'Test system boundaries and failure modes'
      ];
    case 'privacy':
      return [
        'Implement data minimization principles',
        'Use privacy-preserving techniques',
        'Conduct privacy impact assessments',
        'Document data flows and retention',
        'Test for information leakage'
      ];
    case 'explainability':
      return [
        'Provide multiple explanation types',
        'Test explanation quality with users',
        'Document model decision logic',
        'Ensure explanations are actionable',
        'Validate explanation accuracy'
      ];
  }
}

/**
 * Default common pitfalls by category
 */
function getDefaultCommonPitfalls(category: RiskCategory): string[] {
  switch (category) {
    case 'bias':
      return [
        'Testing only on majority groups',
        'Using biased training data without mitigation',
        'Ignoring intersectional bias effects'
      ];
    case 'robustness':
      return [
        'Testing only on clean, ideal inputs',
        'Ignoring edge cases and boundary conditions',
        'Not monitoring performance degradation'
      ];
    case 'privacy':
      return [
        'Collecting unnecessary personal data',
        'Not implementing proper anonymization',
        'Ignoring inference attack risks'
      ];
    case 'explainability':
      return [
        'Providing only technical explanations',
        'Not validating explanation accuracy',
        'Ignoring user explanation needs'
      ];
  }
}
