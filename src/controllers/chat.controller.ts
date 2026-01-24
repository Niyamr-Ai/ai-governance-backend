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

import { Request, Response } from 'express';
import { classifyIntent } from '../../services/ai/chatbot/intent-classifier';
import {
  getExplainContext,
  getSystemAnalysisContext,
  getActionContext
} from '../../services/ai/chatbot/context-providers';
import { getPromptForMode } from '../../services/ai/chatbot/prompts';
import { enforceTenantIsolation } from '../../services/ai/chatbot/tenant-isolation';
import { normalizeMode } from '../../services/ai/chatbot/constants';
import { OpenAI } from 'openai';
import type {
  ChatRequest,
  ChatResponse,
  ChatbotMode,
  PageContext
} from '../../types/chatbot';
import {
  logChatHistory,
  getFormattedChatHistory
} from '../../services/ai/chatbot/chat-history-service';
import { estimateTokens, calculateHistoryTokenBudget, MODEL_LIMITS, truncateHistoryText } from '../../services/ai/chatbot/token-utils';

/**
 * Get OpenAI client
 */
function getOpenAIClient(): OpenAI {
  const key = process.env.OPEN_AI_KEY;
  if (!key) {
    throw new Error('OPEN_AI_KEY is missing');
  }
  return new OpenAI({ apiKey: key });
}

/**
 * Generate response using OpenAI
 */
