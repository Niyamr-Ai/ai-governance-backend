import type { GovernanceRegulation } from "../../types/governance-task";
export interface SmartSuggestion {
    id: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    category: 'compliance' | 'risk_management' | 'documentation' | 'governance' | 'monitoring';
    regulation: GovernanceRegulation;
    actionable_steps: string[];
    rationale: string;
    estimated_effort: 'low' | 'medium' | 'high';
    dependencies?: string[];
    resources?: string[];
}
export interface TaskSuggestionContext {
    systemId: string;
    systemName: string;
    systemDescription: string;
    riskLevel: string;
    complianceStatus: string;
    lifecycleStage: string;
    regulation: GovernanceRegulation;
    existingTasks: string[];
    completedTasks: string[];
}
/**
 * Generate smart governance task suggestions using Platform RAG + User System RAG
 */
export declare function generateSmartGovernanceSuggestions(context: TaskSuggestionContext, userId: string, maxSuggestions?: number): Promise<SmartSuggestion[]>;
/**
 * Get contextual help for a specific governance task
 */
export declare function getTaskContextualHelp(taskTitle: string, taskDescription: string, context: TaskSuggestionContext, userId: string): Promise<string>;
/**
 * Analyze task completion impact using RAG context
 */
export declare function analyzeTaskCompletionImpact(completedTaskTitle: string, context: TaskSuggestionContext, userId: string): Promise<{
    impact_summary: string;
    next_recommended_tasks: string[];
    compliance_improvement: string;
}>;
//# sourceMappingURL=smart-governance-suggestions.d.ts.map