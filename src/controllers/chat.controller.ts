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
  try {
    // Check authentication
    const userId = req.user?.sub;
if (!userId) {
  return res.status(401).json({ message: "Unauthorized" });
}
    // Parse request body
    const body: ChatRequest = req.body;
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
    const intentClassification = await classifyIntent(message, pageContext);
    const primaryMode = normalizeMode(intentClassification.mode);
    const secondaryIntents = intentClassification.allIntents?.slice(1); // All intents except primary

    // Step 2: Enforce tenant isolation for modes that require system access
    if (primaryMode === 'SYSTEM_ANALYSIS' || primaryMode === 'ACTION') {
      try {
        await enforceTenantIsolation(userId, pageContext.systemId, primaryMode);
      } catch (error: any) {
        return res.status(403).json({ error: error.message });
      }
    }

    // Step 3: Get context based on primary mode
    // CRITICAL: Only ONE mode is used per request - primary mode determines context and prompt
    let context;
    let confidenceLevel: 'high' | 'medium' | 'low' | undefined;

    switch (primaryMode) {
      case 'EXPLAIN':
        context = await getExplainContext(message, pageContext);
        break;
      case 'SYSTEM_ANALYSIS':
        context = await getSystemAnalysisContext(message, pageContext, userId);
        confidenceLevel = (context as any).confidenceLevel;
        break;
      case 'ACTION':
        context = await getActionContext(message, pageContext, userId);
        break;
      default:
        return res.status(500).json({ error: `Unknown mode: ${primaryMode}` });
    }

    // Step 4: Build prompt (using primary mode only)
    const prompt = getPromptForMode(primaryMode, message, context);

    // Step 5: Generate response
    const answer = await generateResponse(prompt);

    // Step 6: Extract suggested actions (includes secondary intents as follow-ups)
    const suggestedActions = extractSuggestedActions(answer, primaryMode, secondaryIntents);

    // Step 7: Build response
    // ONE response = ONE mode (primary mode)
    // Secondary intents appear only as suggestedActions
    const response: ChatResponse = {
      answer,
      mode: primaryMode,
      suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined,
      confidenceLevel: confidenceLevel // Only for SYSTEM_ANALYSIS mode
    };

    return res.json(response);
  } catch (error: any) {
    console.error('Error in chat API:', error);
    return res.status(500).json({
      error: 'Failed to process chat message',
      details: error.message
    });
  }
}
