import { getPlatformContextString } from "../ai/platform-rag-service";
import { getUserSystemContextString } from "../ai/user-system-rag-service";
import { getRegulationContextString, type RegulationType as RAGRegulationType } from "../ai/rag-service";

export interface PolicyComplianceAnalysis {
  policy_id: string;
  system_id: string;
  compliance_status: 'compliant' | 'partially_compliant' | 'non_compliant' | 'not_assessed';
  compliance_score: number; // 0-100
  gap_analysis: {
    missing_requirements: string[];
    partial_implementations: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
  recommendations: {
    priority: 'immediate' | 'high' | 'medium' | 'low';
    action: string;
    rationale: string;
    estimated_effort: 'low' | 'medium' | 'high';
  }[];
  regulatory_alignment: {
    regulation: 'EU' | 'UK' | 'MAS';
    alignment_score: number; // 0-100
    key_requirements: string[];
  }[];
  confidence_score: number; // 0-100
  assessment_date: string;
}

export interface PolicyConflictAnalysis {
  conflicting_policies: {
    policy_id_1: string;
    policy_name_1: string;
    policy_id_2: string;
    policy_name_2: string;
    conflict_type: 'requirement_contradiction' | 'scope_overlap' | 'enforcement_conflict';
    severity: 'low' | 'medium' | 'high';
    description: string;
    resolution_suggestions: string[];
  }[];
  system_impact: {
    affected_systems: string[];
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    business_impact: string;
  };
  recommended_actions: {
    priority: 'immediate' | 'high' | 'medium' | 'low';
    action: string;
    rationale: string;
  }[];
}

export interface ComplianceGapIdentification {
  system_id: string;
  applicable_policies: {
    policy_id: string;
    policy_name: string;
    compliance_status: 'compliant' | 'partially_compliant' | 'non_compliant' | 'not_assessed';
    gap_score: number; // 0-100, higher = more gaps
  }[];
  priority_gaps: {
    gap_type: 'documentation' | 'technical_control' | 'process' | 'governance';
    description: string;
    affected_policies: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
    remediation_effort: 'low' | 'medium' | 'high';
  }[];
  overall_compliance_score: number; // 0-100
  next_review_date: string;
}

// Helper function to map regulation types
function mapRegulationTypeToRAG(regulationType: string): RAGRegulationType {
  switch (regulationType.toUpperCase()) {
    case 'UK': return 'UK';
    case 'MAS': return 'MAS';
    case 'EU':
    default: return 'EU';
  }
}

// Helper function to build policy compliance query
function buildPolicyComplianceQuery(
  policyName: string,
  policyDescription: string,
  systemName: string,
  systemDescription: string
): string {
  return `policy compliance analysis ${policyName} ${policyDescription} AI system ${systemName} ${systemDescription} requirements assessment gap analysis`;
}

// Helper function to build regulation alignment query
function buildRegulationAlignmentQuery(
  policyName: string,
  regulationType: RAGRegulationType,
  systemType: string
): string {
  return `${regulationType} regulation policy alignment ${policyName} ${systemType} AI system compliance requirements mapping`;
}

// Helper function to build platform best practices query
function buildPlatformComplianceQuery(
  policyType: string,
  complianceArea: string
): string {
  return `policy compliance best practices ${policyType} ${complianceArea} governance implementation methodologies assessment frameworks`;
}

/**
 * Analyze policy compliance for a specific AI system using all three RAG sources
 */
export async function analyzePolicyCompliance(
  aiSystem: {
    id: string;
    name: string;
    description: string;
    risk_level: string;
    regulation_type?: string;
  },
  policies: Array<{
    id: string;
    name: string;
    description: string;
    policy_type: 'External' | 'Internal';
    jurisdiction?: string;
    requirements?: string[];
  }>,
  userId: string
): Promise<PolicyComplianceAnalysis[]> {
  console.log(`[Smart Policy Compliance] Analyzing compliance for system ${aiSystem.id} against ${policies.length} policies`);
  
  if (!userId || policies.length === 0) {
    return [];
  }

  const analyses: PolicyComplianceAnalysis[] = [];

  for (const policy of policies) {
    try {
      let systemContext = '';
      let platformContext = '';
      let regulationContext = '';

      const regulationType = mapRegulationTypeToRAG(policy.jurisdiction || aiSystem.regulation_type || 'EU');

      // Fetch system-specific context using User System RAG
      try {
        const systemQuery = buildPolicyComplianceQuery(
          policy.name,
          policy.description,
          aiSystem.name,
          aiSystem.description
        );
        systemContext = await getUserSystemContextString(
          systemQuery,
          userId, // TEMPORARY: using userId as orgId during transition
          5,
          aiSystem.id,
          'compliance'
        );
        if (systemContext === "No relevant system data found.") systemContext = '';
      } catch (error) {
        console.error(`[Smart Policy Compliance] Error fetching system context:`, error);
        systemContext = '';
      }

      // Fetch platform best practices using Platform RAG
      try {
        const platformQuery = buildPlatformComplianceQuery(
          policy.policy_type,
          'compliance_assessment'
        );
        platformContext = await getPlatformContextString(
          platformQuery,
          5,
          'compliance'
        );
        if (platformContext === "No relevant platform knowledge found.") platformContext = '';
      } catch (error) {
        console.error(`[Smart Policy Compliance] Error fetching platform context:`, error);
        platformContext = '';
      }

      // Fetch regulatory requirements using Regulation RAG
      try {
        const regulationQuery = buildRegulationAlignmentQuery(
          policy.name,
          regulationType,
          aiSystem.risk_level
        );
        regulationContext = await getRegulationContextString(
          regulationQuery,
          regulationType,
          5
        );
        if (regulationContext === "No relevant context found.") regulationContext = '';
      } catch (error) {
        console.error(`[Smart Policy Compliance] Error fetching regulation context:`, error);
        regulationContext = '';
      }

      // Build comprehensive context for AI analysis
      const aiContext = `
## AI System Information
- Name: ${aiSystem.name}
- Description: ${aiSystem.description}
- Risk Level: ${aiSystem.risk_level}
- Regulation Type: ${aiSystem.regulation_type || 'EU'}

## Policy Information
- Name: ${policy.name}
- Description: ${policy.description}
- Type: ${policy.policy_type}
- Jurisdiction: ${policy.jurisdiction || 'Not specified'}
- Requirements: ${policy.requirements?.join(', ') || 'Not specified'}

## System-Specific Context (User System RAG)
${systemContext || 'No system-specific context available.'}

## Platform Best Practices (Platform RAG)
${platformContext || 'No platform best practices available.'}

## Regulatory Requirements (Regulation RAG)
${regulationContext || 'No regulatory context available.'}
`;

      // Use OpenAI to generate compliance analysis
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
              content: `You are an expert AI governance consultant specializing in policy compliance analysis. Analyze the AI system against the given policy and generate a comprehensive compliance assessment.

CRITICAL REQUIREMENTS:
- Assess compliance status based on available information and context
- Calculate compliance score (0-100) based on requirement coverage
- Identify specific gaps and partial implementations
- Provide actionable recommendations prioritized by urgency
- Consider regulatory alignment and requirements
- Base confidence score on quality and completeness of available information

RESPONSE FORMAT: Return a valid JSON object with this exact structure:
{
  "compliance_status": "compliant|partially_compliant|non_compliant|not_assessed",
  "compliance_score": 0-100,
  "gap_analysis": {
    "missing_requirements": ["requirement1", "requirement2"],
    "partial_implementations": ["partial1", "partial2"],
    "severity": "low|medium|high|critical"
  },
  "recommendations": [
    {
      "priority": "immediate|high|medium|low",
      "action": "specific action to take",
      "rationale": "why this action is needed",
      "estimated_effort": "low|medium|high"
    }
  ],
  "regulatory_alignment": [
    {
      "regulation": "EU|UK|MAS",
      "alignment_score": 0-100,
      "key_requirements": ["requirement1", "requirement2"]
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

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      // Parse the JSON response
      let analysis: any;
      try {
        analysis = JSON.parse(content);
      } catch (parseError) {
        console.error('[Smart Policy Compliance] Failed to parse AI response as JSON:', parseError);
        console.error('[Smart Policy Compliance] Raw response:', content);
        continue; // Skip this policy
      }

      // Validate and add to results
      const validAnalysis: PolicyComplianceAnalysis = {
        policy_id: policy.id,
        system_id: aiSystem.id,
        compliance_status: analysis.compliance_status || 'not_assessed',
        compliance_score: Math.min(100, Math.max(0, analysis.compliance_score || 0)),
        gap_analysis: {
          missing_requirements: Array.isArray(analysis.gap_analysis?.missing_requirements) ? analysis.gap_analysis.missing_requirements : [],
          partial_implementations: Array.isArray(analysis.gap_analysis?.partial_implementations) ? analysis.gap_analysis.partial_implementations : [],
          severity: analysis.gap_analysis?.severity || 'medium',
        },
        recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : [],
        regulatory_alignment: Array.isArray(analysis.regulatory_alignment) ? analysis.regulatory_alignment : [],
        confidence_score: Math.min(100, Math.max(0, analysis.confidence_score || 50)),
        assessment_date: new Date().toISOString(),
      };

      analyses.push(validAnalysis);

    } catch (error) {
      console.error(`[Smart Policy Compliance] Error analyzing policy ${policy.id}:`, error);
      // Continue with other policies
    }
  }

  console.log(`[Smart Policy Compliance] Generated ${analyses.length} compliance analyses for system ${aiSystem.id}`);
  return analyses;
}

/**
 * Identify compliance gaps across all applicable policies for a system
 */
export async function identifyComplianceGaps(
  aiSystem: {
    id: string;
    name: string;
    description: string;
    risk_level: string;
  },
  applicablePolicies: Array<{
    id: string;
    name: string;
    description: string;
    policy_type: 'External' | 'Internal';
    current_compliance_status?: string;
  }>,
  userId: string
): Promise<ComplianceGapIdentification> {
  console.log(`[Smart Policy Compliance] Identifying compliance gaps for system ${aiSystem.id}`);
  
  if (!userId) {
    return createBasicGapIdentification(aiSystem, applicablePolicies);
  }

  try {
    // Get platform context for gap identification methodologies
    const platformContext = await getPlatformContextString(
      `compliance gap identification analysis ${aiSystem.risk_level} risk AI systems policy assessment methodologies`,
      5,
      'compliance'
    );

    // Build context for AI analysis
    const gapContext = `
## AI System
- Name: ${aiSystem.name}
- Description: ${aiSystem.description}
- Risk Level: ${aiSystem.risk_level}

## Applicable Policies
${applicablePolicies.map(policy => `
- ${policy.name} (${policy.policy_type})
  Description: ${policy.description}
  Current Status: ${policy.current_compliance_status || 'Unknown'}
`).join('\n')}

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
            content: `Analyze compliance gaps for the AI system across all applicable policies. Identify priority gaps and provide an overall compliance assessment.

RESPONSE FORMAT:
{
  "applicable_policies": [
    {
      "policy_id": "policy_id",
      "policy_name": "policy_name",
      "compliance_status": "compliant|partially_compliant|non_compliant|not_assessed",
      "gap_score": 0-100
    }
  ],
  "priority_gaps": [
    {
      "gap_type": "documentation|technical_control|process|governance",
      "description": "gap description",
      "affected_policies": ["policy1", "policy2"],
      "severity": "low|medium|high|critical",
      "remediation_effort": "low|medium|high"
    }
  ],
  "overall_compliance_score": 0-100,
  "next_review_date": "YYYY-MM-DD"
}`
          },
          {
            role: 'user',
            content: gapContext
          }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return createBasicGapIdentification(aiSystem, applicablePolicies);
    }

    const gapAnalysis = JSON.parse(content);

    return {
      system_id: aiSystem.id,
      applicable_policies: Array.isArray(gapAnalysis.applicable_policies) ? gapAnalysis.applicable_policies : [],
      priority_gaps: Array.isArray(gapAnalysis.priority_gaps) ? gapAnalysis.priority_gaps : [],
      overall_compliance_score: Math.min(100, Math.max(0, gapAnalysis.overall_compliance_score || 50)),
      next_review_date: gapAnalysis.next_review_date || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
    };

  } catch (error) {
    console.error('[Smart Policy Compliance] Error identifying compliance gaps:', error);
    return createBasicGapIdentification(aiSystem, applicablePolicies);
  }
}

