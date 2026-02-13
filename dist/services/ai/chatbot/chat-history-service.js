"use strict";
/**
 * Chat History Service
 *
 * Manages conversation history storage and retrieval for the AI Governance Copilot.
 *
 * Features:
 * - Stores user queries and bot responses in Supabase
 * - Indexes conversations to Pinecone for semantic search
 * - HYBRID RETRIEVAL: Combines SQL (recent messages) + Pinecone (semantic search of older conversations)
 * - Retrieves conversation history for context (last 3 messages from SQL + top 5 semantically relevant from Pinecone)
 * - Supports session management (multiple conversation sessions per org)
 * - Tenant isolation via org_id
 * - System association for report-related conversations
 * - Automatic deduplication of combined results
 * - Token budget management for combined history
 *
 * Based on doc-intel-backend implementation, adapted for ai-governance architecture.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logChatHistory = logChatHistory;
exports.getChatHistory = getChatHistory;
exports.getFormattedChatHistory = getFormattedChatHistory;
exports.getSessionTitle = getSessionTitle;
const supabase_1 = require("../../../src/lib/supabase");
const pinecone_1 = require("@pinecone-database/pinecone");
const openai_1 = require("openai");
const chat_history_rag_service_1 = require("../chat-history-rag-service");
const token_utils_1 = require("./token-utils");
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const OPEN_AI_KEY = process.env.OPEN_AI_KEY;
// Initialize Pinecone and OpenAI clients for indexing
let pinecone = null;
let openai = null;
if (PINECONE_API_KEY) {
    pinecone = new pinecone_1.Pinecone({ apiKey: PINECONE_API_KEY });
}
if (OPEN_AI_KEY) {
    openai = new openai_1.OpenAI({ apiKey: OPEN_AI_KEY });
}
const CHAT_HISTORY_INDEX_NAME = 'chat-history';
/**
 * Generate embedding for chat history indexing
 */
