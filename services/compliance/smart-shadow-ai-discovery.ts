import { getPlatformContextString } from "../ai/platform-rag-service";
import { getUserSystemContextString } from "../ai/user-system-rag-service";
import { getRegulationContextString, type RegulationType as RAGRegulationType } from "../ai/rag-service";
import type { DiscoveredAIAsset, DetectedVendor, DiscoverySourceType } from "../../types/discovery";

export interface ShadowAIAssessment {
  asset_id: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  shadow_probability: number; // 0-100
  regulatory_concerns: string[];
  classification: {
    system_type: string;
    use_case: string;
    data_sensitivity: 'low' | 'medium' | 'high';
    user_facing: boolean;
  };
  compliance_gaps: {
    regulation: 'EU' | 'UK' | 'MAS';
    missing_requirements: string[];
    severity: 'low' | 'medium' | 'high';
  }[];
  recommended_actions: {
    priority: 'immediate' | 'high' | 'medium' | 'low';
    action: string;
    rationale: string;
  }[];
  confidence_score: number; // 0-100
}

export interface SystemLinkSuggestion {
  existing_system_id: string;
  system_name: string;
  similarity_score: number; // 0-100
  matching_factors: string[];
  confidence: 'high' | 'medium' | 'low';
  rationale: string;
}

export interface DiscoveryPrioritization {
  asset_id: string;
  priority_score: number; // 0-100
  priority_level: 'critical' | 'high' | 'medium' | 'low';
  risk_factors: string[];
  business_impact: string;
  urgency_rationale: string;
}

// Helper function to map vendor to regulation focus
function getRegulationFocus(vendor: DetectedVendor | null, environment: string | null): RAGRegulationType {
  // Default to EU for most cases, but could be enhanced with organization settings
  if (environment === 'prod') return 'EU'; // Production systems need EU compliance
  return 'EU'; // Default to EU AI Act
}

// Helper function to build system context query
function buildSystemContextQuery(asset: DiscoveredAIAsset): string {
  return `AI system discovery ${asset.detected_name} ${asset.detected_description || ''} ${asset.detected_vendor || ''} ${asset.source_type} ${asset.environment || ''} shadow AI classification risk assessment`;
}

// Helper function to build platform query for discovery patterns
function buildPlatformDiscoveryQuery(asset: DiscoveredAIAsset): string {
  return `shadow AI discovery patterns ${asset.source_type} ${asset.detected_vendor || ''} AI system classification risk assessment compliance requirements ${asset.environment || ''} environment`;
}

// Helper function to build regulation query for compliance requirements
function buildRegulationQuery(asset: DiscoveredAIAsset, regulationType: RAGRegulationType): string {
  return `AI system compliance requirements ${asset.detected_vendor || ''} ${asset.environment || ''} ${regulationType} regulation shadow AI governance unregistered systems`;
}

/**
 * Generate comprehensive Shadow AI assessment using all three RAG sources
 */
