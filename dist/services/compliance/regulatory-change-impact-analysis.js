"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeRegulatoryImpact = analyzeRegulatoryImpact;
exports.generateComplianceActionPlan = generateComplianceActionPlan;
exports.estimateComplianceEffort = estimateComplianceEffort;
const platform_rag_service_1 = require("../ai/platform-rag-service");
const user_system_rag_service_1 = require("../ai/user-system-rag-service");
const rag_service_1 = require("../ai/rag-service");
// Helper function to map regulation types
function mapRegulationTypeToRAG(regulationType) {
    return regulationType;
}
// Helper function to build regulatory change query
function buildRegulatoryChangeQuery(change) {
    return `${change.regulation_type} regulation change ${change.title} ${change.change_type} ${change.affected_areas.join(' ')} compliance impact requirements`;
}
// Helper function to build system impact query
function buildSystemImpactQuery(systemData, change) {
    return `AI system ${systemData.name} ${systemData.description || ''} ${change.regulation_type} regulation change impact ${change.title} compliance assessment ${systemData.risk_tier || ''}`;
}
// Helper function to build platform change management query
function buildPlatformChangeQuery(change) {
    return `regulatory change management ${change.regulation_type} compliance impact analysis change implementation best practices ${change.change_type}`;
}
/**
 * Analyze the impact of a regulatory change on a specific AI system
 */
