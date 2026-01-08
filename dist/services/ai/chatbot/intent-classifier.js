"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyIntent = classifyIntent;
const openai_1 = require("openai");
const constants_1 = require("./constants");
/**
 * Get OpenAI client
 */
function getOpenAIClient() {
    const key = process.env.OPEN_AI_KEY;
    if (!key) {
        throw new Error('OPEN_AI_KEY is missing');
    }
    return new openai_1.OpenAI({ apiKey: key });
}
/**
 * Classify user intent into a chatbot mode
 *
 * @param userMessage - The user's message
 * @param pageContext - Current page context (page type, systemId, etc.)
 * @returns IntentClassification with the detected mode
 */
async function classifyIntent(userMessage, pageContext) {
    try {
        const openai = getOpenAIClient();
        // Build context description for the classifier
        const contextDescription = buildContextDescription(pageContext);
        const classificationPrompt = `You are an intent classifier for an AI Governance platform chatbot.

Your task is to classify the user's message into one or more modes (in priority order):

1. EXPLAIN - User wants to understand regulations, concepts, or how the platform works. Educational questions like "What is the EU AI Act?", "How does risk assessment work?", "Explain transparency requirements".

2. SYSTEM_ANALYSIS - User wants to analyze their specific AI system against regulations. Questions like "Is my system compliant?", "What are the risks for this system?", "How does my system compare to regulations?". Requires system data.

3. ACTION - User wants actionable next steps or recommendations within the platform. Questions like "What should I do next?", "How do I complete this task?", "What are my pending actions?". Requires platform workflows.

Current page context:
${contextDescription}

User message: "${userMessage}"

If the message contains multiple intents, return them as a comma-separated list in priority order (e.g., "SYSTEM_ANALYSIS,ACTION").
If only one intent, return just that mode (e.g., "EXPLAIN").
Return ONLY the mode label(s). No explanation, no JSON, just the mode name(s).`;
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini', // Using cheaper model for classification
            messages: [
                {
                    role: 'system',
                    content: 'You are a precise intent classifier. Return only the mode label.'
                },
                {
                    role: 'user',
                    content: classificationPrompt
                }
            ],
            temperature: 0.1, // Low temperature for consistent classification
            max_tokens: 10 // Only need the mode name
        });
        const response = completion.choices?.[0]?.message?.content?.trim().toUpperCase();
        if (!response) {
            console.warn('Empty classification result, defaulting to', constants_1.DEFAULT_MODE);
            return { mode: constants_1.DEFAULT_MODE };
        }
        // Parse comma-separated intents (if multiple)
        const detectedIntents = response
            .split(',')
            .map(intent => intent.trim())
            .filter(intent => intent.length > 0)
            .map(intent => (0, constants_1.normalizeMode)(intent))
            .filter((mode, index, arr) => arr.indexOf(mode) === index); // Remove duplicates
        // Validate intents
        const validIntents = detectedIntents.filter(intent => constants_1.VALID_MODES.includes(intent));
        if (validIntents.length === 0) {
            console.warn(`No valid intents found in: ${response}, defaulting to ${constants_1.DEFAULT_MODE}`);
            return { mode: constants_1.DEFAULT_MODE };
        }
        // Primary mode is the first intent
        const primaryMode = validIntents[0];
        // Return primary mode and all intents (for secondary intent handling)
        return {
            mode: primaryMode,
            allIntents: validIntents.length > 1 ? validIntents : undefined
        };
    }
    catch (error) {
        console.error('Error classifying intent:', error);
        // Return default mode on error
        return { mode: constants_1.DEFAULT_MODE };
    }
}
/**
 * Build a description of the current page context for the classifier
 */
function buildContextDescription(context) {
    const parts = [];
    parts.push(`Page type: ${context.pageType}`);
    if (context.systemId) {
        parts.push(`Viewing AI system: ${context.systemId}`);
    }
    if (context.orgId) {
        parts.push(`Organization: ${context.orgId}`);
    }
    // Add hints based on page type
    switch (context.pageType) {
        case 'ai-system':
            parts.push('User is on an AI system detail page - SYSTEM_ANALYSIS or ACTION modes are likely');
            break;
        case 'dashboard':
            parts.push('User is on dashboard - ACTION mode is likely for next steps');
            break;
        case 'compliance':
            parts.push('User is on compliance page - EXPLAIN or SYSTEM_ANALYSIS modes are likely');
            break;
        case 'assessment':
            parts.push('User is on assessment page - EXPLAIN mode is likely');
            break;
    }
    return parts.join('\n');
}
//# sourceMappingURL=intent-classifier.js.map