export async function generateShadowAIAssessment(
  asset: DiscoveredAIAsset,
  userId: string,
  organizationContext?: {
    existing_systems: Array<{ id: string; name: string; description: string; risk_level: string }>;
    compliance_focus: 'EU' | 'UK' | 'MAS';
  }
): Promise<ShadowAIAssessment> {
  console.log(`[Smart Shadow AI] Generating assessment for asset ${asset.id} (${asset.detected_name})`);
  
  if (!userId) {
    console.warn("[Smart Shadow AI] User ID missing. Cannot generate personalized assessment.");
    return createBasicAssessment(asset);
  }

  let systemContext = '';
  let platformContext = '';
  let regulationContext = '';

  const regulationType = getRegulationFocus(asset.detected_vendor ?? null, asset.environment ?? null);

  // Fetch system-specific context using User System RAG
  try {
    const systemQuery = buildSystemContextQuery(asset);
    systemContext = await getUserSystemContextString(
      systemQuery,
      userId, // TEMPORARY: using userId as orgId during transition
      5,
      undefined, // No specific system ID for discovery
      'discovery'
    );
    if (systemContext === "No relevant system data found.") systemContext = '';
  } catch (error) {
    console.error(`[Smart Shadow AI] Error fetching system context for user ${userId}:`, error);
    systemContext = '';
  }

  // Fetch platform best practices using Platform RAG
  try {
    const platformQuery = buildPlatformDiscoveryQuery(asset);
    platformContext = await getPlatformContextString(
      platformQuery,
      5,
      'discovery'
    );
    if (platformContext === "No relevant platform knowledge found.") platformContext = '';
  } catch (error) {
    console.error(`[Smart Shadow AI] Error fetching platform context:`, error);
    platformContext = '';
  }

  // Fetch regulatory requirements using Regulation RAG
  try {
    const regulationQuery = buildRegulationQuery(asset, regulationType);
    regulationContext = await getRegulationContextString(
      regulationQuery,
      regulationType,
      5
    );
    if (regulationContext === "No relevant context found.") regulationContext = '';
  } catch (error) {
    console.error(`[Smart Shadow AI] Error fetching regulation context:`, error);
    regulationContext = '';
  }

  // If all RAG sources fail, return basic assessment
  if (!systemContext && !platformContext && !regulationContext) {
    console.warn("[Smart Shadow AI] No context available from RAG sources. Returning basic assessment.");
    return createBasicAssessment(asset);
  }

  // Build comprehensive context for AI analysis
  const aiContext = `
## Discovered Asset Information
- Name: ${asset.detected_name}
- Description: ${asset.detected_description || 'Not provided'}
- Vendor: ${asset.detected_vendor || 'Unknown'}
- Source: ${asset.source_type}
- Environment: ${asset.environment || 'Unknown'}
- Endpoint/Repo: ${asset.detected_endpoint_or_repo || 'Not provided'}
- Confidence: ${asset.confidence_score}

## Organization Context
${organizationContext ? `
- Existing Systems: ${organizationContext.existing_systems.length} registered systems
- Compliance Focus: ${organizationContext.compliance_focus}
- System Examples: ${organizationContext.existing_systems.slice(0, 3).map(s => `${s.name} (${s.risk_level})`).join(', ')}
` : 'No organization context available'}

## System-Specific Context (User System RAG)
${systemContext || 'No system-specific context available.'}

## Platform Best Practices (Platform RAG)
${platformContext || 'No platform best practices available.'}

## Regulatory Requirements (Regulation RAG)
${regulationContext || 'No regulatory context available.'}
`;

  try {
    // Use OpenAI to generate comprehensive assessment
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
            content: `You are an expert AI governance consultant specializing in Shadow AI detection and compliance assessment. Analyze the discovered AI asset and generate a comprehensive assessment.

CRITICAL REQUIREMENTS:
- Assess shadow AI probability (0-100) based on registration status and usage patterns
- Classify the AI system type and use case based on available information
- Identify regulatory compliance gaps for ${regulationType} regulation
- Provide specific, actionable recommendations prioritized by urgency
- Consider data sensitivity and user-facing nature
- Base risk level on potential compliance violations and business impact

RESPONSE FORMAT: Return a valid JSON object with this exact structure:
{
  "risk_level": "low|medium|high|critical",
  "shadow_probability": 0-100,
  "regulatory_concerns": ["concern1", "concern2"],
  "classification": {
    "system_type": "specific AI system type",
    "use_case": "primary use case",
    "data_sensitivity": "low|medium|high",
    "user_facing": true|false
  },
  "compliance_gaps": [
    {
      "regulation": "EU|UK|MAS",
      "missing_requirements": ["requirement1", "requirement2"],
      "severity": "low|medium|high"
    }
  ],
  "recommended_actions": [
    {
      "priority": "immediate|high|medium|low",
      "action": "specific action to take",
      "rationale": "why this action is needed"
    }
  ],
  "confidence_score": 0-100
}`
          },
          {
            role: 'user',
            content: aiContext
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
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
      console.error('[Smart Shadow AI] Failed to parse AI response as JSON:', parseError);
      console.error('[Smart Shadow AI] Raw response:', content);
      return createBasicAssessment(asset);
    }

    // Validate and return assessment
    const validAssessment: ShadowAIAssessment = {
      asset_id: asset.id,
      risk_level: assessment.risk_level || 'medium',
      shadow_probability: Math.min(100, Math.max(0, assessment.shadow_probability || 50)),
      regulatory_concerns: Array.isArray(assessment.regulatory_concerns) ? assessment.regulatory_concerns : [],
      classification: {
        system_type: assessment.classification?.system_type || 'Unknown AI System',
        use_case: assessment.classification?.use_case || 'Unknown',
        data_sensitivity: assessment.classification?.data_sensitivity || 'medium',
        user_facing: Boolean(assessment.classification?.user_facing),
      },
      compliance_gaps: Array.isArray(assessment.compliance_gaps) ? assessment.compliance_gaps : [],
      recommended_actions: Array.isArray(assessment.recommended_actions) ? assessment.recommended_actions : [],
      confidence_score: Math.min(100, Math.max(0, assessment.confidence_score || 70)),
    };

    console.log(`[Smart Shadow AI] Generated assessment for asset ${asset.id} with ${validAssessment.confidence_score}% confidence`);
    return validAssessment;

  } catch (error) {
    console.error('[Smart Shadow AI] Error generating AI assessment:', error);
    return createBasicAssessment(asset);
  }
}

/**
 * Suggest links to existing systems using User System RAG
 */
