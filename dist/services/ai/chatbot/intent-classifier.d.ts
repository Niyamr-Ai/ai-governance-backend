/**
 * Intent Classifier
 *
 * LLM-based intent classifier that determines which chatbot mode to use
 * based on user message and page context.
 *
 * Uses a small, cheap LLM call to classify intent into one of:
 * - EXPLAIN: Educational questions about regulations/concepts
 * - SYSTEM_ANALYSIS: Questions about analyzing a specific AI system
 * - ACTION: Questions about what to do next in the platform
 */
import type { PageContext, IntentClassification } from '../../../types/chatbot';
/**
 * Classify user intent into a chatbot mode
 *
 * @param userMessage - The user's message
 * @param pageContext - Current page context (page type, systemId, etc.)
 * @returns IntentClassification with the detected mode
 */
export declare function classifyIntent(userMessage: string, pageContext: PageContext): Promise<IntentClassification>;
//# sourceMappingURL=intent-classifier.d.ts.map