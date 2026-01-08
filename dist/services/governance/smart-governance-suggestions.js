"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSmartGovernanceSuggestions = generateSmartGovernanceSuggestions;
exports.getTaskContextualHelp = getTaskContextualHelp;
exports.analyzeTaskCompletionImpact = analyzeTaskCompletionImpact;
const platform_rag_service_1 = require("../ai/platform-rag-service");
const user_system_rag_service_1 = require("../ai/user-system-rag-service");
// Helper function to map regulation types for RAG
function mapRegulationTypeToRAG(regulationType) {
    return regulationType; // Direct mapping as they match
}
// Helper function to build RAG query for system context
function buildSystemContextQuery(context) {
    return `governance tasks recommendations ${context.systemName} ${context.systemDescription} risk level ${context.riskLevel} compliance status ${context.complianceStatus} lifecycle stage ${context.lifecycleStage} ${context.regulation} regulation`;
}
// Helper function to build RAG query for platform best practices
function buildPlatformQuery(context) {
    return `governance best practices task management compliance workflows ${context.regulation} ${context.riskLevel} risk systems lifecycle ${context.lifecycleStage} recommendations`;
}
// Helper function to generate suggestion ID
function generateSuggestionId(title) {
    return title.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 50);
}
// Helper function to determine priority based on context
function determinePriority(riskLevel, complianceStatus, lifecycleStage, category) {
    // High priority for high-risk systems or non-compliant systems
    if (riskLevel.toLowerCase().includes('high') || riskLevel.toLowerCase().includes('critical')) {
        return 'high';
    }
    // High priority for compliance and risk management in production stages
    if ((lifecycleStage === 'Deployed' || lifecycleStage === 'Monitoring') &&
        (category === 'compliance' || category === 'risk_management')) {
        return 'high';
    }
    // High priority for non-compliant systems
    if (complianceStatus.toLowerCase().includes('non-compliant') ||
        complianceStatus.toLowerCase().includes('gap')) {
        return 'high';
    }
    // Medium priority for medium risk or testing stage
    if (riskLevel.toLowerCase().includes('medium') || lifecycleStage === 'Testing') {
        return 'medium';
    }
    return 'low';
}
// Helper function to estimate effort
function estimateEffort(category, priority) {
    if (category === 'documentation' || category === 'monitoring') {
        return priority === 'high' ? 'medium' : 'low';
    }
    if (category === 'compliance' || category === 'governance') {
        return priority === 'high' ? 'high' : 'medium';
    }
    return 'medium';
}
/**
 * Generate smart governance task suggestions using Platform RAG + User System RAG
 */
async function generateSmartGovernanceSuggestions(context, userId, maxSuggestions = 8) {
    console.log(`[Smart Governance] Generating suggestions for system ${context.systemId} (${context.regulation})`);
    if (!userId) {
        console.warn("[Smart Governance] User ID missing. Cannot generate personalized suggestions.");
        return [];
    }
    let systemContext = '';
    let platformContext = '';
    // Fetch system-specific context using User System RAG
    try {
        const systemQuery = buildSystemContextQuery(context);
        systemContext = await (0, user_system_rag_service_1.getUserSystemContextString)(systemQuery, userId, // TEMPORARY: using userId as orgId during transition
        5, context.systemId, 'governance');
        if (systemContext === "No relevant system data found.")
            systemContext = '';
    }
    catch (error) {
        console.error(`[Smart Governance] Error fetching system context for user ${userId}, system ${context.systemId}:`, error);
        systemContext = '';
    }
    // Fetch platform best practices using Platform RAG
    try {
        const platformQuery = buildPlatformQuery(context);
        platformContext = await (0, platform_rag_service_1.getPlatformContextString)(platformQuery, 5, 'governance');
        if (platformContext === "No relevant platform knowledge found.")
            platformContext = '';
    }
    catch (error) {
        console.error(`[Smart Governance] Error fetching platform context:`, error);
        platformContext = '';
    }
    // If both RAG sources fail, return empty suggestions
    if (!systemContext && !platformContext) {
        console.warn("[Smart Governance] No context available from RAG sources. Returning empty suggestions.");
        return [];
    }
    // Build comprehensive context for AI generation
    const aiContext = `
## System Information
- System: ${context.systemName}
- Description: ${context.systemDescription}
- Risk Level: ${context.riskLevel}
- Compliance Status: ${context.complianceStatus}
- Lifecycle Stage: ${context.lifecycleStage}
- Regulation: ${context.regulation}

## Existing Tasks
${context.existingTasks.length > 0 ? context.existingTasks.map(task => `- ${task}`).join('\n') : '- None'}

## Completed Tasks
${context.completedTasks.length > 0 ? context.completedTasks.map(task => `- ${task}`).join('\n') : '- None'}

## System-Specific Context
${systemContext || 'No system-specific context available.'}

## Platform Best Practices
${platformContext || 'No platform best practices available.'}
`;
    try {
        // Use OpenAI to generate smart suggestions
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
                        content: `You are an expert AI governance consultant specializing in ${context.regulation} compliance. Generate smart, actionable governance task suggestions based on the provided system context and platform best practices.

CRITICAL REQUIREMENTS:
- Generate exactly ${maxSuggestions} unique suggestions
- Focus on tasks NOT already completed or in progress
- Prioritize based on risk level, compliance gaps, and lifecycle stage
- Each suggestion must be specific, actionable, and relevant
- Include clear rationale based on the provided context
- Provide 3-5 actionable steps for each suggestion
- Suggest realistic effort estimates and dependencies

RESPONSE FORMAT: Return a valid JSON array of suggestions with this exact structure:
[
  {
    "title": "Specific, actionable task title",
    "description": "Detailed description explaining what needs to be done and why",
    "priority": "high|medium|low",
    "category": "compliance|risk_management|documentation|governance|monitoring",
    "actionable_steps": ["Step 1", "Step 2", "Step 3"],
    "rationale": "Why this task is important based on system context",
    "estimated_effort": "low|medium|high",
    "dependencies": ["Optional dependency 1", "Optional dependency 2"],
    "resources": ["Optional resource 1", "Optional resource 2"]
  }
]

CATEGORIES:
- compliance: Tasks related to meeting regulatory requirements
- risk_management: Tasks for identifying and mitigating risks
- documentation: Tasks for creating or updating documentation
- governance: Tasks for establishing governance processes
- monitoring: Tasks for ongoing monitoring and oversight`
                    },
                    {
                        role: 'user',
                        content: aiContext
                    }
                ],
                temperature: 0.7,
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
        let suggestions;
        try {
            suggestions = JSON.parse(content);
        }
        catch (parseError) {
            console.error('[Smart Governance] Failed to parse AI response as JSON:', parseError);
            console.error('[Smart Governance] Raw response:', content);
            return [];
        }
        // Validate and transform suggestions
        const validSuggestions = suggestions
            .filter((suggestion) => suggestion.title &&
            suggestion.description &&
            suggestion.category &&
            suggestion.actionable_steps &&
            Array.isArray(suggestion.actionable_steps))
            .slice(0, maxSuggestions)
            .map((suggestion, index) => ({
            id: generateSuggestionId(suggestion.title) + `_${index}`,
            title: suggestion.title,
            description: suggestion.description,
            priority: determinePriority(context.riskLevel, context.complianceStatus, context.lifecycleStage, suggestion.category),
            category: suggestion.category,
            regulation: context.regulation,
            actionable_steps: suggestion.actionable_steps,
            rationale: suggestion.rationale || `Recommended based on ${context.regulation} requirements and system characteristics.`,
            estimated_effort: estimateEffort(suggestion.category, suggestion.priority),
            dependencies: suggestion.dependencies || [],
            resources: suggestion.resources || [],
        }));
        console.log(`[Smart Governance] Generated ${validSuggestions.length} smart suggestions for system ${context.systemId}`);
        return validSuggestions;
    }
    catch (error) {
        console.error('[Smart Governance] Error generating AI suggestions:', error);
        return [];
    }
}
/**
 * Get contextual help for a specific governance task
 */
