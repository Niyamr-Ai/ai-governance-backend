/**
 * Chat History Service
 * 
 * Manages conversation history storage and retrieval for the AI Governance Copilot.
 * 
 * Features:
 * - Stores user queries and bot responses in Supabase
 * - Indexes conversations to Pinecone for semantic search
 * - Retrieves conversation history for context (last 3 messages by default)
 * - Supports session management (multiple conversation sessions per org)
 * - Tenant isolation via org_id
 * - System association for report-related conversations
 * 
 * Based on doc-intel-backend implementation, adapted for ai-governance architecture.
 */

import { supabaseAdmin } from '../../../src/lib/supabase';
import type { ChatbotMode, PageContext } from '../../../types/chatbot';
import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAI } from 'openai';
import { getChatHistoryContextString } from '../chat-history-rag-service';
import { estimateTokens, truncateHistoryText, truncateHistoryToFitBudget } from './token-utils';

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const OPEN_AI_KEY = process.env.OPEN_AI_KEY;

// Initialize Pinecone and OpenAI clients for indexing
let pinecone: Pinecone | null = null;
let openai: OpenAI | null = null;

if (PINECONE_API_KEY) {
  pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });
}

if (OPEN_AI_KEY) {
  openai = new OpenAI({ apiKey: OPEN_AI_KEY });
}

const CHAT_HISTORY_INDEX_NAME = 'chat-history';

/**
 * Generate embedding for chat history indexing
 */
async function generateEmbedding(text: string): Promise<number[]> {
  if (!openai) {
    throw new Error('OpenAI client not initialized - missing OPEN_AI_KEY');
  }

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  return response.data[0].embedding;
}

/**
 * Index chat history to Pinecone for semantic search
 */
async function indexChatHistoryToPinecone(
  chatId: string,
  orgId: string,
  sessionId: string,
  userQuery: string,
  botResponse: string,
  systemId?: string,
  chatbotMode?: ChatbotMode
): Promise<void> {
  if (!pinecone || !openai) {
    console.warn('[CHAT HISTORY] ⚠️ Pinecone/OpenAI not initialized, skipping indexing');
    return;
  }

  try {
    // Combine user query and bot response for better semantic search
    const combinedText = `User: ${userQuery}\nAssistant: ${botResponse}`;
    
    // Generate embedding
    const embedding = await generateEmbedding(combinedText);

    // Prepare metadata
    const metadata: any = {
      org_id: orgId,
      session_id: sessionId,
      user_query: userQuery,
      bot_response: botResponse,
      created_at: new Date().toISOString(),
    };

    if (systemId) {
      metadata.system_id = systemId;
    }

    if (chatbotMode) {
      metadata.chatbot_mode = chatbotMode;
    }

    // Upsert to Pinecone
    const index = pinecone.index(CHAT_HISTORY_INDEX_NAME);
    const vectorId = `chat-${chatId}`;
    
    console.log(`[CHAT HISTORY] ===== INDEXING TO PINECONE =====`);
    console.log(`[CHAT HISTORY] Index: ${CHAT_HISTORY_INDEX_NAME}`);
    console.log(`[CHAT HISTORY] Vector ID: ${vectorId}`);
    console.log(`[CHAT HISTORY] Metadata: ${JSON.stringify(metadata, null, 2)}`);
    console.log(`[CHAT HISTORY] Embedding dimension: ${embedding.length}`);
    
    await index.upsert([{
      id: vectorId,
      values: embedding,
      metadata: metadata,
    }]);

    console.log(`[CHAT HISTORY] ✅ Successfully indexed chat ${chatId} to Pinecone`);
    console.log(`[CHAT HISTORY] ===== END INDEXING =====\n`);
  } catch (error: any) {
    console.error('[CHAT HISTORY] ❌ Failed to index chat to Pinecone:', error.message);
    // Don't throw - indexing failure shouldn't break chat logging
  }
}

export interface ChatHistoryEntry {
  id: string;
  org_id: string;
  session_id: string;
  session_title?: string;
  system_id?: string;
  user_query: string;
  bot_response: string;
  chatbot_mode?: ChatbotMode;
  page_context?: PageContext;
  user_id?: string;
  created_at: string;
}

export interface LogChatHistoryParams {
  orgId: string;
  userQuery: string;
  botResponse: string;
  sessionId?: string;
  sessionTitle?: string;
  systemId?: string;
  chatbotMode?: ChatbotMode;
  pageContext?: PageContext;
  userId?: string;
}

/**
 * Log a chat conversation to Supabase
 * 
 * @param params - Chat history parameters
 * @returns Promise<void>
 */
