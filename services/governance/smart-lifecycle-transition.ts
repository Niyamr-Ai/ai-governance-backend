import { getPlatformContextString } from "../ai/platform-rag-service";
import { getUserSystemContextString } from "../ai/user-system-rag-service";
import { getRegulationContextString, type RegulationType as RAGRegulationType } from "../ai/rag-service";

export interface LifecycleStage {
  stage: 'Draft' | 'Development' | 'Testing' | 'Deployed' | 'Monitoring' | 'Retired';
  description: string;
  typical_duration: string;
  key_activities: string[];
  exit_criteria: string[];
}

export interface TransitionReadinessAssessment {
  system_id: string;
  current_stage: LifecycleStage['stage'];
  target_stage: LifecycleStage['stage'];
  overall_readiness: 'ready' | 'mostly_ready' | 'partially_ready' | 'not_ready';
  readiness_score: number; // 0-100
  readiness_criteria: {
    criterion: string;
    status: 'met' | 'partially_met' | 'not_met' | 'not_applicable';
    description: string;
    regulatory_requirement: boolean;
    blocking: boolean;
    evidence: string[];
    recommendations: string[];
  }[];
  regulatory_requirements: {
    regulation: 'EU' | 'UK' | 'MAS';
    requirement: string;
    status: 'compliant' | 'partially_compliant' | 'non_compliant' | 'not_assessed';
    mandatory: boolean;
    evidence_needed: string[];
  }[];
  blockers: {
    blocker_type: 'regulatory' | 'technical' | 'process' | 'documentation' | 'governance';
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    resolution_steps: string[];
    estimated_resolution_time: string;
    responsible_party: string;
  }[];
  recommendations: {
    priority: 'immediate' | 'high' | 'medium' | 'low';
    category: 'regulatory' | 'technical' | 'process' | 'documentation' | 'governance';
    action: string;
    rationale: string;
    estimated_effort: 'low' | 'medium' | 'high';
    timeline: string;
  }[];
  confidence_score: number; // 0-100
}

export interface TransitionPlan {
  system_id: string;
  from_stage: LifecycleStage['stage'];
  to_stage: LifecycleStage['stage'];
  transition_strategy: 'immediate' | 'phased' | 'conditional' | 'delayed';
  estimated_timeline: string;
  phases: {
    phase_name: string;
    duration: string;
    activities: {
      activity: string;
      category: 'regulatory' | 'technical' | 'process' | 'documentation' | 'governance';
      priority: 'immediate' | 'high' | 'medium' | 'low';
      estimated_effort: 'low' | 'medium' | 'high';
      dependencies: string[];
      deliverables: string[];
      success_criteria: string[];
    }[];
    milestones: {
      milestone: string;
      target_date: string;
      success_criteria: string[];
      dependencies: string[];
    }[];
    risks: {
      risk: string;
      probability: 'low' | 'medium' | 'high';
      impact: 'low' | 'medium' | 'high';
      mitigation: string;
    }[];
  }[];
  resource_requirements: {
    human_resources: string[];
    technical_resources: string[];
    budget_estimate: string;
    external_support_needed: boolean;
  };
  success_metrics: {
    metric: string;
    target_value: string;
    measurement_method: string;
  }[];
  contingency_plans: {
    scenario: string;
    trigger_conditions: string[];
    response_actions: string[];
  }[];
}

export interface BlockerResolution {
  blocker_id: string;
  blocker_description: string;
  blocker_type: 'regulatory' | 'technical' | 'process' | 'documentation' | 'governance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolution_strategies: {
    strategy: string;
    approach: string;
    estimated_effort: 'low' | 'medium' | 'high';
    timeline: string;
    success_probability: 'low' | 'medium' | 'high';
    resources_needed: string[];
    regulatory_alignment: string;
    risks: string[];
    benefits: string[];
  }[];
  recommended_strategy: string;
  implementation_steps: {
    step: string;
    description: string;
    estimated_duration: string;
    dependencies: string[];
    deliverables: string[];
    success_criteria: string[];
  }[];
  monitoring_plan: {
    progress_indicators: string[];
    review_frequency: string;
    escalation_triggers: string[];
  };
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

