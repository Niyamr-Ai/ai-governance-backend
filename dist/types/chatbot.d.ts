/**
 * Chatbot Types
 *
 * Type definitions for the AI Governance Copilot chatbot system.
 * These types define the structure for chat messages, modes, and responses.
 */
/**
 * Chatbot modes that determine behavior and context usage
 */
export type ChatbotMode = 'EXPLAIN' | 'SYSTEM_ANALYSIS' | 'ACTION';
/**
 * Page context information passed from frontend
 */
export interface PageContext {
    pageType: 'dashboard' | 'ai-system' | 'compliance' | 'discovery' | 'documentation' | 'policy-tracker' | 'red-teaming' | 'assessment' | 'unknown';
    systemId?: string;
    orgId?: string;
    additionalMetadata?: Record<string, any>;
}
/**
 * Chat message structure
 */
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    mode?: ChatbotMode;
}
/**
 * Request payload for chat API
 *
 * Conversation Memory Policy:
 * - Conversations are now persisted in Supabase chat_history table
 * - Each request fetches last 3 conversation messages for context
 * - conversationHistory (if provided) is still accepted but history is fetched from DB
 * - History is stored per org_id and session_id for tenant isolation
 */
export interface ChatRequest {
    message: string;
    pageContext: PageContext;
    conversationHistory?: ChatMessage[];
    persona?: 'internal' | 'auditor' | 'regulator';
    sessionId?: string;
}
/**
 * Response from chat API
 */
export interface ChatResponse {
    answer: string;
    mode: ChatbotMode;
    suggestedActions?: string[];
    confidenceLevel?: 'high' | 'medium' | 'low';
    error?: string;
}
/**
 * Intent classification result
 *
 * Returns primary mode and optionally ordered list of all detected intents.
 * Secondary intents are converted to suggested actions.
 */
export interface IntentClassification {
    mode: ChatbotMode;
    allIntents?: ChatbotMode[];
    confidence?: number;
}
/**
 * Context data retrieved for each mode
 */
export interface ExplainContext {
    regulatoryText?: string;
    conceptDefinitions?: string[];
    platformBehavior?: string;
}
export interface SystemAnalysisContext {
    systemName?: string;
    systemDescription?: string;
    riskLevel?: string;
    complianceStatus?: string;
    assessments?: any[];
    gaps?: string[];
    confidenceLevel?: 'high' | 'medium' | 'low';
}
export interface ActionContext {
    availableWorkflows?: string[];
    systemMetadata?: Record<string, any>;
    pendingTasks?: string[];
    nextSteps?: string[];
}
//# sourceMappingURL=chatbot.d.ts.map