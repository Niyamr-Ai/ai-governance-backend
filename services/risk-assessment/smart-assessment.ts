import { getPlatformContextString } from "../ai/platform-rag-service";
import { getUserSystemContextString } from "../ai/user-system-rag-service";
import { getRegulationContextString, type RegulationType as RAGRegulationType } from "../ai/rag-service";
import type { 
  AutomatedRiskAssessment, 
  RiskLevel, 
  DimensionDetails,
  RiskDimensionScores,
  ComplianceChecklistItem 
} from "../../types/automated-risk-assessment";

export interface ContextualRiskAssessment extends Omit<AutomatedRiskAssessment, 'id' | 'assessed_at' | 'created_at' | 'updated_at'> {
  context_sources: {
    regulation_context_quality: 'high' | 'medium' | 'low';
    platform_context_quality: 'high' | 'medium' | 'low';
    system_context_quality: 'high' | 'medium' | 'low';
  };
  risk_factor_analysis: {
    regulation_specific_risks: string[];
    industry_best_practice_gaps: string[];
    system_specific_vulnerabilities: string[];
  };
  enhanced_recommendations: {
    priority: 'immediate' | 'high' | 'medium' | 'low';
    category: 'technical' | 'operational' | 'legal_regulatory' | 'ethical_societal' | 'business';
    action: string;
    rationale: string;
    regulatory_basis: string;
    estimated_effort: 'low' | 'medium' | 'high';
    success_metrics: string[];
  }[];
}

export interface RiskMitigationSuggestion {
  risk_factor: string;
  risk_category: 'technical' | 'operational' | 'legal_regulatory' | 'ethical_societal' | 'business';
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigation_strategies: {
    strategy: string;
    implementation_approach: string;
    regulatory_alignment: string;
    effort_estimate: 'low' | 'medium' | 'high';
    timeline: string;
    success_indicators: string[];
  }[];
  regulatory_requirements: string[];
  industry_best_practices: string[];
}

export interface RiskTrendAnalysis {
  system_id: string;
  historical_assessments: {
    assessment_date: string;
    overall_risk_level: RiskLevel;
    composite_score: number;
    key_changes: string[];
  }[];
  trend_direction: 'improving' | 'stable' | 'deteriorating';
  trend_confidence: number; // 0-100
  risk_drivers: {
    factor: string;
    impact: 'positive' | 'negative';
    magnitude: 'low' | 'medium' | 'high';
    trend: 'increasing' | 'stable' | 'decreasing';
  }[];
  predictions: {
    next_review_risk_level: RiskLevel;
    confidence: number;
    key_factors: string[];
  };
  recommendations: {
    priority: 'immediate' | 'high' | 'medium' | 'low';
    action: string;
    rationale: string;
  }[];
}

// Helper function to map regulation types
function mapRegulationTypeToRAG(regulationType?: string): RAGRegulationType {
  switch (regulationType?.toUpperCase()) {
    case 'UK': return 'UK';
    case 'MAS': return 'MAS';
    case 'EU':
    default: return 'EU';
  }
}

// Helper function to build system risk query
function buildSystemRiskQuery(systemData: any): string {
  return `AI system risk assessment ${systemData.name} ${systemData.description || ''} ${systemData.risk_tier || ''} risk factors vulnerabilities security compliance ${systemData.lifecycle_stage || ''}`;
}

// Helper function to build regulation risk query
function buildRegulationRiskQuery(systemData: any, regulationType: RAGRegulationType): string {
  return `${regulationType} regulation AI system risk assessment requirements ${systemData.risk_tier || ''} ${systemData.lifecycle_stage || ''} compliance obligations risk factors`;
}

// Helper function to build platform risk query
function buildPlatformRiskQuery(systemData: any): string {
  return `AI system risk assessment methodologies best practices ${systemData.risk_tier || ''} risk management frameworks security assessment compliance evaluation`;
}

/**
 * Generate contextual risk assessment using all three RAG sources
 */
