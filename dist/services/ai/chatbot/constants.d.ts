/**
 * Chatbot Constants
 *
 * Defines the three chatbot modes and their characteristics.
 * These modes determine how the chatbot behaves and what context it uses.
 */
import type { ChatbotMode } from '../../../types/chatbot';
/**
 * Chatbot Modes
 *
 * EXPLAIN: Educational mode for explaining regulations, concepts, and platform behavior
 * SYSTEM_ANALYSIS: Analytical mode for analyzing user's AI system against regulations
 * ACTION: Actionable mode for recommending next steps within the platform
 */
export declare const CHATBOT_MODES: Record<ChatbotMode, {
    label: string;
    description: string;
    usesSystemData: boolean;
    tone: string;
    purpose: string;
}>;
/**
 * Valid chatbot mode values
 */
export declare const VALID_MODES: ChatbotMode[];
/**
 * Default mode when intent classification fails
 */
export declare const DEFAULT_MODE: ChatbotMode;
/**
 * Mode aliases (non-breaking support for internal renaming)
 * SYSTEM_GUIDANCE is an alias for SYSTEM_ANALYSIS
 */
export declare const MODE_ALIASES: Record<string, ChatbotMode>;
/**
 * Normalize mode name (handles aliases)
 */
export declare function normalizeMode(mode: string): ChatbotMode;
//# sourceMappingURL=constants.d.ts.map