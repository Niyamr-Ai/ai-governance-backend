"use strict";
/**
 * Token Management Utilities
 *
 * Provides token counting and truncation utilities for managing prompt sizes
 * to stay within OpenAI model limits.
 *
 * Note: Token counting is approximate. OpenAI uses tiktoken library for exact counting,
 * but for our purposes, a rough estimate (1 token ≈ 4 characters) is sufficient.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MODEL_LIMITS = void 0;
exports.estimateTokens = estimateTokens;
exports.calculateHistoryTokenBudget = calculateHistoryTokenBudget;
exports.truncateHistoryToFitBudget = truncateHistoryToFitBudget;
exports.truncateHistoryText = truncateHistoryText;
/**
 * Rough token estimation: 1 token ≈ 4 characters for English text
 * This is a conservative estimate - actual tokens may be slightly less
 */
const TOKENS_PER_CHAR = 0.25; // 1 token per 4 chars
/**
 * Model context limits (in tokens)
 */
exports.MODEL_LIMITS = {
    'gpt-4o': {
        contextWindow: 128000, // 128k tokens
        maxOutputTokens: 1000, // As configured in chat.controller.ts
        // Reserve some tokens for system message and overhead
        reservedTokens: 500,
    }
};
/**
 * Estimate token count for a text string
 *
 * @param text - Text to count tokens for
 * @returns Estimated token count
 */
function estimateTokens(text) {
    if (!text)
        return 0;
    return Math.ceil(text.length * TOKENS_PER_CHAR);
}
/**
 * Calculate available token budget for conversation history
 *
 * @param model - Model name (default: 'gpt-4o')
 * @param basePromptTokens - Tokens used by base prompt (safety rules, mode instructions, context, etc.)
 * @param userMessageTokens - Tokens used by user message
 * @returns Available token budget for conversation history
 */
function calculateHistoryTokenBudget(model = 'gpt-4o', basePromptTokens, userMessageTokens) {
    const limits = exports.MODEL_LIMITS[model];
    const totalAvailable = limits.contextWindow - limits.maxOutputTokens - limits.reservedTokens;
    const usedByPrompt = basePromptTokens + userMessageTokens;
    const availableForHistory = totalAvailable - usedByPrompt;
    // Ensure we don't return negative budget
    return Math.max(0, availableForHistory);
}
/**
 * Truncate conversation history to fit within token budget
 * Prioritizes most recent conversations
 *
 * @param history - Array of chat history entries
 * @param tokenBudget - Maximum tokens allowed for history
 * @returns Truncated history array
 */
function truncateHistoryToFitBudget(history, tokenBudget) {
    if (tokenBudget <= 0) {
        return [];
    }
    const truncated = [];
    let currentTokens = 0;
    // Process from most recent to oldest (history is already in chronological order)
    for (let i = history.length - 1; i >= 0; i--) {
        const entry = history[i];
        const entryText = `User: ${entry.user_query}\nAssistant: ${entry.bot_response}`;
        const entryTokens = estimateTokens(entryText);
        if (currentTokens + entryTokens <= tokenBudget) {
            truncated.unshift(entry); // Add to beginning to maintain chronological order
            currentTokens += entryTokens;
        }
        else {
            // If even a single entry doesn't fit, try truncating the response
            const remainingBudget = tokenBudget - currentTokens;
            if (remainingBudget > 100) { // Only if we have meaningful budget left
                const truncatedEntry = truncateSingleEntry(entry, remainingBudget);
                if (truncatedEntry) {
                    truncated.unshift(truncatedEntry);
                }
            }
            break; // Stop once we exceed budget
        }
    }
    return truncated;
}
/**
 * Truncate a single conversation entry to fit token budget
 *
 * @param entry - Conversation entry
 * @param tokenBudget - Maximum tokens allowed
 * @returns Truncated entry or null if budget too small
 */
function truncateSingleEntry(entry, tokenBudget) {
    const userTokens = estimateTokens(entry.user_query);
    const minTokensNeeded = userTokens + 50; // User query + minimal response
    if (tokenBudget < minTokensNeeded) {
        return null; // Not enough budget even for minimal entry
    }
    // Keep full user query, truncate bot response
    const availableForResponse = tokenBudget - userTokens - 20; // Reserve for formatting
    const maxResponseChars = Math.floor(availableForResponse / TOKENS_PER_CHAR);
    let truncatedResponse = entry.bot_response;
    if (truncatedResponse.length > maxResponseChars) {
        truncatedResponse = truncatedResponse.substring(0, maxResponseChars - 50) + '...\n[Response truncated due to token limit]';
    }
    return {
        user_query: entry.user_query,
        bot_response: truncatedResponse
    };
}
/**
 * Truncate a formatted conversation history string to fit token budget
 *
 * @param historyText - Formatted conversation history string
 * @param tokenBudget - Maximum tokens allowed
 * @returns Truncated history string
 */
function truncateHistoryText(historyText, tokenBudget) {
    if (tokenBudget <= 0 || !historyText) {
        return '';
    }
    const currentTokens = estimateTokens(historyText);
    if (currentTokens <= tokenBudget) {
        return historyText; // Fits within budget
    }
    // Calculate max characters allowed
    const maxChars = Math.floor(tokenBudget / TOKENS_PER_CHAR);
    // Truncate and add indicator
    const truncated = historyText.substring(0, maxChars - 100);
    const lastNewline = truncated.lastIndexOf('\n');
    const finalTruncated = lastNewline > 0
        ? truncated.substring(0, lastNewline)
        : truncated;
    return finalTruncated + '\n\n[Previous conversation context truncated due to token limit]';
}
//# sourceMappingURL=token-utils.js.map