async function analyzeRegulatoryImpact(regulatoryChange, systemData, userId) {
    console.log(`[Regulatory Impact] Analyzing impact of change "${regulatoryChange.title}" on system ${systemData.id}`);
    if (!userId) {
        console.warn("[Regulatory Impact] User ID missing. Cannot generate personalized analysis.");
        throw new Error("User authentication required for impact analysis");
    }
    let systemContext = '';
    let platformContext = '';
    let regulationContext = '';
    const regulationType = mapRegulationTypeToRAG(regulatoryChange.regulation_type);
    // Fetch system-specific context using User System RAG
    try {
        const systemQuery = buildSystemImpactQuery(systemData, regulatoryChange);
        systemContext = await (0, user_system_rag_service_1.getUserSystemContextString)(systemQuery, userId, // TEMPORARY: using userId as orgId during transition
        5, systemData.id, 'compliance');
        if (systemContext === "No relevant system data found.")
            systemContext = '';
    }
    catch (error) {
        console.error(`[Regulatory Impact] Error fetching system context:`, error);
        systemContext = '';
    }
    // Fetch platform best practices using Platform RAG
    try {
        const platformQuery = buildPlatformChangeQuery(regulatoryChange);
        platformContext = await (0, platform_rag_service_1.getPlatformContextString)(platformQuery, 5, 'compliance');
        if (platformContext === "No relevant platform knowledge found.")
            platformContext = '';
    }
    catch (error) {
        console.error(`[Regulatory Impact] Error fetching platform context:`, error);
        platformContext = '';
    }
    // Fetch regulatory context using Regulation RAG
    try {
        const regulationQuery = buildRegulatoryChangeQuery(regulatoryChange);
        regulationContext = await (0, rag_service_1.getRegulationContextString)(regulationQuery, regulationType, 7);
        if (regulationContext === "No relevant context found.")
            regulationContext = '';
    }
    catch (error) {
        console.error(`[Regulatory Impact] Error fetching regulation context:`, error);
        regulationContext = '';
    }
    // Build comprehensive context for AI analysis
    const aiContext = `
## Regulatory Change
- Title: ${regulatoryChange.title}
- Description: ${regulatoryChange.description}
- Regulation: ${regulatoryChange.regulation_type}
- Change Type: ${regulatoryChange.change_type}
- Severity: ${regulatoryChange.severity}
- Effective Date: ${regulatoryChange.effective_date}
- Compliance Deadline: ${regulatoryChange.compliance_deadline || 'Not specified'}
- Affected Areas: ${regulatoryChange.affected_areas.join(', ')}
- Summary: ${regulatoryChange.summary}

## AI System Information
- ID: ${systemData.id}
- Name: ${systemData.name}
- Description: ${systemData.description || 'Not provided'}
- Risk Tier: ${systemData.risk_tier || 'Unknown'}
- Lifecycle Stage: ${systemData.lifecycle_stage || 'Unknown'}
- Current Compliance Status: ${systemData.compliance_status || 'Unknown'}
- System Regulation Type: ${systemData.regulation_type || 'Unknown'}

## System-Specific Context (User System RAG)
${systemContext || 'No system-specific context available.'}

## Platform Best Practices (Platform RAG)
${platformContext || 'No platform best practices available.'}

## Regulatory Context (Regulation RAG)
${regulationContext || 'No regulatory context available.'}
`;
    try {
        // Use OpenAI to generate comprehensive impact analysis
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
                        content: `You are an expert regulatory compliance consultant specializing in AI governance. Analyze the impact of the regulatory change on the specific AI system and provide a comprehensive assessment.

CRITICAL REQUIREMENTS:
- Assess overall impact level and calculate impact score (0-100)
- Identify specific affected areas with detailed impact analysis
- Determine compliance gaps and required actions
- Provide timeline analysis with immediate, short-term, medium-term, and long-term actions
- Assess risks of non-compliance including business, financial, and reputational impacts
- Base analysis on the provided regulatory context and system information
- Consider the system's current compliance status and characteristics

RESPONSE FORMAT: Return a valid JSON object with this exact structure:
{
  "overall_impact_level": "minimal|low|medium|high|critical",
  "impact_score": 0-100,
  "affected_areas": [
    {
      "area": "specific area name",
      "impact_level": "minimal|low|medium|high|critical",
      "current_compliance_status": "compliant|partially_compliant|non_compliant|unknown",
      "required_actions": ["action1", "action2"],
      "estimated_effort": "low|medium|high",
      "priority": "immediate|high|medium|low"
    }
  ],
  "compliance_gaps": [
    {
      "gap_description": "description of gap",
      "regulatory_requirement": "specific requirement",
      "current_state": "current state description",
      "target_state": "target state description",
      "remediation_steps": ["step1", "step2"],
      "timeline": "estimated timeline",
      "resources_needed": ["resource1", "resource2"]
    }
  ],
  "timeline_analysis": {
    "immediate_actions": ["action1", "action2"],
    "short_term_actions": ["action1", "action2"],
    "medium_term_actions": ["action1", "action2"],
    "long_term_actions": ["action1", "action2"]
  },
  "risk_assessment": {
    "non_compliance_risks": ["risk1", "risk2"],
    "business_impact": "business impact description",
    "financial_implications": "financial implications description",
    "reputational_risks": ["risk1", "risk2"]
  },
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
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
            throw new Error('No content received from OpenAI');
        }
        // Parse the JSON response
        let analysis;
        try {
            analysis = JSON.parse(content);
        }
        catch (parseError) {
            console.error('[Regulatory Impact] Failed to parse AI response as JSON:', parseError);
            console.error('[Regulatory Impact] Raw response:', content);
            throw new Error('Failed to parse AI impact analysis response');
        }
        // Validate and return impact analysis
        const impactAnalysis = {
            system_id: systemData.id,
            system_name: systemData.name,
            regulation_type: regulatoryChange.regulation_type,
            overall_impact_level: analysis.overall_impact_level || 'medium',
            impact_score: Math.min(100, Math.max(0, analysis.impact_score || 50)),
            affected_areas: Array.isArray(analysis.affected_areas) ? analysis.affected_areas : [],
            compliance_gaps: Array.isArray(analysis.compliance_gaps) ? analysis.compliance_gaps : [],
            timeline_analysis: {
                immediate_actions: Array.isArray(analysis.timeline_analysis?.immediate_actions) ? analysis.timeline_analysis.immediate_actions : [],
                short_term_actions: Array.isArray(analysis.timeline_analysis?.short_term_actions) ? analysis.timeline_analysis.short_term_actions : [],
                medium_term_actions: Array.isArray(analysis.timeline_analysis?.medium_term_actions) ? analysis.timeline_analysis.medium_term_actions : [],
                long_term_actions: Array.isArray(analysis.timeline_analysis?.long_term_actions) ? analysis.timeline_analysis.long_term_actions : []
            },
            risk_assessment: {
                non_compliance_risks: Array.isArray(analysis.risk_assessment?.non_compliance_risks) ? analysis.risk_assessment.non_compliance_risks : [],
                business_impact: analysis.risk_assessment?.business_impact || 'Impact assessment not available',
                financial_implications: analysis.risk_assessment?.financial_implications || 'Financial implications not assessed',
                reputational_risks: Array.isArray(analysis.risk_assessment?.reputational_risks) ? analysis.risk_assessment.reputational_risks : []
            },
            confidence_score: Math.min(100, Math.max(0, analysis.confidence_score || 70))
        };
        console.log(`[Regulatory Impact] Generated impact analysis for system ${systemData.id} with ${impactAnalysis.overall_impact_level} impact level`);
        return impactAnalysis;
    }
    catch (error) {
        console.error('[Regulatory Impact] Error generating impact analysis:', error);
        throw error;
    }
}
/**
 * Generate a comprehensive action plan for compliance with regulatory changes
 */
async function generateComplianceActionPlan(impactAnalysis, regulatoryChange, organizationCapacity, userId) {
    console.log(`[Regulatory Impact] Generating action plan for system ${impactAnalysis.system_id}`);
    try {
        // Get platform context for action planning methodologies
        let platformContext = '';
        if (userId) {
            try {
                platformContext = await (0, platform_rag_service_1.getPlatformContextString)(`compliance action planning regulatory change implementation project management ${regulatoryChange.regulation_type}`, 5, 'compliance');
                if (platformContext === "No relevant platform knowledge found.")
                    platformContext = '';
            }
            catch (error) {
                console.error('[Regulatory Impact] Error fetching platform action planning context:', error);
                platformContext = '';
            }
        }
        // Build context for AI analysis
        const actionPlanContext = `
## Impact Analysis Summary
- System: ${impactAnalysis.system_name}
- Overall Impact: ${impactAnalysis.overall_impact_level}
- Impact Score: ${impactAnalysis.impact_score}
- Affected Areas: ${impactAnalysis.affected_areas.length}
- Compliance Gaps: ${impactAnalysis.compliance_gaps.length}

## Regulatory Change
- Title: ${regulatoryChange.title}
- Effective Date: ${regulatoryChange.effective_date}
- Compliance Deadline: ${regulatoryChange.compliance_deadline || 'Not specified'}
- Severity: ${regulatoryChange.severity}

## Organization Capacity
${organizationCapacity ? `
- Available Resources: ${organizationCapacity.available_resources.join(', ')}
- Budget Constraints: ${organizationCapacity.budget_constraints}
- Timeline Flexibility: ${organizationCapacity.timeline_flexibility}
` : 'No organization capacity information provided'}

## Timeline Analysis
- Immediate Actions: ${impactAnalysis.timeline_analysis.immediate_actions.join(', ')}
- Short-term Actions: ${impactAnalysis.timeline_analysis.short_term_actions.join(', ')}
- Medium-term Actions: ${impactAnalysis.timeline_analysis.medium_term_actions.join(', ')}
- Long-term Actions: ${impactAnalysis.timeline_analysis.long_term_actions.join(', ')}

## Platform Best Practices
${platformContext || 'No platform best practices available'}
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
                        content: `Generate a detailed compliance action plan based on the regulatory impact analysis. Create specific, actionable items with timelines, dependencies, and resource requirements.

RESPONSE FORMAT:
{
  "action_items": [
    {
      "id": "unique_id",
      "title": "action title",
      "description": "detailed description",
      "category": "documentation|technical_implementation|process_change|training|assessment",
      "priority": "immediate|high|medium|low",
      "estimated_effort": "low|medium|high",
      "timeline": "specific timeline",
      "dependencies": ["dependency1", "dependency2"],
      "success_criteria": ["criteria1", "criteria2"],
      "responsible_party": "role or team",
      "regulatory_basis": "regulatory requirement"
    }
  ],
  "milestones": [
    {
      "milestone": "milestone name",
      "target_date": "YYYY-MM-DD",
      "deliverables": ["deliverable1", "deliverable2"],
      "success_metrics": ["metric1", "metric2"]
    }
  ],
  "resource_allocation": {
    "human_resources": ["resource1", "resource2"],
    "budget_estimate": "budget description",
    "external_support_needed": true|false,
    "tools_and_systems": ["tool1", "tool2"]
  },
  "risk_mitigation": [
    {
      "risk": "risk description",
      "mitigation_strategy": "strategy description",
      "contingency_plan": "contingency description"
    }
  ]
}`
                    },
                    {
                        role: 'user',
                        content: actionPlanContext
                    }
                ],
                temperature: 0.3,
                max_tokens: 2500,
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
        const actionPlanData = JSON.parse(content);
        const actionPlan = {
            regulatory_change_id: regulatoryChange.id,
            system_id: impactAnalysis.system_id,
            action_items: Array.isArray(actionPlanData.action_items) ? actionPlanData.action_items : [],
            milestones: Array.isArray(actionPlanData.milestones) ? actionPlanData.milestones : [],
            resource_allocation: actionPlanData.resource_allocation || {
                human_resources: [],
                budget_estimate: 'Not estimated',
                external_support_needed: false,
                tools_and_systems: []
            },
            risk_mitigation: Array.isArray(actionPlanData.risk_mitigation) ? actionPlanData.risk_mitigation : []
        };
        console.log(`[Regulatory Impact] Generated action plan with ${actionPlan.action_items.length} action items`);
        return actionPlan;
    }
    catch (error) {
        console.error('[Regulatory Impact] Error generating action plan:', error);
        throw error;
    }
}
/**
 * Estimate compliance effort across multiple systems and changes
 */