async function getTaskContextualHelp(taskTitle, taskDescription, context, userId) {
    console.log(`[Smart Governance] Getting contextual help for task: ${taskTitle}`);
    if (!userId) {
        console.warn("[Smart Governance] User ID missing. Cannot provide personalized help.");
        return "Unable to provide contextual help without user context.";
    }
    let systemContext = '';
    let platformContext = '';
    // Fetch system-specific context
    try {
        const systemQuery = `${taskTitle} ${taskDescription} ${context.systemName} ${context.regulation} help guidance`;
        systemContext = await (0, user_system_rag_service_1.getUserSystemContextString)(systemQuery, userId, // TEMPORARY: using userId as orgId during transition
        3, context.systemId, 'governance');
        if (systemContext === "No relevant system data found.")
            systemContext = '';
    }
    catch (error) {
        console.error(`[Smart Governance] Error fetching system context for task help:`, error);
        systemContext = '';
    }
    // Fetch platform guidance
    try {
        const platformQuery = `${taskTitle} ${taskDescription} ${context.regulation} governance task help guidance best practices`;
        platformContext = await (0, platform_rag_service_1.getPlatformContextString)(platformQuery, 3, 'governance');
        if (platformContext === "No relevant platform knowledge found.")
            platformContext = '';
    }
    catch (error) {
        console.error(`[Smart Governance] Error fetching platform context for task help:`, error);
        platformContext = '';
    }
    // Combine contexts for helpful guidance
    const combinedContext = [
        systemContext && `**System-Specific Context:**\n${systemContext}`,
        platformContext && `**Platform Guidance:**\n${platformContext}`,
    ].filter(Boolean).join('\n\n');
    return combinedContext || "No specific guidance available for this task. Please refer to the general platform documentation or consult with your compliance team.";
}
/**
 * Analyze task completion impact using RAG context
 */
async function analyzeTaskCompletionImpact(completedTaskTitle, context, userId) {
    console.log(`[Smart Governance] Analyzing completion impact for task: ${completedTaskTitle}`);
    if (!userId) {
        return {
            impact_summary: "Unable to analyze impact without user context.",
            next_recommended_tasks: [],
            compliance_improvement: "Unknown"
        };
    }
    try {
        // Fetch context about the completed task's impact
        const impactQuery = `completed task ${completedTaskTitle} impact compliance improvement next steps ${context.regulation} ${context.systemName}`;
        const platformContext = await (0, platform_rag_service_1.getPlatformContextString)(impactQuery, 3, 'governance');
        return {
            impact_summary: platformContext || `Completing "${completedTaskTitle}" contributes to overall ${context.regulation} compliance for ${context.systemName}.`,
            next_recommended_tasks: [
                "Review updated compliance status",
                "Update system documentation",
                "Notify stakeholders of progress"
            ],
            compliance_improvement: "Positive progress toward compliance goals"
        };
    }
    catch (error) {
        console.error('[Smart Governance] Error analyzing task completion impact:', error);
        return {
            impact_summary: "Unable to analyze completion impact due to system error.",
            next_recommended_tasks: [],
            compliance_improvement: "Unknown"
        };
    }
}
//# sourceMappingURL=smart-governance-suggestions.js.map