async function generateEmbedding(text) {
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
async function indexChatHistoryToPinecone(chatId, orgId, sessionId, userQuery, botResponse, systemId, chatbotMode) {
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
        const metadata = {
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
    }
    catch (error) {
        console.error('[CHAT HISTORY] ❌ Failed to index chat to Pinecone:', error.message);
        // Don't throw - indexing failure shouldn't break chat logging
    }
}
/**
 * Log a chat conversation to Supabase
 *
 * @param params - Chat history parameters
 * @returns Promise<void>
 */
async function logChatHistory(params) {
    const { orgId, userQuery, botResponse, sessionId = 'default', sessionTitle, systemId, chatbotMode, pageContext, userId } = params;
    if (!orgId) {
        console.error('[CHAT HISTORY] ❌ Cannot log chat: orgId is required');
        return;
    }
    if (!userQuery || !botResponse) {
        console.error('[CHAT HISTORY] ❌ Cannot log chat: userQuery and botResponse are required');
        return;
    }
    const supabase = supabase_1.supabaseAdmin;
    const data = {
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
            indexChatHistoryToPinecone(insertedData.id, orgId, sessionId, userQuery, botResponse, systemId, chatbotMode).catch((err) => {
                console.error('[CHAT HISTORY] ⚠️ Failed to index chat (non-critical):', err);
            });
        }
    }
    catch (error) {
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
async function getChatHistory(orgId, sessionId, systemId, limit = 3) {
    if (!orgId) {
        console.error('[CHAT HISTORY] ❌ Cannot get chat history: orgId is required');
        return [];
    }
    const supabase = supabase_1.supabaseAdmin;
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
        let history = [];
        if (systemId) {
            // On a system page: Only get system-specific conversations
            // Don't include general conversations to avoid topic confusion
            // The bot should focus on the CURRENT system context from the page
            console.log(`[CHAT HISTORY] 🔍 System page detected (system: ${systemId}), fetching ONLY system-specific conversations...`);
            const systemQuery = query.eq('system_id', systemId).limit(limit);
            const { data: systemData, error: systemError } = await systemQuery;
            if (!systemError && systemData && systemData.length > 0) {
                // Found system-specific conversations - use those
                history = systemData;
                console.log(`[CHAT HISTORY] ✅ Found ${history.length} system-specific conversation(s) for system ${systemId}`);
            }
            else {
                // No system-specific conversations - return empty to let bot focus on current system context
                console.log(`[CHAT HISTORY] ℹ️ No system-specific conversations found. Excluding general conversations to avoid topic confusion.`);
                console.log(`[CHAT HISTORY]    Bot will focus on current system context from page instead.`);
                history = [];
            }
        }
        else {
            // On dashboard/general page: Get most recent GENERAL conversations only
            // Exclude system-specific conversations to avoid mixing contexts
            // When asking general questions, we don't want system-specific context
            // IMPORTANT: Only include conversations from the last 24 hours to avoid bias from old conversations
            console.log(`[CHAT HISTORY] 🔍 Dashboard detected, fetching ONLY recent general conversations (excluding system-specific and old conversations)...`);
            const twentyFourHoursAgo = new Date();
            twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
            const generalQuery = query
                .is('system_id', null) // Only get conversations without system_id
                .gte('created_at', twentyFourHoursAgo.toISOString()) // Only include conversations from last 24 hours
                .limit(limit);
            const { data, error } = await generalQuery;
            if (error) {
                console.error('[CHAT HISTORY] ❌ Failed to get chat history:', error);
                return await getFallbackHistory(orgId, sessionId, limit);
            }
            history = (data || []);
            if (history.length === 0) {
                console.log(`[CHAT HISTORY] ℹ️ No recent general conversation history found (this is a new general conversation or no conversations in last 24 hours)`);
            }
            else {
                console.log(`[CHAT HISTORY] ✅ Retrieved ${history.length} recent general conversation(s) (system-specific and old conversations excluded)`);
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
    }
    catch (error) {
        console.error('[CHAT HISTORY] ❌ Exception getting chat history:', error);
        return [];
    }
}
/**
 * Fallback function to get chat history without filters
 */
async function getFallbackHistory(orgId, sessionId, limit = 3) {
    const supabase = supabase_1.supabaseAdmin;
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
        const history = (fallbackData || []);
        console.log(`[CHAT HISTORY] ✅ Retrieved ${history.length} chat history entries (fallback)`);
        return history.reverse(); // Reverse to get chronological order
    }
    catch (e) {
        console.error('[CHAT HISTORY] ❌ Fallback query exception:', e);
        return [];
    }
}
/**
 * Detect if user query is asking about past conversations (needs semantic search)
 */
function needsSemanticSearch(userQuery) {
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
 * Uses TRUE HYBRID approach: SQL for recent messages + Pinecone RAG for semantic search of older conversations
 * Automatically truncates to fit within token budget
 *
 * @param orgId - Organization ID
 * @param sessionId - Session ID (optional)
 * @param systemId - Optional system ID filter
 * @param limit - Number of recent messages from SQL (default: 3)
 * @param userQuery - Current user query (for semantic search)
 * @param tokenBudget - Maximum tokens allowed for history (optional, will use all available if not provided)
 * @returns Promise<string> - Formatted conversation history string (truncated if needed)
 */
async function getFormattedChatHistory(orgId, sessionId, systemId, limit = 3, userQuery, tokenBudget) {
    const sessionIdToUse = sessionId || 'default';
    // Step 1: Always get recent messages via SQL (for chronological continuity)
    console.log(`[CHAT HISTORY] 📋 Step 1: Retrieving recent messages via SQL (limit: ${limit})`);
    let sqlHistory = await getChatHistory(orgId, sessionIdToUse, systemId, limit);
    console.log(`[CHAT HISTORY] ✅ Retrieved ${sqlHistory.length} recent messages from SQL`);
    // Step 2: Get semantically relevant older conversations via Pinecone (if user query provided)
    let pineconeHistory = [];
    if (userQuery && userQuery.trim()) {
        try {
            console.log(`[CHAT HISTORY] 🔍 Step 2: Retrieving semantically relevant conversations via Pinecone`);
            // Get top 5 semantically relevant conversations (can be older than SQL results)
            pineconeHistory = await (0, chat_history_rag_service_1.getChatHistoryContext)(userQuery, orgId, sessionIdToUse, 5, // topK for semantic search
            systemId);
            console.log(`[CHAT HISTORY] ✅ Retrieved ${pineconeHistory.length} semantically relevant conversations from Pinecone`);
        }
        catch (error) {
            console.error(`[CHAT HISTORY] ⚠️ Pinecone search failed (non-critical, continuing with SQL only):`, error.message);
            // Continue with SQL results only
        }
    }
    // Step 3: Combine and deduplicate results
    // Create a map to track unique conversations (by user_query + bot_response hash)
    const seenConversations = new Set();
    const combinedHistory = [];
    // First, add SQL results (prioritize recent messages)
    for (const entry of sqlHistory) {
        const key = `${entry.user_query}|${entry.bot_response.substring(0, 100)}`;
        if (!seenConversations.has(key)) {
            seenConversations.add(key);
            combinedHistory.push(entry);
        }
    }
    // Then, add Pinecone results (only if not already in SQL results)
    for (const entry of pineconeHistory) {
        const key = `${entry.user_query}|${entry.bot_response.substring(0, 100)}`;
        if (!seenConversations.has(key)) {
            seenConversations.add(key);
            // Convert Pinecone result to ChatHistoryEntry format
            combinedHistory.push({
                id: '', // Pinecone entries don't have SQL IDs
                org_id: orgId,
                session_id: sessionIdToUse,
                user_query: entry.user_query,
                bot_response: entry.bot_response,
                chatbot_mode: 'SYSTEM_ANALYSIS', // Default, could be improved
                system_id: systemId,
                created_at: entry.created_at || new Date().toISOString(),
            });
        }
    }
    console.log(`[CHAT HISTORY] 🔗 Step 3: Combined ${sqlHistory.length} SQL + ${pineconeHistory.length} Pinecone = ${combinedHistory.length} unique conversations (after deduplication)`);
    if (combinedHistory.length === 0) {
        return '';
    }
    // Step 4: Sort by created_at (most recent first) to maintain chronological order
    combinedHistory.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA; // Descending (newest first)
    });
    // Step 5: Apply token budget truncation if provided
    if (tokenBudget !== undefined && tokenBudget > 0) {
        const historyTokens = (0, token_utils_1.estimateTokens)(combinedHistory.map(e => `User: ${e.user_query}\nAssistant: ${e.bot_response}`).join('\n\n'));
        console.log(`[CHAT HISTORY] 📊 Combined history tokens: ${historyTokens} / budget: ${tokenBudget}`);
        if (historyTokens > tokenBudget) {
            const originalLength = combinedHistory.length;
            // Convert to simple format for truncation (maintains order)
            const simpleHistory = combinedHistory.map(e => ({ user_query: e.user_query, bot_response: e.bot_response }));
            const truncatedSimple = (0, token_utils_1.truncateHistoryToFitBudget)(simpleHistory, tokenBudget);
            // Map back: keep only entries that match truncated results (in order)
            const truncatedHistory = [];
            for (let i = 0; i < truncatedSimple.length && i < combinedHistory.length; i++) {
                const truncatedEntry = truncatedSimple[i];
                const originalEntry = combinedHistory[i];
                // Update bot_response if it was truncated
                if (originalEntry.user_query === truncatedEntry.user_query) {
                    truncatedHistory.push({
                        ...originalEntry,
                        bot_response: truncatedEntry.bot_response
                    });
                }
            }
            combinedHistory.length = 0;
            combinedHistory.push(...truncatedHistory);
            console.log(`[CHAT HISTORY] ✂️ Truncated combined history from ${originalLength} to ${combinedHistory.length} entries to fit token budget`);
        }
    }
    // Step 6: Format the combined history
    const sqlCount = sqlHistory.length;
    const pineconeCount = combinedHistory.length - sqlCount;
    const formatted = combinedHistory.map((entry, index) => {
        const source = sqlHistory.some(e => e.user_query === entry.user_query && e.bot_response === entry.bot_response)
            ? ' (Recent)'
            : ' (Semantically Relevant)';
        return `Previous Conversation ${index + 1}${source}:
User: ${entry.user_query}
Assistant: ${entry.bot_response}`;
    }).join('\n\n');
    const sourceInfo = pineconeCount > 0
        ? `Hybrid: ${sqlCount} recent + ${pineconeCount} semantically relevant`
        : `${sqlCount} recent messages`;
    return `\n\n=== PREVIOUS CONVERSATION CONTEXT (${sourceInfo}) ===\n${formatted}\n=== END OF PREVIOUS CONVERSATION CONTEXT ===\n\n`;
}
/**
 * Get or generate session title
 * If session has no title, generates one from the first user query
 *
 * @param orgId - Organization ID
 * @param sessionId - Session ID
 * @returns Promise<string | null>
 */
async function getSessionTitle(orgId, sessionId) {
    if (!orgId || !sessionId) {
        return null;
    }
    const supabase = supabase_1.supabaseAdmin;
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
    }
    catch (error) {
        console.error('[CHAT HISTORY] ❌ Error getting session title:', error);
        return null;
    }
}
//# sourceMappingURL=chat-history-service.js.map