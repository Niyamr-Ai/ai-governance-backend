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
export const CHATBOT_MODES: Record<ChatbotMode, {
  label: string;
  description: string;
  usesSystemData: boolean;
  tone: string;
  purpose: string;
}> = {
  EXPLAIN: {
    label: 'Explain',
    description: 'Explain regulations, concepts, and platform behavior',
    usesSystemData: false,
    tone: 'Educational, neutral',
    purpose: 'Provide educational information without accessing user AI system data'
  },
  SYSTEM_ANALYSIS: {
    label: 'System Analysis',
    description: 'Analyze your AI system against regulations',
    usesSystemData: true,
    tone: 'Analytical, evidence-based, cautious',
    purpose: 'Analyze a user\'s AI system against regulations using system context'
  },
  ACTION: {
    label: 'Action',
    description: 'Recommend next steps inside the platform',
    usesSystemData: true,
    tone: 'Short, actionable, step-by-step',
    purpose: 'Recommend next steps inside the platform using workflows and system metadata'
  }
};

/**
 * Valid chatbot mode values
 */
export const VALID_MODES: ChatbotMode[] = ['EXPLAIN', 'SYSTEM_ANALYSIS', 'ACTION'];

/**
 * Default mode when intent classification fails
 */
export const DEFAULT_MODE: ChatbotMode = 'EXPLAIN';

/**
 * Mode aliases (non-breaking support for internal renaming)
 * SYSTEM_GUIDANCE is an alias for SYSTEM_ANALYSIS
 */
export const MODE_ALIASES: Record<string, ChatbotMode> = {
  'SYSTEM_GUIDANCE': 'SYSTEM_ANALYSIS',
  'SYSTEM_ANALYSIS': 'SYSTEM_ANALYSIS'
};

/**
 * Normalize mode name (handles aliases)
 */
export function normalizeMode(mode: string): ChatbotMode {
  const upperMode = mode.toUpperCase();
  return MODE_ALIASES[upperMode] || (VALID_MODES.includes(upperMode as ChatbotMode) ? upperMode as ChatbotMode : DEFAULT_MODE);
}