export async function suggestSystemLinks(
  asset: DiscoveredAIAsset,
  userId: string,
  maxSuggestions: number = 5
): Promise<SystemLinkSuggestion[]> {
  console.log(`[Smart Shadow AI] Generating system link suggestions for asset ${asset.id}`);
  
  if (!userId) {
    console.warn("[Smart Shadow AI] User ID missing. Cannot generate link suggestions.");
    return [];
  }

  try {
    // Query for similar systems using User System RAG
    const linkQuery = `similar AI systems ${asset.detected_name} ${asset.detected_description || ''} ${asset.detected_vendor || ''} system linking recommendations existing systems`;
    const systemContext = await getUserSystemContextString(
      linkQuery,
      userId, // TEMPORARY: using userId as orgId during transition
      maxSuggestions * 2, // Get more context for better matching
      undefined,
      'discovery'
    );

    if (!systemContext || systemContext === "No relevant system data found.") {
      console.log(`[Smart Shadow AI] No similar systems found for asset ${asset.id}`);
      return [];
    }

    // Use AI to analyze similarities and generate suggestions
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
            content: `Analyze the discovered AI asset and suggest links to existing systems based on similarity. Return a JSON array of suggestions with similarity scores and rationale.

RESPONSE FORMAT:
[
  {
    "existing_system_id": "system_id",
    "system_name": "system_name",
    "similarity_score": 0-100,
    "matching_factors": ["factor1", "factor2"],
    "confidence": "high|medium|low",
    "rationale": "explanation of why these systems might be related"
  }
]`
          },
          {
            role: 'user',
            content: `
## Discovered Asset
- Name: ${asset.detected_name}
- Description: ${asset.detected_description || 'Not provided'}
- Vendor: ${asset.detected_vendor || 'Unknown'}
- Source: ${asset.source_type}

## Existing Systems Context
${systemContext}
`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content;

    if (!content) return [];

    const suggestions = JSON.parse(content);
    return Array.isArray(suggestions) ? suggestions.slice(0, maxSuggestions) : [];

  } catch (error) {
    console.error('[Smart Shadow AI] Error generating link suggestions:', error);
    return [];
  }
}

/**
 * Prioritize discovered systems based on risk and business impact
 */
export async function prioritizeDiscoveredSystems(
  assets: DiscoveredAIAsset[],
  userId: string
): Promise<DiscoveryPrioritization[]> {
  console.log(`[Smart Shadow AI] Prioritizing ${assets.length} discovered systems`);
  
  if (!userId || assets.length === 0) {
    return [];
  }

  try {
    // Get platform context for prioritization methodologies
    const platformContext = await getPlatformContextString(
      'shadow AI prioritization risk assessment business impact discovery management',
      5,
      'discovery'
    );

    // Build context for AI analysis
    const assetsContext = assets.map(asset => `
- ${asset.detected_name} (${asset.detected_vendor || 'Unknown'}, ${asset.environment || 'Unknown'}, ${asset.source_type})
  Description: ${asset.detected_description || 'Not provided'}
  Confidence: ${asset.confidence_score}
`).join('\n');

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
            content: `Prioritize discovered AI assets based on shadow AI risk, compliance impact, and business criticality. Return a JSON array of prioritizations.

RESPONSE FORMAT:
[
  {
    "asset_id": "asset_id",
    "priority_score": 0-100,
    "priority_level": "critical|high|medium|low",
    "risk_factors": ["factor1", "factor2"],
    "business_impact": "description of business impact",
    "urgency_rationale": "why this priority level"
  }
]`
          },
          {
            role: 'user',
            content: `
## Discovered Assets
${assetsContext}

## Platform Best Practices
${platformContext || 'No platform context available'}
`
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

    if (!content) return [];

    const prioritizations = JSON.parse(content);
    return Array.isArray(prioritizations) ? prioritizations : [];

  } catch (error) {
    console.error('[Smart Shadow AI] Error prioritizing systems:', error);
    return [];
  }
}

/**
 * Create a basic assessment when RAG sources are unavailable
 */
function createBasicAssessment(asset: DiscoveredAIAsset): ShadowAIAssessment {
  // Basic risk assessment based on available metadata
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  let shadowProbability = 60;

  // Increase risk for production environments
  if (asset.environment === 'prod') {
    riskLevel = 'high';
    shadowProbability = 80;
  }

  // Increase risk for known AI vendors
  if (asset.detected_vendor && ['OpenAI', 'Anthropic'].includes(asset.detected_vendor)) {
    shadowProbability = Math.min(90, shadowProbability + 20);
  }

  // Increase risk for API endpoints
  if (asset.source_type === 'api_scan') {
    shadowProbability = Math.min(95, shadowProbability + 15);
  }

  return {
    asset_id: asset.id,
    risk_level: riskLevel,
    shadow_probability: shadowProbability,
    regulatory_concerns: [
      'Unregistered AI system may violate compliance requirements',
      'Lack of governance oversight and risk assessment'
    ],
    classification: {
      system_type: 'Unknown AI System',
      use_case: 'Unknown',
      data_sensitivity: 'medium',
      user_facing: false,
    },
    compliance_gaps: [
      {
        regulation: 'EU',
        missing_requirements: [
          'System registration and documentation',
          'Risk assessment and mitigation',
          'Governance oversight'
        ],
        severity: 'medium'
      }
    ],
    recommended_actions: [
      {
        priority: 'high',
        action: 'Investigate and classify this AI system',
        rationale: 'Unregistered systems pose compliance risks'
      },
      {
        priority: 'medium',
        action: 'Conduct risk assessment if confirmed as AI system',
        rationale: 'Required for regulatory compliance'
      }
    ],
    confidence_score: 40, // Low confidence without RAG context
  };
}