async function estimateComplianceEffort(requiredChanges, organizationCapacity, userId) {
    console.log(`[Regulatory Impact] Estimating compliance effort for ${requiredChanges.length} systems`);
    // Calculate basic effort metrics
    const effortScores = requiredChanges.map(change => {
        let score = 0;
        switch (change.impact_level) {
            case 'critical':
                score += 10;
                break;
            case 'high':
                score += 8;
                break;
            case 'medium':
                score += 5;
                break;
            case 'low':
                score += 3;
                break;
            case 'minimal':
                score += 1;
                break;
        }
        switch (change.estimated_effort) {
            case 'high':
                score += 6;
                break;
            case 'medium':
                score += 3;
                break;
            case 'low':
                score += 1;
                break;
        }
        return score;
    });
    const totalEffortScore = effortScores.reduce((sum, score) => sum + score, 0);
    const averageEffortScore = totalEffortScore / requiredChanges.length;
    // Determine overall effort level
    let totalEffortEstimate;
    if (averageEffortScore <= 4)
        totalEffortEstimate = 'low';
    else if (averageEffortScore <= 8)
        totalEffortEstimate = 'medium';
    else if (averageEffortScore <= 12)
        totalEffortEstimate = 'high';
    else
        totalEffortEstimate = 'very_high';
    // Basic timeline estimation
    const baseTimelineMonths = Math.ceil(requiredChanges.length / Math.max(1, organizationCapacity.team_size / 2));
    const adjustedTimeline = totalEffortEstimate === 'very_high' ? baseTimelineMonths * 1.5 :
        totalEffortEstimate === 'high' ? baseTimelineMonths * 1.2 : baseTimelineMonths;
    return {
        total_effort_estimate: totalEffortEstimate,
        timeline_estimate: `${Math.ceil(adjustedTimeline)} months`,
        resource_requirements: {
            human_resources: [
                'Compliance specialists',
                'Technical implementation team',
                'Project managers',
                ...(totalEffortEstimate === 'high' || totalEffortEstimate === 'very_high' ? ['Legal advisors'] : [])
            ],
            estimated_budget: organizationCapacity.available_budget === 'high' ? 'Adequate budget available' :
                organizationCapacity.available_budget === 'medium' ? 'Moderate budget required' : 'Significant budget investment needed',
            external_support_recommended: totalEffortEstimate === 'very_high' || !organizationCapacity.external_support_available,
            critical_skills_needed: ['Regulatory compliance', 'AI governance', 'Technical implementation', 'Project management']
        },
        implementation_strategy: {
            recommended_approach: totalEffortEstimate === 'very_high' ? 'Phased implementation with external support' :
                totalEffortEstimate === 'high' ? 'Prioritized parallel implementation' : 'Standard implementation approach',
            phases: [
                {
                    phase_name: 'Critical Systems',
                    duration: `${Math.ceil(adjustedTimeline / 3)} months`,
                    systems_included: requiredChanges.filter(c => c.impact_level === 'critical' || c.impact_level === 'high').map(c => c.system_name),
                    key_activities: ['Impact assessment', 'Immediate compliance actions', 'Risk mitigation']
                },
                {
                    phase_name: 'Medium Priority Systems',
                    duration: `${Math.ceil(adjustedTimeline / 2)} months`,
                    systems_included: requiredChanges.filter(c => c.impact_level === 'medium').map(c => c.system_name),
                    key_activities: ['Systematic implementation', 'Process updates', 'Documentation']
                },
                {
                    phase_name: 'Low Priority Systems',
                    duration: `${Math.ceil(adjustedTimeline / 4)} months`,
                    systems_included: requiredChanges.filter(c => c.impact_level === 'low' || c.impact_level === 'minimal').map(c => c.system_name),
                    key_activities: ['Final compliance checks', 'Optimization', 'Monitoring setup']
                }
            ],
            risk_factors: [
                ...(totalEffortEstimate === 'very_high' ? ['Resource constraints', 'Timeline pressure'] : []),
                ...(organizationCapacity.available_budget === 'low' ? ['Budget limitations'] : []),
                'Regulatory interpretation challenges',
                'Technical implementation complexity'
            ]
        },
        confidence_level: userId ? 80 : 60 // Higher confidence with user context
    };
}
//# sourceMappingURL=regulatory-change-impact-analysis.js.map