// Helper function to build transition readiness query
function buildTransitionReadinessQuery(
  systemData: any,
  currentStage: string,
  targetStage: string
): string {
  return `AI system lifecycle transition ${currentStage} to ${targetStage} readiness assessment ${systemData.name} ${systemData.description || ''} ${systemData.risk_tier || ''} requirements criteria`;
}

// Helper function to build regulation transition query
function buildRegulationTransitionQuery(
  currentStage: string,
  targetStage: string,
  regulationType: RAGRegulationType
): string {
  return `${regulationType} regulation AI system lifecycle transition ${currentStage} ${targetStage} requirements compliance obligations governance`;
}

// Helper function to build platform transition query
function buildPlatformTransitionQuery(
  currentStage: string,
  targetStage: string
): string {
  return `AI system lifecycle transition best practices ${currentStage} ${targetStage} governance methodologies transition management readiness assessment`;
}

/**
 * Assess readiness for lifecycle transition using all three RAG sources
 */
export async function assessTransitionReadiness(
  systemData: {
    id: string;
    name: string;
    description?: string;
    risk_tier?: string;
    current_stage: LifecycleStage['stage'];
    regulation_type?: string;
    compliance_status?: string;
    [key: string]: any;
  },
  targetStage: LifecycleStage['stage'],
  userId: string
): Promise<TransitionReadinessAssessment> {
  console.log(`[Lifecycle Transition] Assessing transition readiness from ${systemData.current_stage} to ${targetStage} for system ${systemData.id}`);
  
  if (!userId) {
    console.warn("[Lifecycle Transition] User ID missing. Cannot generate personalized assessment.");
    throw new Error("User authentication required for transition readiness assessment");
  }

  let systemContext = '';
  let platformContext = '';
  let regulationContext = '';

  const regulationType = mapRegulationTypeToRAG(systemData.regulation_type);

  // Fetch system-specific context using User System RAG
  try {
    const systemQuery = buildTransitionReadinessQuery(systemData, systemData.current_stage, targetStage);
    systemContext = await getUserSystemContextString(
      systemQuery,
      userId, // TEMPORARY: using userId as orgId during transition
      5,
      systemData.id,
      'lifecycle'
    );
    if (systemContext === "No relevant system data found.") systemContext = '';
  } catch (error) {
    console.error(`[Lifecycle Transition] Error fetching system context:`, error);
    systemContext = '';
  }

  // Fetch platform best practices using Platform RAG
  try {
    const platformQuery = buildPlatformTransitionQuery(systemData.current_stage, targetStage);
    platformContext = await getPlatformContextString(
      platformQuery,
      5,
      'lifecycle'
    );
    if (platformContext === "No relevant platform knowledge found.") platformContext = '';
  } catch (error) {
    console.error(`[Lifecycle Transition] Error fetching platform context:`, error);
    platformContext = '';
  }

  // Fetch regulatory requirements using Regulation RAG
  try {
    const regulationQuery = buildRegulationTransitionQuery(systemData.current_stage, targetStage, regulationType);
    regulationContext = await getRegulationContextString(
      regulationQuery,
      regulationType,
      5
    );
    if (regulationContext === "No relevant context found.") regulationContext = '';
  } catch (error) {
    console.error(`[Lifecycle Transition] Error fetching regulation context:`, error);
    regulationContext = '';
  }

  // Build comprehensive context for AI analysis
  const aiContext = `
## System Information
- ID: ${systemData.id}
- Name: ${systemData.name}
- Description: ${systemData.description || 'Not provided'}
- Risk Tier: ${systemData.risk_tier || 'Unknown'}
- Current Stage: ${systemData.current_stage}
- Target Stage: ${targetStage}
- Regulation Type: ${systemData.regulation_type || 'EU'}
- Compliance Status: ${systemData.compliance_status || 'Unknown'}

## System-Specific Context (User System RAG)
${systemContext || 'No system-specific context available.'}

## Platform Best Practices (Platform RAG)
${platformContext || 'No platform best practices available.'}

## Regulatory Requirements (Regulation RAG)
${regulationContext || 'No regulatory context available.'}
`;

  try {
    // Use OpenAI to generate comprehensive readiness assessment
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
            content: `You are an expert AI lifecycle governance consultant specializing in transition readiness assessment. Analyze the system's readiness to transition from ${systemData.current_stage} to ${targetStage} stage.

CRITICAL REQUIREMENTS:
- Assess overall readiness level and calculate readiness score (0-100)
- Evaluate specific readiness criteria with detailed status
- Identify regulatory requirements and compliance status
- Identify blockers that prevent transition
- Provide actionable recommendations prioritized by urgency
- Consider regulatory requirements as mandatory and potentially blocking
- Base assessment on provided context from regulatory knowledge, platform best practices, and system information

RESPONSE FORMAT: Return a valid JSON object with this exact structure:
{
  "overall_readiness": "ready|mostly_ready|partially_ready|not_ready",
  "readiness_score": 0-100,
  "readiness_criteria": [
    {
      "criterion": "specific criterion",
      "status": "met|partially_met|not_met|not_applicable",
      "description": "detailed description",
      "regulatory_requirement": true|false,
      "blocking": true|false,
      "evidence": ["evidence1", "evidence2"],
      "recommendations": ["rec1", "rec2"]
    }
  ],
  "regulatory_requirements": [
    {
      "regulation": "EU|UK|MAS",
      "requirement": "specific requirement",
      "status": "compliant|partially_compliant|non_compliant|not_assessed",
      "mandatory": true|false,
      "evidence_needed": ["evidence1", "evidence2"]
    }
  ],
  "blockers": [
    {
      "blocker_type": "regulatory|technical|process|documentation|governance",
      "description": "blocker description",
      "severity": "low|medium|high|critical",
      "resolution_steps": ["step1", "step2"],
      "estimated_resolution_time": "time estimate",
      "responsible_party": "responsible party"
    }
  ],
  "recommendations": [
    {
      "priority": "immediate|high|medium|low",
      "category": "regulatory|technical|process|documentation|governance",
      "action": "specific action",
      "rationale": "why needed",
      "estimated_effort": "low|medium|high",
      "timeline": "estimated timeline"
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
        max_tokens: 3000,
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
      console.error('[Lifecycle Transition] Failed to parse AI response as JSON:', parseError);
      console.error('[Lifecycle Transition] Raw response:', content);
      throw new Error('Failed to parse AI transition readiness assessment response');
    }

    // Validate and return readiness assessment
    const readinessAssessment: TransitionReadinessAssessment = {
      system_id: systemData.id,
      current_stage: systemData.current_stage,
      target_stage: targetStage,
      overall_readiness: assessment.overall_readiness || 'partially_ready',
      readiness_score: Math.min(100, Math.max(0, assessment.readiness_score || 50)),
      readiness_criteria: Array.isArray(assessment.readiness_criteria) ? assessment.readiness_criteria : [],
      regulatory_requirements: Array.isArray(assessment.regulatory_requirements) ? assessment.regulatory_requirements : [],
      blockers: Array.isArray(assessment.blockers) ? assessment.blockers : [],
      recommendations: Array.isArray(assessment.recommendations) ? assessment.recommendations : [],
      confidence_score: Math.min(100, Math.max(0, assessment.confidence_score || 70))
    };

    console.log(`[Lifecycle Transition] Generated readiness assessment for system ${systemData.id} with ${readinessAssessment.overall_readiness} readiness`);
    return readinessAssessment;

  } catch (error) {
    console.error('[Lifecycle Transition] Error generating readiness assessment:', error);
    throw error;
  }
}

/**
 * Generate intelligent transition plan using RAG context
 */
export async function generateTransitionPlan(
  systemData: {
    id: string;
    name: string;
    description?: string;
    risk_tier?: string;
    regulation_type?: string;
  },
  fromStage: LifecycleStage['stage'],
  toStage: LifecycleStage['stage'],
  readinessAssessment: TransitionReadinessAssessment,
  userId: string
): Promise<TransitionPlan> {
  console.log(`[Lifecycle Transition] Generating transition plan from ${fromStage} to ${toStage} for system ${systemData.id}`);
  
  if (!userId) {
    throw new Error("User authentication required for transition plan generation");
  }

  try {
    // Get platform context for transition planning methodologies
    const platformContext = await getPlatformContextString(
      `lifecycle transition planning ${fromStage} ${toStage} project management implementation strategy AI systems governance`,
      5,
      'lifecycle'
    );

    // Build context for AI analysis
    const planContext = `
## System Information
- Name: ${systemData.name}
- Description: ${systemData.description || 'Not provided'}
- Risk Tier: ${systemData.risk_tier || 'Unknown'}
- Regulation: ${systemData.regulation_type || 'EU'}

## Transition Details
- From Stage: ${fromStage}
- To Stage: ${toStage}
- Overall Readiness: ${readinessAssessment.overall_readiness}
- Readiness Score: ${readinessAssessment.readiness_score}

## Readiness Assessment Summary
- Total Criteria: ${readinessAssessment.readiness_criteria.length}
- Met Criteria: ${readinessAssessment.readiness_criteria.filter(c => c.status === 'met').length}
- Blockers: ${readinessAssessment.blockers.length}
- Regulatory Requirements: ${readinessAssessment.regulatory_requirements.length}

## Key Blockers
${readinessAssessment.blockers.map(b => `- ${b.description} (${b.severity})`).join('\n')}

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
            content: `Generate a comprehensive transition plan for the AI system lifecycle stage transition. Create a detailed, phased approach with specific activities, milestones, and resource requirements.

RESPONSE FORMAT:
{
  "transition_strategy": "immediate|phased|conditional|delayed",
  "estimated_timeline": "timeline description",
  "phases": [
    {
      "phase_name": "phase name",
      "duration": "duration",
      "activities": [
        {
          "activity": "activity name",
          "category": "regulatory|technical|process|documentation|governance",
          "priority": "immediate|high|medium|low",
          "estimated_effort": "low|medium|high",
          "dependencies": ["dep1", "dep2"],
          "deliverables": ["deliverable1", "deliverable2"],
          "success_criteria": ["criteria1", "criteria2"]
        }
      ],
      "milestones": [
        {
          "milestone": "milestone name",
          "target_date": "relative date",
          "success_criteria": ["criteria1", "criteria2"],
          "dependencies": ["dep1", "dep2"]
        }
      ],
      "risks": [
        {
          "risk": "risk description",
          "probability": "low|medium|high",
          "impact": "low|medium|high",
          "mitigation": "mitigation strategy"
        }
      ]
    }
  ],
  "resource_requirements": {
    "human_resources": ["resource1", "resource2"],
    "technical_resources": ["resource1", "resource2"],
    "budget_estimate": "budget description",
    "external_support_needed": true|false
  },
  "success_metrics": [
    {
      "metric": "metric name",
      "target_value": "target",
      "measurement_method": "how to measure"
    }
  ],
  "contingency_plans": [
    {
      "scenario": "scenario description",
      "trigger_conditions": ["condition1", "condition2"],
      "response_actions": ["action1", "action2"]
    }
  ]
}`
          },
          {
            role: 'user',
            content: planContext
          }
        ],
        temperature: 0.3,
        max_tokens: 2500,
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

    const planData = JSON.parse(content);

    const transitionPlan: TransitionPlan = {
      system_id: systemData.id,
      from_stage: fromStage,
      to_stage: toStage,
      transition_strategy: planData.transition_strategy || 'phased',
      estimated_timeline: planData.estimated_timeline || '4-8 weeks',
      phases: Array.isArray(planData.phases) ? planData.phases : [],
      resource_requirements: planData.resource_requirements || {
        human_resources: [],
        technical_resources: [],
        budget_estimate: 'Not estimated',
        external_support_needed: false
      },
      success_metrics: Array.isArray(planData.success_metrics) ? planData.success_metrics : [],
      contingency_plans: Array.isArray(planData.contingency_plans) ? planData.contingency_plans : []
    };

    console.log(`[Lifecycle Transition] Generated transition plan with ${transitionPlan.phases.length} phases`);
    return transitionPlan;

  } catch (error) {
    console.error('[Lifecycle Transition] Error generating transition plan:', error);
    throw error;
  }
}