export async function logChatHistory(params: LogChatHistoryParams): Promise<void> {
  const {
    orgId,
    userQuery,
    botResponse,
    sessionId = 'default',
    sessionTitle,
    systemId,
    chatbotMode,
    pageContext,
    userId
  } = params;

  if (!orgId) {
    console.error('[CHAT HISTORY] ❌ Cannot log chat: orgId is required');
    return;
  }

  if (!userQuery || !botResponse) {
    console.error('[CHAT HISTORY] ❌ Cannot log chat: userQuery and botResponse are required');
    return;
  }

  const supabase = supabaseAdmin;

  const data: any = {
    org_id: orgId,
    session_id: sessionId,
    user_query: userQuery,
    bot_response: botResponse,
    created_at: new Date().toISOString()
  };

  if (sessionTitle) {
    data.session_title = sessionTitle;
  }

  if (systemId) {
    data.system_id = systemId;
  }

  if (chatbotMode) {
    data.chatbot_mode = chatbotMode;
  }

  if (pageContext) {
    data.page_context = pageContext;
  }

  if (userId) {
    data.user_id = userId;
  }

  try {
    console.log(`[CHAT HISTORY] 📝 Logging chat for org ${orgId}, session ${sessionId}`);
    console.log(`[CHAT HISTORY]    Query: ${userQuery.substring(0, 100)}${userQuery.length > 100 ? '...' : ''}`);
    console.log(`[CHAT HISTORY]    Response: ${botResponse.substring(0, 100)}${botResponse.length > 100 ? '...' : ''}`);
    console.log(`[CHAT HISTORY]    Mode: ${chatbotMode || 'N/A'}`);
    console.log(`[CHAT HISTORY]    System ID: ${systemId || 'N/A'}`);

    const { data: insertedData, error } = await supabase
      .from('chat_history')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('[CHAT HISTORY] ❌ Failed to log chat:', error);
      throw error;
    }

    console.log('[CHAT HISTORY] ✅ Chat logged successfully');

    // Index to Pinecone for semantic search (non-blocking)
    if (insertedData?.id) {
      indexChatHistoryToPinecone(
        insertedData.id,
        orgId,
        sessionId,
        userQuery,
        botResponse,
        systemId,
        chatbotMode
      ).catch((err) => {
        console.error('[CHAT HISTORY] ⚠️ Failed to index chat (non-critical):', err);
      });
    }
  } catch (error: any) {
    console.error('[CHAT HISTORY] ❌ Critical failure logging chat:', error);
    // Don't throw - chat logging failure shouldn't break the chat flow
  }
}

/**
 * Get chat history for an organization and session
 * 
 * @param orgId - Organization ID (required for tenant isolation)
 * @param sessionId - Session ID (optional, defaults to 'default')
 * @param systemId - Optional system ID filter
 * @param limit - Number of recent messages to return (default: 3)
 * @returns Promise<ChatHistoryEntry[]>
 */