export async function generateContextualRiskAssessment(
  systemData: {
    id: string;
    name: string;
    description?: string;
    risk_tier?: string;
    lifecycle_stage?: string;
    regulation_type?: string;
    compliance_status?: string;
    [key: string]: any;
  },
  userId: string,
  organizationHistory?: {
    previous_assessments: Array<{
      date: string;
      risk_level: RiskLevel;
      key_findings: string[];
    }>;
    industry_benchmarks?: {
      average_risk_score: number;
      common_risk_factors: string[];
    };
  }
): Promise<ContextualRiskAssessment> {
  console.log(`[Smart Risk Assessment] Generating contextual assessment for system ${systemData.id}`);
  
  if (!userId) {
    console.warn("[Smart Risk Assessment] User ID missing. Cannot generate personalized assessment.");
    throw new Error("User authentication required for risk assessment");
  }

  let systemContext = '';
  let platformContext = '';
  let regulationContext = '';
  let contextQuality: { regulation: 'high' | 'medium' | 'low', platform: 'high' | 'medium' | 'low', system: 'high' | 'medium' | 'low' } = { regulation: 'low', platform: 'low', system: 'low' };

  const regulationType = mapRegulationTypeToRAG(systemData.regulation_type);

  // Fetch system-specific context using User System RAG
  try {
    const systemQuery = buildSystemRiskQuery(systemData);
    systemContext = await getUserSystemContextString(
      systemQuery,
      userId, // TEMPORARY: using userId as orgId during transition
      7,
      systemData.id,
      'risk_assessment'
    );
    if (systemContext === "No relevant system data found.") {
      systemContext = '';
      contextQuality.system = 'low';
    } else {
      contextQuality.system = systemContext.length > 500 ? 'high' : systemContext.length > 200 ? 'medium' : 'low';
    }
  } catch (error) {
    console.error(`[Smart Risk Assessment] Error fetching system context:`, error);
    systemContext = '';
    contextQuality.system = 'low';
  }

  // Fetch platform best practices using Platform RAG
  try {
    const platformQuery = buildPlatformRiskQuery(systemData);
    platformContext = await getPlatformContextString(
      platformQuery,
      7,
      'risk_assessment'
    );
    if (platformContext === "No relevant platform knowledge found.") {
      platformContext = '';
      contextQuality.platform = 'low';
    } else {
      contextQuality.platform = platformContext.length > 500 ? 'high' : platformContext.length > 200 ? 'medium' : 'low';
    }
  } catch (error) {
    console.error(`[Smart Risk Assessment] Error fetching platform context:`, error);
    platformContext = '';
    contextQuality.platform = 'low';
  }

  // Fetch regulatory requirements using Regulation RAG
  try {
    const regulationQuery = buildRegulationRiskQuery(systemData, regulationType);
    regulationContext = await getRegulationContextString(
      regulationQuery,
      regulationType,
      7
    );
    if (regulationContext === "No relevant context found.") {
      regulationContext = '';
      contextQuality.regulation = 'low';
    } else {
      contextQuality.regulation = regulationContext.length > 500 ? 'high' : regulationContext.length > 200 ? 'medium' : 'low';
    }
  } catch (error) {
    console.error(`[Smart Risk Assessment] Error fetching regulation context:`, error);
    regulationContext = '';
    contextQuality.regulation = 'low';
  }

  // Build comprehensive context for AI analysis
  const aiContext = `
## AI System Information
- ID: ${systemData.id}
- Name: ${systemData.name}
- Description: ${systemData.description || 'Not provided'}
- Risk Tier: ${systemData.risk_tier || 'Unknown'}
- Lifecycle Stage: ${systemData.lifecycle_stage || 'Unknown'}
- Regulation Type: ${systemData.regulation_type || 'EU'}
- Compliance Status: ${systemData.compliance_status || 'Unknown'}

## Organization History
${organizationHistory ? `
- Previous Assessments: ${organizationHistory.previous_assessments.length} assessments
- Industry Benchmarks: Average risk score ${organizationHistory.industry_benchmarks?.average_risk_score || 'N/A'}
- Common Risk Factors: ${organizationHistory.industry_benchmarks?.common_risk_factors?.join(', ') || 'N/A'}
` : 'No organization history available'}

## System-Specific Context (User System RAG)
${systemContext || 'No system-specific context available.'}

## Platform Best Practices (Platform RAG)
${platformContext || 'No platform best practices available.'}

## Regulatory Requirements (Regulation RAG)
${regulationContext || 'No regulatory context available.'}
`;

  try {
    // Use OpenAI to generate comprehensive contextual risk assessment
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert AI risk assessment consultant specializing in comprehensive, regulation-aware risk analysis. Generate a detailed risk assessment using the provided context from regulatory knowledge, platform best practices, and system-specific information.

CRITICAL REQUIREMENTS:
- Assess all 5 risk dimensions: Technical, Operational, Legal/Regulatory, Ethical/Societal, Business
- Score each dimension 1-10 based on available context and regulatory requirements
- Calculate weighted composite score and determine overall risk level
- Identify specific risk factors from regulatory, platform, and system contexts
- Provide actionable recommendations with regulatory basis
- Include compliance checklist items based on regulatory requirements
- Consider organization history and industry benchmarks if available

RESPONSE FORMAT: Return a valid JSON object with this exact structure:
{
  "technical_risk_score": 1-10,
  "operational_risk_score": 1-10,
  "legal_regulatory_risk_score": 1-10,
  "ethical_societal_risk_score": 1-10,
  "business_risk_score": 1-10,
  "composite_score": 1.0-10.0,
  "overall_risk_level": "Critical|High|Medium|Low",
  "dimension_details": {
    "technical": {
      "score": 1-10,
      "key_risks": ["risk1", "risk2"],
      "compliance_gaps": ["gap1", "gap2"],
      "recommendations": ["rec1", "rec2"]
    },
    "operational": { /* same structure */ },
    "legal_regulatory": { /* same structure */ },
    "ethical_societal": { /* same structure */ },
    "business": { /* same structure */ }
  },
  "executive_summary": "comprehensive summary",
  "detailed_findings": "detailed analysis",
  "compliance_checklist": [
    {
      "item": "checklist item",
      "status": "compliant|non_compliant|partial|not_assessed",
      "priority": "high|medium|low",
      "regulatory_basis": "regulation reference"
    }
  ],
  "remediation_plan": "detailed remediation plan",
  "risk_factor_analysis": {
    "regulation_specific_risks": ["risk1", "risk2"],
    "industry_best_practice_gaps": ["gap1", "gap2"],
    "system_specific_vulnerabilities": ["vuln1", "vuln2"]
  },
  "enhanced_recommendations": [
    {
      "priority": "immediate|high|medium|low",
      "category": "technical|operational|legal_regulatory|ethical_societal|business",
      "action": "specific action",
      "rationale": "why needed",
      "regulatory_basis": "regulation reference",
      "estimated_effort": "low|medium|high",
      "success_metrics": ["metric1", "metric2"]
    }
  ]
}`
          },
          {
            role: 'user',
            content: aiContext
          }
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // Parse the JSON response
    let assessment: any;
    try {
      assessment = JSON.parse(content);
    } catch (parseError) {
      console.error('[Smart Risk Assessment] Failed to parse AI response as JSON:', parseError);
      console.error('[Smart Risk Assessment] Raw response:', content);
      throw new Error('Failed to parse AI assessment response');
    }

    // Validate and return contextual assessment
    const contextualAssessment: ContextualRiskAssessment = {
      ai_system_id: systemData.id,
      technical_risk_score: Math.min(10, Math.max(1, assessment.technical_risk_score || 5)),
      operational_risk_score: Math.min(10, Math.max(1, assessment.operational_risk_score || 5)),
      legal_regulatory_risk_score: Math.min(10, Math.max(1, assessment.legal_regulatory_risk_score || 5)),
      ethical_societal_risk_score: Math.min(10, Math.max(1, assessment.ethical_societal_risk_score || 5)),
      business_risk_score: Math.min(10, Math.max(1, assessment.business_risk_score || 5)),
      composite_score: Math.min(10, Math.max(1, assessment.composite_score || 5)),
      overall_risk_level: assessment.overall_risk_level || 'Medium',
      weights: {
        technical: 0.2,
        operational: 0.2,
        legal_regulatory: 0.2,
        ethical_societal: 0.2,
        business: 0.2
      },
      dimension_details: assessment.dimension_details || {},
      executive_summary: assessment.executive_summary || 'Risk assessment completed using AI analysis.',
      detailed_findings: assessment.detailed_findings || 'Detailed findings not available.',
      compliance_checklist: Array.isArray(assessment.compliance_checklist) ? assessment.compliance_checklist : [],
      remediation_plan: assessment.remediation_plan || 'Remediation plan not available.',
      re_assessment_timeline: '90 days',
      assessed_by: userId,
      trigger_type: 'manual',
      data_sources: {
        compliance_assessments: [],
        risk_assessments: [],
        system_metadata: true,
        questionnaire_responses: false
      },
      context_sources: {
        regulation_context_quality: contextQuality.regulation,
        platform_context_quality: contextQuality.platform,
        system_context_quality: contextQuality.system
      },
      risk_factor_analysis: {
        regulation_specific_risks: Array.isArray(assessment.risk_factor_analysis?.regulation_specific_risks) ? 
          assessment.risk_factor_analysis.regulation_specific_risks : [],
        industry_best_practice_gaps: Array.isArray(assessment.risk_factor_analysis?.industry_best_practice_gaps) ? 
          assessment.risk_factor_analysis.industry_best_practice_gaps : [],
        system_specific_vulnerabilities: Array.isArray(assessment.risk_factor_analysis?.system_specific_vulnerabilities) ? 
          assessment.risk_factor_analysis.system_specific_vulnerabilities : []
      },
      enhanced_recommendations: Array.isArray(assessment.enhanced_recommendations) ? 
        assessment.enhanced_recommendations : []
    };

    console.log(`[Smart Risk Assessment] Generated contextual assessment for system ${systemData.id} with overall risk level: ${contextualAssessment.overall_risk_level}`);
    return contextualAssessment;

  } catch (error) {
    console.error('[Smart Risk Assessment] Error generating contextual assessment:', error);
    throw error;
  }
}

/**
 * Suggest intelligent risk mitigation strategies using RAG context
 */
export async function suggestRiskMitigations(
  riskFactors: Array<{
    factor: string;
    category: 'technical' | 'operational' | 'legal_regulatory' | 'ethical_societal' | 'business';
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>,
  systemContext: {
    id: string;
    name: string;
    risk_level: string;
    regulation_type: string;
  },
  userId: string
): Promise<RiskMitigationSuggestion[]> {
  console.log(`[Smart Risk Assessment] Generating mitigation suggestions for ${riskFactors.length} risk factors`);
  
  if (!userId || riskFactors.length === 0) {
    return [];
  }

  const suggestions: RiskMitigationSuggestion[] = [];
  const regulationType = mapRegulationTypeToRAG(systemContext.regulation_type);

  for (const riskFactor of riskFactors) {
    try {
      let platformContext = '';
      let regulationContext = '';

      // Get platform best practices for this risk category
      try {
        const platformQuery = `risk mitigation strategies ${riskFactor.category} ${riskFactor.factor} ${systemContext.risk_level} AI systems best practices`;
        platformContext = await getPlatformContextString(platformQuery, 5, 'risk_assessment');
        if (platformContext === "No relevant platform knowledge found.") platformContext = '';
      } catch (error) {
        console.error(`[Smart Risk Assessment] Error fetching platform mitigation context:`, error);
        platformContext = '';
      }

      // Get regulatory requirements for this risk
      try {
        const regulationQuery = `${regulationType} regulation risk mitigation ${riskFactor.factor} ${riskFactor.category} compliance requirements`;
        regulationContext = await getRegulationContextString(regulationQuery, regulationType, 5);
        if (regulationContext === "No relevant context found.") regulationContext = '';
      } catch (error) {
        console.error(`[Smart Risk Assessment] Error fetching regulation mitigation context:`, error);
        regulationContext = '';
      }

      // Generate mitigation strategies using AI
      const mitigationContext = `
## Risk Factor
- Factor: ${riskFactor.factor}
- Category: ${riskFactor.category}
- Severity: ${riskFactor.severity}

## System Context
- System: ${systemContext.name}
- Risk Level: ${systemContext.risk_level}
- Regulation: ${systemContext.regulation_type}

## Platform Best Practices
${platformContext || 'No platform best practices available'}

## Regulatory Requirements
${regulationContext || 'No regulatory requirements available'}
`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `Generate specific mitigation strategies for the identified risk factor. Provide actionable strategies with implementation approaches and regulatory alignment.

RESPONSE FORMAT:
{
  "mitigation_strategies": [
    {
      "strategy": "specific mitigation strategy",
      "implementation_approach": "how to implement",
      "regulatory_alignment": "how it aligns with regulations",
      "effort_estimate": "low|medium|high",
      "timeline": "estimated timeline",
      "success_indicators": ["indicator1", "indicator2"]
    }
  ],
  "regulatory_requirements": ["requirement1", "requirement2"],
  "industry_best_practices": ["practice1", "practice2"]
}`
            },
            {
              role: 'user',
              content: mitigationContext
            }
          ],
          temperature: 0.3,
          max_tokens: 1000,
        }),
      });

      if (response.ok) {
        const data = await response.json() as any;
        const content = data.choices?.[0]?.message?.content;

        if (content) {
          try {
            const mitigationData = JSON.parse(content);
            
            const suggestion: RiskMitigationSuggestion = {
              risk_factor: riskFactor.factor,
              risk_category: riskFactor.category,
              severity: riskFactor.severity,
              mitigation_strategies: Array.isArray(mitigationData.mitigation_strategies) ? 
                mitigationData.mitigation_strategies : [],
              regulatory_requirements: Array.isArray(mitigationData.regulatory_requirements) ? 
                mitigationData.regulatory_requirements : [],
              industry_best_practices: Array.isArray(mitigationData.industry_best_practices) ? 
                mitigationData.industry_best_practices : []
            };

            suggestions.push(suggestion);
          } catch (parseError) {
            console.error('[Smart Risk Assessment] Failed to parse mitigation response:', parseError);
          }
        }
      }
    } catch (error) {
      console.error(`[Smart Risk Assessment] Error generating mitigation for risk factor ${riskFactor.factor}:`, error);
    }
  }

  console.log(`[Smart Risk Assessment] Generated ${suggestions.length} mitigation suggestions`);
  return suggestions;
}

/**
 * Analyze risk trends using historical data and RAG context
 */
export async function analyzeRiskTrends(
  systemId: string,
  systemHistory: Array<{
    assessment_date: string;
    overall_risk_level: RiskLevel;
    composite_score: number;
    dimension_scores: RiskDimensionScores;
    key_changes: string[];
  }>,
  industryBenchmarks?: {
    average_risk_score: number;
    trend_direction: 'improving' | 'stable' | 'deteriorating';
    common_factors: string[];
  },
  userId?: string
): Promise<RiskTrendAnalysis> {
  console.log(`[Smart Risk Assessment] Analyzing risk trends for system ${systemId} with ${systemHistory.length} historical assessments`);
  
  if (systemHistory.length < 2) {
    return {
      system_id: systemId,
      historical_assessments: systemHistory.map(h => ({
        assessment_date: h.assessment_date,
        overall_risk_level: h.overall_risk_level,
        composite_score: h.composite_score,
        key_changes: h.key_changes
      })),
      trend_direction: 'stable',
      trend_confidence: 50,
      risk_drivers: [],
      predictions: {
        next_review_risk_level: systemHistory[systemHistory.length - 1]?.overall_risk_level || 'Medium',
        confidence: 50,
        key_factors: []
      },
      recommendations: [
        {
          priority: 'medium',
          action: 'Continue regular risk assessments to establish trend patterns',
          rationale: 'Insufficient historical data for trend analysis'
        }
      ]
    };
  }

  try {
    // Get platform context for trend analysis methodologies
    let platformContext = '';
    if (userId) {
      try {
        platformContext = await getPlatformContextString(
          'risk trend analysis AI systems risk management patterns trend prediction methodologies',
          5,
          'risk_assessment'
        );
        if (platformContext === "No relevant platform knowledge found.") platformContext = '';
      } catch (error) {
        console.error('[Smart Risk Assessment] Error fetching platform trend context:', error);
        platformContext = '';
      }
    }

    // Build context for AI analysis
    const trendContext = `
## System Risk History
${systemHistory.map(h => `
- Date: ${h.assessment_date}
- Risk Level: ${h.overall_risk_level}
- Composite Score: ${h.composite_score}
- Key Changes: ${h.key_changes.join(', ')}
`).join('\n')}

## Industry Benchmarks
${industryBenchmarks ? `
- Average Risk Score: ${industryBenchmarks.average_risk_score}
- Industry Trend: ${industryBenchmarks.trend_direction}
- Common Factors: ${industryBenchmarks.common_factors.join(', ')}
` : 'No industry benchmarks available'}

## Platform Best Practices
${platformContext || 'No platform context available'}
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Analyze the risk trend for this AI system based on historical assessments and industry benchmarks. Identify patterns, drivers, and make predictions.

RESPONSE FORMAT:
{
  "trend_direction": "improving|stable|deteriorating",
  "trend_confidence": 0-100,
  "risk_drivers": [
    {
      "factor": "risk factor",
      "impact": "positive|negative",
      "magnitude": "low|medium|high",
      "trend": "increasing|stable|decreasing"
    }
  ],
  "predictions": {
    "next_review_risk_level": "Critical|High|Medium|Low",
    "confidence": 0-100,
    "key_factors": ["factor1", "factor2"]
  },
  "recommendations": [
    {
      "priority": "immediate|high|medium|low",
      "action": "specific action",
      "rationale": "why needed"
    }
  ]
}`
          },
          {
            role: 'user',
            content: trendContext
          }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    const trendAnalysis = JSON.parse(content);

    return {
      system_id: systemId,
      historical_assessments: systemHistory.map(h => ({
        assessment_date: h.assessment_date,
        overall_risk_level: h.overall_risk_level,
        composite_score: h.composite_score,
        key_changes: h.key_changes
      })),
      trend_direction: trendAnalysis.trend_direction || 'stable',
      trend_confidence: Math.min(100, Math.max(0, trendAnalysis.trend_confidence || 50)),
      risk_drivers: Array.isArray(trendAnalysis.risk_drivers) ? trendAnalysis.risk_drivers : [],
      predictions: {
        next_review_risk_level: trendAnalysis.predictions?.next_review_risk_level || 'Medium',
        confidence: Math.min(100, Math.max(0, trendAnalysis.predictions?.confidence || 50)),
        key_factors: Array.isArray(trendAnalysis.predictions?.key_factors) ? trendAnalysis.predictions.key_factors : []
      },
      recommendations: Array.isArray(trendAnalysis.recommendations) ? trendAnalysis.recommendations : []
    };

  } catch (error) {
    console.error('[Smart Risk Assessment] Error analyzing risk trends:', error);
    
    // Return basic trend analysis based on simple calculations
    const scores = systemHistory.map(h => h.composite_score);
    const latestScore = scores[scores.length - 1];
    const previousScore = scores[scores.length - 2];
    
    let trendDirection: 'improving' | 'stable' | 'deteriorating' = 'stable';
    if (latestScore < previousScore - 0.5) trendDirection = 'improving';
    else if (latestScore > previousScore + 0.5) trendDirection = 'deteriorating';

    return {
      system_id: systemId,
      historical_assessments: systemHistory.map(h => ({
        assessment_date: h.assessment_date,
        overall_risk_level: h.overall_risk_level,
        composite_score: h.composite_score,
        key_changes: h.key_changes
      })),
      trend_direction: trendDirection,
      trend_confidence: 60,
      risk_drivers: [],
      predictions: {
        next_review_risk_level: systemHistory[systemHistory.length - 1]?.overall_risk_level || 'Medium',
        confidence: 60,
        key_factors: ['Historical trend analysis']
      },
      recommendations: [
        {
          priority: 'medium',
          action: 'Continue monitoring risk trends and implement targeted improvements',
          rationale: 'Based on historical risk score patterns'
        }
      ]
    };
  }
}