async function generateResponse(prompt: string): Promise<string> {
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
function extractSuggestedActions(
  response: string,
  mode: ChatbotMode,
  secondaryIntents?: ChatbotMode[]
): string[] {
  // Disable suggested actions to prevent UI clutter
  // Users can ask follow-up questions naturally instead
  return [];
}

/**
 * POST /api/chat
 */
export async function chatHandler(req: Request, res: Response) {
  const startTime = Date.now();
  
  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`💬 [CHATBOT] ===== NEW CHAT REQUEST =====`);
    console.log(`${'='.repeat(80)}`);
    console.log(`⏰ [CHATBOT] Timestamp: ${new Date().toISOString()}`);

    // Check authentication
    const userId = req.user?.sub;
    if (!userId) {
      console.error('[CHATBOT] ❌ Unauthorized: No user ID found');
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    console.log(`👤 [CHATBOT] User ID: ${userId}`);

    // Parse request body
    const body: ChatRequest = req.body;
    const { message, pageContext, conversationHistory, persona = 'internal', sessionId } = body;

    console.log(`📝 [CHATBOT] User Message: ${message}`);
    console.log(`📄 [CHATBOT] Page Context: ${JSON.stringify(pageContext, null, 2)}`);
    console.log(`🎭 [CHATBOT] Persona: ${persona}`);
    console.log(`💬 [CHATBOT] Session ID: ${sessionId || 'default'}`);

    // Determine org_id: Use pageContext.orgId if available, otherwise use userId (1:1 mapping for now)
    const orgId = pageContext?.orgId || userId;
    console.log(`🏢 [CHATBOT] Organization ID: ${orgId} (${pageContext?.orgId ? 'from pageContext' : 'from userId'})`);

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      console.error('[CHATBOT] ❌ Bad Request: Message is required');
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!pageContext || !pageContext.pageType) {
      console.error('[CHATBOT] ❌ Bad Request: Page context is required');
      return res.status(400).json({ error: 'Page context is required' });
    }

    // TODO: Persona-based filtering (future)
    // Currently persona is accepted but not used in filtering
    // When implemented, this will filter responses based on persona type
    // (e.g., 'auditor' might see different information than 'internal')

    // Step 0: Fetch conversation history for context
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`📚 [CHATBOT] Fetching conversation history...`);
    const sessionIdToUse = sessionId || 'default';
    const systemIdForHistory = pageContext?.systemId;
    
    // Step 0.5: Get context first to calculate token budget accurately
    // (We'll recalculate after getting context, but for now use a conservative estimate)
    const userMessageTokens = estimateTokens(message);
    const estimatedBasePromptTokens = 2000; // Conservative estimate for base prompt
    const historyTokenBudget = calculateHistoryTokenBudget('gpt-4o', estimatedBasePromptTokens, userMessageTokens);
    
    console.log(`📊 [CHATBOT] Token budget calculation:`);
    console.log(`   User message: ~${userMessageTokens} tokens`);
    console.log(`   Estimated base prompt: ~${estimatedBasePromptTokens} tokens`);
    console.log(`   Available for history: ~${historyTokenBudget} tokens`);
    
    // Pass user message to enable semantic search when needed
    const conversationHistoryText = await getFormattedChatHistory(
      orgId,
      sessionIdToUse,
      systemIdForHistory,
      3, // Last 3 messages
      message, // User query for semantic search detection
      historyTokenBudget // Token budget for truncation
    );
    
    if (conversationHistoryText) {
      const historyTokens = estimateTokens(conversationHistoryText);
      console.log(`✅ [CHATBOT] Retrieved conversation history (${historyTokens} tokens)`);
      console.log(`📖 [CHATBOT] History preview: ${conversationHistoryText.substring(0, 200)}...`);
    } else {
      console.log(`ℹ️  [CHATBOT] No previous conversation history found (this is a new conversation)`);
    }

    // Step 1: Classify intent
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`🔍 [CHATBOT] Classifying intent...`);
    const intentClassification = await classifyIntent(message, pageContext);
    const primaryMode = normalizeMode(intentClassification.mode);
    const secondaryIntents = intentClassification.allIntents?.slice(1); // All intents except primary
    console.log(`✅ [CHATBOT] Intent classified: ${primaryMode}`);
    if (secondaryIntents && secondaryIntents.length > 0) {
      console.log(`   Secondary intents: ${secondaryIntents.join(', ')}`);
    }

    // Step 2: Enforce tenant isolation for modes that require system access
    if (primaryMode === 'SYSTEM_ANALYSIS' || primaryMode === 'ACTION') {
      console.log(`🔒 [CHATBOT] Enforcing tenant isolation for ${primaryMode} mode...`);
      try {
        await enforceTenantIsolation(userId, pageContext.systemId, primaryMode);
        console.log(`✅ [CHATBOT] Tenant isolation verified`);
      } catch (error: any) {
        console.error(`❌ [CHATBOT] Tenant isolation failed: ${error.message}`);
        return res.status(403).json({ error: error.message });
      }
    }

    // Step 3: Get context based on primary mode
    // CRITICAL: Only ONE mode is used per request - primary mode determines context and prompt
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`📊 [CHATBOT] Fetching context for ${primaryMode} mode...`);
    let context;
    let confidenceLevel: 'high' | 'medium' | 'low' | undefined;

    switch (primaryMode) {
      case 'EXPLAIN':
        context = await getExplainContext(message, pageContext);
        console.log(`✅ [CHATBOT] Explain context retrieved`);
        break;
      case 'SYSTEM_ANALYSIS':
        context = await getSystemAnalysisContext(message, pageContext, userId);
        confidenceLevel = (context as any).confidenceLevel;
        console.log(`✅ [CHATBOT] System analysis context retrieved (confidence: ${confidenceLevel})`);
        break;
      case 'ACTION':
        context = await getActionContext(message, pageContext, userId);
        console.log(`✅ [CHATBOT] Action context retrieved`);
        break;
      default:
        console.error(`❌ [CHATBOT] Unknown mode: ${primaryMode}`);
        return res.status(500).json({ error: `Unknown mode: ${primaryMode}` });
    }

    // Step 4: Build prompt (using primary mode only) with conversation history
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`📝 [CHATBOT] Building prompt with conversation history...`);
    
    // Recalculate token budget with actual context size
    const actualBasePromptTokens = estimateTokens(
      getPromptForMode(primaryMode, message, context, '') // Prompt without history
    );
    const actualHistoryTokenBudget = calculateHistoryTokenBudget('gpt-4o', actualBasePromptTokens, userMessageTokens);
    
    // If history exceeds budget, truncate it
    let finalHistoryText = conversationHistoryText;
    if (conversationHistoryText && actualHistoryTokenBudget > 0) {
      const currentHistoryTokens = estimateTokens(conversationHistoryText);
      if (currentHistoryTokens > actualHistoryTokenBudget) {
        console.log(`⚠️  [CHATBOT] History (${currentHistoryTokens} tokens) exceeds budget (${actualHistoryTokenBudget} tokens), truncating...`);
        finalHistoryText = truncateHistoryText(conversationHistoryText, actualHistoryTokenBudget);
        console.log(`✂️  [CHATBOT] Truncated history to ${estimateTokens(finalHistoryText)} tokens`);
      }
    }
    
    const prompt = getPromptForMode(primaryMode, message, context, finalHistoryText);
    const promptTokens = estimateTokens(prompt);
    const totalAvailableTokens = MODEL_LIMITS['gpt-4o'].contextWindow;
    const maxOutputTokens = MODEL_LIMITS['gpt-4o'].maxOutputTokens;
    const estimatedInputTokens = promptTokens;
    
    console.log(`✅ [CHATBOT] Prompt built (${prompt.length} characters, ~${promptTokens} tokens)`);
    console.log(`📊 [CHATBOT] Token usage:`);
    console.log(`   Input prompt: ~${estimatedInputTokens} tokens`);
    console.log(`   Max output: ${maxOutputTokens} tokens`);
    console.log(`   Total: ~${estimatedInputTokens + maxOutputTokens} / ${totalAvailableTokens} tokens`);
    
    if (estimatedInputTokens + maxOutputTokens > totalAvailableTokens) {
      console.warn(`⚠️  [CHATBOT] WARNING: Estimated token usage (${estimatedInputTokens + maxOutputTokens}) exceeds model limit (${totalAvailableTokens})`);
    }
    
    console.log(`📋 [CHATBOT] Prompt preview (first 300 chars):`);
    console.log(`   ${prompt.substring(0, 300)}${prompt.length > 300 ? '...' : ''}`);

    // Step 5: Generate response
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`🤖 [CHATBOT] Generating response with OpenAI...`);
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

    // Step 7: Log conversation history to Supabase
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`💾 [CHATBOT] Logging conversation to database...`);
    try {
      await logChatHistory({
        orgId,
        userQuery: message,
        botResponse: answer,
        sessionId: sessionIdToUse,
        systemId: pageContext?.systemId,
        chatbotMode: primaryMode,
        pageContext,
        userId
      });
      console.log(`✅ [CHATBOT] Conversation logged successfully`);
    } catch (error: any) {
      console.error(`⚠️  [CHATBOT] Failed to log conversation (non-critical): ${error.message}`);
      // Don't fail the request if logging fails
    }

    // Step 8: Build response
    // ONE response = ONE mode (primary mode)
    // Secondary intents appear only as suggestedActions
    const response: ChatResponse = {
      answer,
      mode: primaryMode,
      suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined,
      confidenceLevel: confidenceLevel // Only for SYSTEM_ANALYSIS mode
    };

    const processingTime = Date.now() - startTime;
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`📤 [CHATBOT] Sending response to frontend`);
    console.log(`   Mode: ${response.mode}`);
    console.log(`   Suggested Actions: ${response.suggestedActions?.length || 0}`);
    console.log(`   Confidence Level: ${response.confidenceLevel || 'N/A'}`);
    console.log(`   Processing Time: ${processingTime}ms`);
    console.log(`${'='.repeat(80)}`);
    console.log(`✅ [CHATBOT] Request completed successfully\n`);

    return res.json(response);
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error(`\n${'='.repeat(80)}`);
    console.error(`❌ [CHATBOT] Error in chat API`);
    console.error(`${'='.repeat(80)}`);
    console.error(`⏰ Processing Time: ${processingTime}ms`);
    console.error(`📝 Error Message: ${error.message}`);
    console.error(`📚 Error Stack: ${error.stack}`);
    console.error(`${'='.repeat(80)}\n`);
    
    return res.status(500).json({
      error: 'Failed to process chat message',
      details: error.message
    });
  }
}