/**
 * Suggest resolutions for transition blockers using RAG context
 */
export async function suggestBlockerResolutions(
  blockers: TransitionReadinessAssessment['blockers'],
  systemContext: {
    id: string;
    name: string;
    risk_tier: string;
    regulation_type: string;
  },
  userId: string
): Promise<BlockerResolution[]> {
  console.log(`[Lifecycle Transition] Generating blocker resolutions for ${blockers.length} blockers`);
  
  if (!userId || blockers.length === 0) {
    return [];
  }

  const resolutions: BlockerResolution[] = [];
  const regulationType = mapRegulationTypeToRAG(systemContext.regulation_type);

  for (const [index, blocker] of blockers.entries()) {
    try {
      let platformContext = '';
      let regulationContext = '';

      // Get platform best practices for this blocker type
      try {
        const platformQuery = `${blocker.blocker_type} blocker resolution AI systems lifecycle transition ${blocker.description} best practices solutions`;
        platformContext = await getPlatformContextString(platformQuery, 3, 'lifecycle');
        if (platformContext === "No relevant platform knowledge found.") platformContext = '';
      } catch (error) {
        console.error(`[Lifecycle Transition] Error fetching platform blocker context:`, error);
        platformContext = '';
      }

      // Get regulatory context if it's a regulatory blocker
      if (blocker.blocker_type === 'regulatory') {
        try {
          const regulationQuery = `${regulationType} regulation blocker resolution ${blocker.description} compliance requirements solutions`;
          regulationContext = await getRegulationContextString(regulationQuery, regulationType, 3);
          if (regulationContext === "No relevant context found.") regulationContext = '';
        } catch (error) {
          console.error(`[Lifecycle Transition] Error fetching regulation blocker context:`, error);
          regulationContext = '';
        }
      }

      // Generate blocker resolution using AI
      const resolutionContext = `
## Blocker Information
- Type: ${blocker.blocker_type}
- Description: ${blocker.description}
- Severity: ${blocker.severity}
- Estimated Resolution Time: ${blocker.estimated_resolution_time}
- Responsible Party: ${blocker.responsible_party}

## System Context
- System: ${systemContext.name}
- Risk Tier: ${systemContext.risk_tier}
- Regulation: ${systemContext.regulation_type}

## Platform Best Practices
${platformContext || 'No platform best practices available'}

## Regulatory Context
${regulationContext || 'No regulatory context available'}
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
              content: `Generate specific resolution strategies for the lifecycle transition blocker. Provide multiple approaches with detailed implementation steps.

RESPONSE FORMAT:
{
  "resolution_strategies": [
    {
      "strategy": "strategy name",
      "approach": "detailed approach",
      "estimated_effort": "low|medium|high",
      "timeline": "timeline estimate",
      "success_probability": "low|medium|high",
      "resources_needed": ["resource1", "resource2"],
      "regulatory_alignment": "alignment description",
      "risks": ["risk1", "risk2"],
      "benefits": ["benefit1", "benefit2"]
    }
  ],
  "recommended_strategy": "recommended strategy name",
  "implementation_steps": [
    {
      "step": "step name",
      "description": "step description",
      "estimated_duration": "duration",
      "dependencies": ["dep1", "dep2"],
      "deliverables": ["deliverable1", "deliverable2"],
      "success_criteria": ["criteria1", "criteria2"]
    }
  ],
  "monitoring_plan": {
    "progress_indicators": ["indicator1", "indicator2"],
    "review_frequency": "frequency",
    "escalation_triggers": ["trigger1", "trigger2"]
  }
}`
            },
            {
              role: 'user',
              content: resolutionContext
            }
          ],
          temperature: 0.3,
          max_tokens: 1500,
        }),
      });

      if (response.ok) {
        const data = await response.json() as any;
        const content = data.choices?.[0]?.message?.content;

        if (content) {
          try {
            const resolutionData = JSON.parse(content);
            
            const resolution: BlockerResolution = {
              blocker_id: `blocker_${index}`,
              blocker_description: blocker.description,
              blocker_type: blocker.blocker_type,
              severity: blocker.severity,
              resolution_strategies: Array.isArray(resolutionData.resolution_strategies) ? 
                resolutionData.resolution_strategies : [],
              recommended_strategy: resolutionData.recommended_strategy || 'Strategy not specified',
              implementation_steps: Array.isArray(resolutionData.implementation_steps) ? 
                resolutionData.implementation_steps : [],
              monitoring_plan: resolutionData.monitoring_plan || {
                progress_indicators: [],
                review_frequency: 'Weekly',
                escalation_triggers: []
              }
            };

            resolutions.push(resolution);
          } catch (parseError) {
            console.error('[Lifecycle Transition] Failed to parse blocker resolution response:', parseError);
          }
        }
      }
    } catch (error) {
      console.error(`[Lifecycle Transition] Error generating resolution for blocker ${index}:`, error);
    }
  }

  console.log(`[Lifecycle Transition] Generated ${resolutions.length} blocker resolutions`);
  return resolutions;
}
