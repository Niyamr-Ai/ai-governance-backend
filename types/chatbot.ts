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
 * - Conversations are NOT persisted by default
 * - Each request fetches system data fresh
 * - conversationHistory (if provided) is transient
 * - No long-term storage unless explicitly enabled later
 */
export interface ChatRequest {
  message: string;
  pageContext: PageContext;
  conversationHistory?: ChatMessage[]; // Transient - not persisted
  persona?: 'internal' | 'auditor' | 'regulator'; // Future: persona-based filtering (defaults to 'internal')
}

/**
 * Response from chat API
 */
export interface ChatResponse {
  answer: string;
  mode: ChatbotMode;
  suggestedActions?: string[]; // May include secondary intents as suggested follow-ups
  confidenceLevel?: 'high' | 'medium' | 'low'; // For SYSTEM_ANALYSIS mode
  error?: string;
}

/**
 * Intent classification result
 * 
 * Returns primary mode and optionally ordered list of all detected intents.
 * Secondary intents are converted to suggested actions.
 */
export interface IntentClassification {
  mode: ChatbotMode; // Primary mode (first intent)
  allIntents?: ChatbotMode[]; // Ordered list of all detected intents
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
  confidenceLevel?: 'high' | 'medium' | 'low'; // Computed by backend based on data completeness
}

export interface ActionContext {
  availableWorkflows?: string[];
  systemMetadata?: Record<string, any>;
  pendingTasks?: string[];
  nextSteps?: string[];
}