/**
 * Detect conflicts between policies that may affect system compliance
 */
export async function detectPolicyConflicts(
  policies: Array<{
    id: string;
    name: string;
    description: string;
    policy_type: 'External' | 'Internal';
    jurisdiction?: string;
    requirements?: string[];
  }>,
  systemCharacteristics: {
    risk_level: string;
    system_type: string;
    data_sensitivity: string;
  },
  userId: string
): Promise<PolicyConflictAnalysis> {
  console.log(`[Smart Policy Compliance] Detecting conflicts among ${policies.length} policies`);
  
  if (!userId || policies.length < 2) {
    return {
      conflicting_policies: [],
      system_impact: {
        affected_systems: [],
        risk_level: 'low',
        business_impact: 'No conflicts detected or insufficient policies to analyze'
      },
      recommended_actions: []
    };
  }

  try {
    // Get platform context for conflict detection methodologies
    const platformContext = await getPlatformContextString(
      'policy conflict detection analysis governance frameworks compliance management conflict resolution',
      5,
      'compliance'
    );

    // Build context for AI analysis
    const conflictContext = `
## System Characteristics
- Risk Level: ${systemCharacteristics.risk_level}
- System Type: ${systemCharacteristics.system_type}
- Data Sensitivity: ${systemCharacteristics.data_sensitivity}

## Policies to Analyze
${policies.map(policy => `
- ${policy.name} (${policy.policy_type})
  Jurisdiction: ${policy.jurisdiction || 'Not specified'}
  Description: ${policy.description}
  Requirements: ${policy.requirements?.join(', ') || 'Not specified'}
`).join('\n')}

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
            content: `Analyze the provided policies for potential conflicts that could affect AI system compliance. Identify contradictions, overlaps, and enforcement conflicts.

RESPONSE FORMAT:
{
  "conflicting_policies": [
    {
      "policy_id_1": "id1",
      "policy_name_1": "name1",
      "policy_id_2": "id2", 
      "policy_name_2": "name2",
      "conflict_type": "requirement_contradiction|scope_overlap|enforcement_conflict",
      "severity": "low|medium|high",
      "description": "description of conflict",
      "resolution_suggestions": ["suggestion1", "suggestion2"]
    }
  ],
  "system_impact": {
    "affected_systems": ["system_type"],
    "risk_level": "low|medium|high|critical",
    "business_impact": "description"
  },
  "recommended_actions": [
    {
      "priority": "immediate|high|medium|low",
      "action": "action description",
      "rationale": "rationale"
    }
  ]
}`
          },
          {
            role: 'user',
            content: conflictContext
          }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    const conflictAnalysis = JSON.parse(content);

    return {
      conflicting_policies: Array.isArray(conflictAnalysis.conflicting_policies) ? conflictAnalysis.conflicting_policies : [],
      system_impact: conflictAnalysis.system_impact || {
        affected_systems: [],
        risk_level: 'low',
        business_impact: 'No significant impact identified'
      },
      recommended_actions: Array.isArray(conflictAnalysis.recommended_actions) ? conflictAnalysis.recommended_actions : []
    };

  } catch (error) {
    console.error('[Smart Policy Compliance] Error detecting policy conflicts:', error);
    return {
      conflicting_policies: [],
      system_impact: {
        affected_systems: [],
        risk_level: 'low',
        business_impact: 'Error occurred during conflict analysis'
      },
      recommended_actions: [
        {
          priority: 'medium',
          action: 'Manually review policies for potential conflicts',
          rationale: 'Automated analysis failed, manual review recommended'
        }
      ]
    };
  }
}

/**
 * Create a basic gap identification when RAG sources are unavailable
 */
function createBasicGapIdentification(
  aiSystem: { id: string; name: string; risk_level: string },
  applicablePolicies: Array<{ id: string; name: string; current_compliance_status?: string }>
): ComplianceGapIdentification {
  return {
    system_id: aiSystem.id,
    applicable_policies: applicablePolicies.map(policy => ({
      policy_id: policy.id,
      policy_name: policy.name,
      compliance_status: (policy.current_compliance_status as any) || 'not_assessed',
      gap_score: 50 // Default medium gap score
    })),
    priority_gaps: [
      {
        gap_type: 'documentation',
        description: 'Policy compliance documentation may be incomplete',
        affected_policies: applicablePolicies.map(p => p.name),
        severity: aiSystem.risk_level === 'high' ? 'high' : 'medium',
        remediation_effort: 'medium'
      }
    ],
    overall_compliance_score: 50, // Default medium compliance
    next_review_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  };
}