export async function getChatHistory(
  orgId: string,
  sessionId?: string,
  systemId?: string,
  limit: number = 3
): Promise<ChatHistoryEntry[]> {
  if (!orgId) {
    console.error('[CHAT HISTORY] ❌ Cannot get chat history: orgId is required');
    return [];
  }

  const supabase = supabaseAdmin;

  try {
    console.log(`[CHAT HISTORY] 🔍 Fetching chat history for org ${orgId}`);
    console.log(`[CHAT HISTORY]    Session ID: ${sessionId || 'default'}`);
    console.log(`[CHAT HISTORY]    System ID: ${systemId || 'N/A'}`);
    console.log(`[CHAT HISTORY]    Limit: ${limit}`);

    // Strategy: Smart context retrieval based on whether we're asking about a specific system
    // - If systemId is provided: Prioritize system-specific conversations
    //   If no system-specific conversations exist, get recent general conversations (but limit to avoid confusion)
    // - If no systemId: Get most recent conversations (general context)
    let query = supabase
      .from('chat_history')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    let history: ChatHistoryEntry[] = [];

    if (systemId) {
      // On a system page: Only get system-specific conversations
      // Don't include general conversations to avoid topic confusion
      // The bot should focus on the CURRENT system context from the page
      console.log(`[CHAT HISTORY] 🔍 System page detected (system: ${systemId}), fetching ONLY system-specific conversations...`);
      
      const systemQuery = query.eq('system_id', systemId).limit(limit);
      const { data: systemData, error: systemError } = await systemQuery;

      if (!systemError && systemData && systemData.length > 0) {
        // Found system-specific conversations - use those
        history = systemData as ChatHistoryEntry[];
        console.log(`[CHAT HISTORY] ✅ Found ${history.length} system-specific conversation(s) for system ${systemId}`);
      } else {
        // No system-specific conversations - return empty to let bot focus on current system context
        console.log(`[CHAT HISTORY] ℹ️ No system-specific conversations found. Excluding general conversations to avoid topic confusion.`);
        console.log(`[CHAT HISTORY]    Bot will focus on current system context from page instead.`);
        history = [];
      }
    } else {
      // On dashboard/general page: Get most recent GENERAL conversations only
      // Exclude system-specific conversations to avoid mixing contexts
      // When asking general questions, we don't want system-specific context
      console.log(`[CHAT HISTORY] 🔍 Dashboard detected, fetching ONLY general conversations (excluding system-specific)...`);
      
      const generalQuery = query
        .is('system_id', null) // Only get conversations without system_id
        .limit(limit);
      
      const { data, error } = await generalQuery;
      
      if (error) {
        console.error('[CHAT HISTORY] ❌ Failed to get chat history:', error);
        return await getFallbackHistory(orgId, sessionId, limit);
      }
      
      history = (data || []) as ChatHistoryEntry[];
      
      if (history.length === 0) {
        console.log(`[CHAT HISTORY] ℹ️ No general conversation history found (this is a new general conversation)`);
      } else {
        console.log(`[CHAT HISTORY] ✅ Retrieved ${history.length} general conversation(s) (system-specific conversations excluded)`);
      }
    }

    // Reverse to get chronological order (oldest first)
    const reversedHistory = history.reverse();
    
    console.log(`[CHAT HISTORY] ✅ Retrieved ${reversedHistory.length} chat history entries`);
    if (reversedHistory.length > 0) {
      console.log(`[CHAT HISTORY]    Oldest: ${reversedHistory[0].created_at}`);
      console.log(`[CHAT HISTORY]    Newest: ${reversedHistory[reversedHistory.length - 1].created_at}`);
    }

    return reversedHistory;
  } catch (error: any) {
    console.error('[CHAT HISTORY] ❌ Exception getting chat history:', error);
    return [];
  }
}

/**
 * Fallback function to get chat history without filters
 */
async function getFallbackHistory(
  orgId: string,
  sessionId?: string,
  limit: number = 3
): Promise<ChatHistoryEntry[]> {
  const supabase = supabaseAdmin;
  
  try {
    console.log('[CHAT HISTORY] ⚠️ Retrying without filters...');
    let fallbackQuery = supabase
      .from('chat_history')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (sessionId) {
      fallbackQuery = fallbackQuery.eq('session_id', sessionId);
    }

    const { data: fallbackData, error: fallbackError } = await fallbackQuery;

    if (fallbackError) {
      console.error('[CHAT HISTORY] ❌ Fallback query also failed:', fallbackError);
      return [];
    }

    const history = (fallbackData || []) as ChatHistoryEntry[];
    console.log(`[CHAT HISTORY] ✅ Retrieved ${history.length} chat history entries (fallback)`);
    return history.reverse(); // Reverse to get chronological order
  } catch (e) {
    console.error('[CHAT HISTORY] ❌ Fallback query exception:', e);
    return [];
  }
}

/**
 * Detect if user query is asking about past conversations (needs semantic search)
 */
function needsSemanticSearch(userQuery: string): boolean {
  const query = userQuery.toLowerCase();
  const semanticKeywords = [
    'what did we discuss',
    'what did we talk about',
    'what did i ask',
    'earlier',
    'before',
    'previous',
    'past conversation',
    'remember',
    'mentioned',
    'discussed',
    'talked about',
    'asked about',
    'told you',
    'explained',
    'summarize what',
    'recall',
    'remind me'
  ];
  
  return semanticKeywords.some(keyword => query.includes(keyword));
}

/**
 * Get recent chat history formatted for prompt inclusion
 * Uses hybrid approach: SQL for recent messages + RAG for semantic search when needed
 * Automatically truncates to fit within token budget
 * 
 * @param orgId - Organization ID
 * @param sessionId - Session ID (optional)
 * @param systemId - Optional system ID filter
 * @param limit - Number of recent messages (default: 3)
 * @param userQuery - Current user query (for semantic search detection)
 * @param tokenBudget - Maximum tokens allowed for history (optional, will use all available if not provided)
 * @returns Promise<string> - Formatted conversation history string (truncated if needed)
 */
