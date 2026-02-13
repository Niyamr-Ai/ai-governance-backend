/**
 * Prompt Templates
 *
 * Mode-specific prompt templates for the chatbot.
 * Each prompt enforces scope boundaries, uses structured response format,
 * and is deterministic and safe.
 */
import type { ExplainContext, SystemAnalysisContext, ActionContext, ChatbotMode } from '../../../types/chatbot';
/**
 * Build prompt for EXPLAIN mode
 */
export declare function buildExplainPrompt(userMessage: string, context: ExplainContext, conversationHistory?: string): string;
/**
 * Build prompt for SYSTEM_ANALYSIS mode
 */
export declare function buildSystemAnalysisPrompt(userMessage: string, context: SystemAnalysisContext, conversationHistory?: string): string;
/**
 * Build prompt for ACTION mode
 */
export declare function buildActionPrompt(userMessage: string, context: ActionContext, conversationHistory?: string): string;
/**
 * Get the appropriate prompt based on mode
 */
export declare function getPromptForMode(mode: ChatbotMode, userMessage: string, context: ExplainContext | SystemAnalysisContext | ActionContext, conversationHistory?: string): string;
//# sourceMappingURL=prompts.d.ts.map