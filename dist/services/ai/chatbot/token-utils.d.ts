/**
 * Token Management Utilities
 *
 * Provides token counting and truncation utilities for managing prompt sizes
 * to stay within OpenAI model limits.
 *
 * Note: Token counting is approximate. OpenAI uses tiktoken library for exact counting,
 * but for our purposes, a rough estimate (1 token ≈ 4 characters) is sufficient.
 */
/**
 * Model context limits (in tokens)
 */
export declare const MODEL_LIMITS: {
    readonly 'gpt-4o': {
        readonly contextWindow: 128000;
        readonly maxOutputTokens: 1000;
        readonly reservedTokens: 500;
    };
};
/**
 * Estimate token count for a text string
 *
 * @param text - Text to count tokens for
 * @returns Estimated token count
 */
export declare function estimateTokens(text: string): number;
/**
 * Calculate available token budget for conversation history
 *
 * @param model - Model name (default: 'gpt-4o')
 * @param basePromptTokens - Tokens used by base prompt (safety rules, mode instructions, context, etc.)
 * @param userMessageTokens - Tokens used by user message
 * @returns Available token budget for conversation history
 */
export declare function calculateHistoryTokenBudget(model: keyof typeof MODEL_LIMITS | undefined, basePromptTokens: number, userMessageTokens: number): number;
/**
 * Truncate conversation history to fit within token budget
 * Prioritizes most recent conversations
 *
 * @param history - Array of chat history entries
 * @param tokenBudget - Maximum tokens allowed for history
 * @returns Truncated history array
 */
export declare function truncateHistoryToFitBudget(history: Array<{
    user_query: string;
    bot_response: string;
}>, tokenBudget: number): Array<{
    user_query: string;
    bot_response: string;
}>;
/**
 * Truncate a formatted conversation history string to fit token budget
 *
 * @param historyText - Formatted conversation history string
 * @param tokenBudget - Maximum tokens allowed
 * @returns Truncated history string
 */
export declare function truncateHistoryText(historyText: string, tokenBudget: number): string;
//# sourceMappingURL=token-utils.d.ts.map