export async function getFormattedChatHistory(
  orgId: string,
  sessionId?: string,
  systemId?: string,
  limit: number = 3,
  userQuery?: string,
  tokenBudget?: number
): Promise<string> {
  const sessionIdToUse = sessionId || 'default';
  
  // Check if semantic search is needed
  const useSemanticSearch = userQuery && needsSemanticSearch(userQuery);
  
  if (useSemanticSearch) {
    console.log(`[CHAT HISTORY] 🔍 Semantic search detected - using RAG for chat history retrieval`);
    try {
      // Use RAG for semantic search over chat history
      const ragContext = await getChatHistoryContextString(
        userQuery,
        orgId,
        sessionIdToUse,
        limit, // topK
        systemId
      );
      
      if (ragContext && ragContext !== 'No relevant chat history found.') {
        console.log(`[CHAT HISTORY] ✅ Retrieved semantic chat history via RAG`);
        let formattedHistory = `\n\n=== RELEVANT PREVIOUS CONVERSATION CONTEXT (Semantic Search) ===\n${ragContext}\n=== END OF RELEVANT CONVERSATION CONTEXT ===\n\n`;
        
        // Apply token budget if provided
        if (tokenBudget !== undefined) {
          const historyTokens = estimateTokens(formattedHistory);
          console.log(`[CHAT HISTORY] 📊 Semantic history tokens: ${historyTokens} / budget: ${tokenBudget}`);
          if (historyTokens > tokenBudget) {
            formattedHistory = truncateHistoryText(formattedHistory, tokenBudget);
            console.log(`[CHAT HISTORY] ✂️ Truncated semantic history to fit token budget`);
          }
        }
        
        return formattedHistory;
      } else {
        console.log(`[CHAT HISTORY] ℹ️ No relevant semantic matches found, falling back to SQL`);
        // Fall through to SQL retrieval
      }
    } catch (error: any) {
      console.error(`[CHAT HISTORY] ⚠️ RAG search failed, falling back to SQL:`, error.message);
      // Fall through to SQL retrieval
    }
  }
  
  // Default: Use SQL for chronological recent messages
  console.log(`[CHAT HISTORY] 📋 Using SQL retrieval for chronological chat history`);
  let history = await getChatHistory(orgId, sessionIdToUse, systemId, limit);

  if (history.length === 0) {
    return '';
  }

  // Apply token budget truncation if provided
  if (tokenBudget !== undefined && tokenBudget > 0) {
    const historyTokens = estimateTokens(
      history.map(e => `User: ${e.user_query}\nAssistant: ${e.bot_response}`).join('\n\n')
    );
    console.log(`[CHAT HISTORY] 📊 SQL history tokens: ${historyTokens} / budget: ${tokenBudget}`);
    
    if (historyTokens > tokenBudget) {
      const originalLength = history.length;
      // Convert to simple format for truncation (maintains order)
      const simpleHistory = history.map(e => ({ user_query: e.user_query, bot_response: e.bot_response }));
      const truncatedSimple = truncateHistoryToFitBudget(simpleHistory, tokenBudget);
      
      // Map back: keep only entries that match truncated results (in order)
      // Since truncation maintains order, we can use index matching
      const truncatedHistory: ChatHistoryEntry[] = [];
      for (let i = 0; i < truncatedSimple.length && i < history.length; i++) {
        const truncatedEntry = truncatedSimple[i];
        const originalEntry = history[i];
        // Update bot_response if it was truncated
        if (originalEntry.user_query === truncatedEntry.user_query) {
          truncatedHistory.push({
            ...originalEntry,
            bot_response: truncatedEntry.bot_response
          });
        }
      }
      history = truncatedHistory;
      console.log(`[CHAT HISTORY] ✂️ Truncated SQL history from ${originalLength} to ${history.length} entries to fit token budget`);
    }
  }

  const formatted = history.map((entry, index) => {
    return `Previous Conversation ${index + 1}:
User: ${entry.user_query}
Assistant: ${entry.bot_response}`;
  }).join('\n\n');

  return `\n\n=== PREVIOUS CONVERSATION CONTEXT (Last ${history.length} messages) ===\n${formatted}\n=== END OF PREVIOUS CONVERSATION CONTEXT ===\n\n`;
}

/**
 * Get or generate session title
 * If session has no title, generates one from the first user query
 * 
 * @param orgId - Organization ID
 * @param sessionId - Session ID
 * @returns Promise<string | null>
 */
export async function getSessionTitle(
  orgId: string,
  sessionId: string
): Promise<string | null> {
  if (!orgId || !sessionId) {
    return null;
  }

  const supabase = supabaseAdmin;

  try {
    const { data, error } = await supabase
      .from('chat_history')
      .select('session_title')
      .eq('org_id', orgId)
      .eq('session_id', sessionId)
      .not('session_title', 'is', null)
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return data.session_title || null;
  } catch (error) {
    console.error('[CHAT HISTORY] ❌ Error getting session title:', error);
    return null;
  }
}

