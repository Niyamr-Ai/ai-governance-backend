"use strict";
/**
 * Chatbot Constants
 *
 * Defines the three chatbot modes and their characteristics.
 * These modes determine how the chatbot behaves and what context it uses.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MODE_ALIASES = exports.DEFAULT_MODE = exports.VALID_MODES = exports.CHATBOT_MODES = void 0;
exports.normalizeMode = normalizeMode;
/**
 * Chatbot Modes
 *
 * EXPLAIN: Educational mode for explaining regulations, concepts, and platform behavior
 * SYSTEM_ANALYSIS: Analytical mode for analyzing user's AI system against regulations
 * ACTION: Actionable mode for recommending next steps within the platform
 */
exports.CHATBOT_MODES = {
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
exports.VALID_MODES = ['EXPLAIN', 'SYSTEM_ANALYSIS', 'ACTION'];
/**
 * Default mode when intent classification fails
 */
exports.DEFAULT_MODE = 'EXPLAIN';
/**
 * Mode aliases (non-breaking support for internal renaming)
 * SYSTEM_GUIDANCE is an alias for SYSTEM_ANALYSIS
 */
exports.MODE_ALIASES = {
    'SYSTEM_GUIDANCE': 'SYSTEM_ANALYSIS',
    'SYSTEM_ANALYSIS': 'SYSTEM_ANALYSIS'
};
/**
 * Normalize mode name (handles aliases)
 */
function normalizeMode(mode) {
    const upperMode = mode.toUpperCase();
    return exports.MODE_ALIASES[upperMode] || (exports.VALID_MODES.includes(upperMode) ? upperMode : exports.DEFAULT_MODE);
}
//# sourceMappingURL=constants.js.map