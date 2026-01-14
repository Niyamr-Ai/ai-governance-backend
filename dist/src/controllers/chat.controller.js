"use strict";
/**
 * Chat API Controller
 *
 * POST /api/chat - Send a message to the AI Governance Copilot
 *
 * This endpoint:
 * 1. Accepts user message + page context
 * 2. Runs intent classification
 * 3. Routes to appropriate context provider
 * 4. Calls the appropriate prompt template
 * 5. Returns chatbot answer with detected mode
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatHandler = chatHandler;
const intent_classifier_1 = require("../../services/ai/chatbot/intent-classifier");
const context_providers_1 = require("../../services/ai/chatbot/context-providers");
const prompts_1 = require("../../services/ai/chatbot/prompts");
const tenant_isolation_1 = require("../../services/ai/chatbot/tenant-isolation");
const constants_1 = require("../../services/ai/chatbot/constants");
const openai_1 = require("openai");
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
 * Generate response using OpenAI
 */
async function generateResponse(prompt) {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            {
                role: 'system',
                content: 'You are a helpful AI Governance Copilot assistant.'
            },
            {
                role: 'user',
                content: prompt
            }
        ],
        temperature: 0.7,
        max_tokens: 1000
    });
    const response = completion.choices?.[0]?.message?.content;
    if (!response) {
        throw new Error('Failed to generate response from OpenAI');
    }
    return response;
}
/**
 * Extract suggested actions from response (simple heuristic)
 * Also converts secondary intents to suggested follow-up actions
 */
function extractSuggestedActions(response, mode, secondaryIntents) {
    // Disable suggested actions to prevent UI clutter
    // Users can ask follow-up questions naturally instead
    return [];
}
/**
 * POST /api/chat
 */
async function chatHandler(req, res) {
    try {
        // Check authentication
        const userId = req.user?.sub;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        // Parse request body
        const body = req.body;
        const { message, pageContext, conversationHistory, persona = 'internal' } = body;
        // Conversation Memory Policy:
        // - Conversations are NOT persisted by default
        // - Each request fetches system data fresh
        // - conversationHistory (if provided) is transient and not stored
        // - No automatic DB writes for chat history
        // Note: conversationHistory is available for future use but not currently used in prompts
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({ error: 'Message is required' });
        }
        if (!pageContext || !pageContext.pageType) {
            return res.status(400).json({ error: 'Page context is required' });
        }
        // TODO: Persona-based filtering (future)
        // Currently persona is accepted but not used in filtering
        // When implemented, this will filter responses based on persona type
        // (e.g., 'auditor' might see different information than 'internal')
        // Step 1: Classify intent
        const intentClassification = await (0, intent_classifier_1.classifyIntent)(message, pageContext);
        const primaryMode = (0, constants_1.normalizeMode)(intentClassification.mode);
        const secondaryIntents = intentClassification.allIntents?.slice(1); // All intents except primary
        // Step 2: Enforce tenant isolation for modes that require system access
        if (primaryMode === 'SYSTEM_ANALYSIS' || primaryMode === 'ACTION') {
            try {
                await (0, tenant_isolation_1.enforceTenantIsolation)(userId, pageContext.systemId, primaryMode);
            }
            catch (error) {
                return res.status(403).json({ error: error.message });
            }
        }
        // Step 3: Get context based on primary mode
        // CRITICAL: Only ONE mode is used per request - primary mode determines context and prompt
        let context;
        let confidenceLevel;
        switch (primaryMode) {
            case 'EXPLAIN':
                context = await (0, context_providers_1.getExplainContext)(message, pageContext);
                break;
            case 'SYSTEM_ANALYSIS':
                context = await (0, context_providers_1.getSystemAnalysisContext)(message, pageContext, userId);
                confidenceLevel = context.confidenceLevel;
                break;
            case 'ACTION':
                context = await (0, context_providers_1.getActionContext)(message, pageContext, userId);
                break;
            default:
                return res.status(500).json({ error: `Unknown mode: ${primaryMode}` });
        }
        // Step 4: Build prompt (using primary mode only)
        const prompt = (0, prompts_1.getPromptForMode)(primaryMode, message, context);
        // Step 5: Generate response
        console.log(`\n${'='.repeat(80)}`);
        console.log(`💬 [CHATBOT] ===== Chat Request Processing =====`);
        console.log(`${'='.repeat(80)}`);
        console.log(`📝 [CHATBOT] User Message: ${message}`);
        console.log(`🔍 [CHATBOT] Detected Mode: ${primaryMode}`);
        console.log(`📄 [CHATBOT] Page Context: ${JSON.stringify(pageContext, null, 2)}`);
        console.log(`👤 [CHATBOT] User ID: ${userId}`);
        console.log(`${'─'.repeat(80)}\n`);
        const answer = await generateResponse(prompt);
        console.log(`\n${'─'.repeat(80)}`);
        console.log(`✅ [CHATBOT] Response Generated Successfully`);
        console.log(`📊 [CHATBOT] Response Length: ${answer.length} characters`);
        console.log(`📋 [CHATBOT] Response Preview (first 200 chars):`);
        console.log(`   ${answer.substring(0, 200)}${answer.length > 200 ? '...' : ''}`);
        console.log(`\n📄 [CHATBOT] Full Response:`);
        console.log(`${'─'.repeat(80)}`);
        console.log(answer);
        console.log(`${'─'.repeat(80)}\n`);
        // Step 6: Extract suggested actions (includes secondary intents as follow-ups)
        const suggestedActions = extractSuggestedActions(answer, primaryMode, secondaryIntents);
        // Step 7: Build response
        // ONE response = ONE mode (primary mode)
        // Secondary intents appear only as suggestedActions
        const response = {
            answer,
            mode: primaryMode,
            suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined,
            confidenceLevel: confidenceLevel // Only for SYSTEM_ANALYSIS mode
        };
        console.log(`📤 [CHATBOT] Sending response to frontend`);
        console.log(`   Mode: ${response.mode}`);
        console.log(`   Suggested Actions: ${response.suggestedActions?.length || 0}`);
        console.log(`   Confidence Level: ${response.confidenceLevel || 'N/A'}`);
        console.log(`${'='.repeat(80)}\n`);
        return res.json(response);
    }
    catch (error) {
        console.error('Error in chat API:', error);
        return res.status(500).json({
            error: 'Failed to process chat message',
            details: error.message
        });
    }
}
//# sourceMappingURL=chat.controller.js.map