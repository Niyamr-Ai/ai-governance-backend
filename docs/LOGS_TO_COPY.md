# Backend Logs to Copy/Paste for Testing

## When Testing Regulations Index (Unified)

### Expected Log Pattern:
```
[Context] ===== EXPLAIN MODE - REGULATION RAG =====
[Context] Regulation Type: EU
[Context] Query: What are the risk categories in the EU AI Act?
[Context] Using unified 'regulations' index with metadata filter

[RAG] ===== REGULATION QUERY =====
[RAG] Index: regulations (unified regulations index)
[RAG] Regulation Type: EU
[RAG] Filter: {
  "regulation_type": {
    "$eq": "EU"
  }
}
[RAG] TopK: 5
[RAG] Query: What are the risk categories in the EU AI Act?
[RAG] Query Response: Found 5 matches
[RAG] Found 5 relevant chunks for EU
[RAG] First chunk preview: [text preview...]
[RAG] ===== END REGULATION QUERY =====
```

### For UK Questions:
```
[RAG] Regulation Type: UK
[RAG] Filter: {
  "regulation_type": {
    "$eq": "UK"
  }
}
```

### For MAS Questions:
```
[RAG] Regulation Type: MAS
[RAG] Filter: {
  "regulation_type": {
    "$eq": "MAS"
  }
}
```

---

## When Testing Chat History Indexing

### Expected Log Pattern (First Message):
```
[CHAT HISTORY] 📝 Logging chat for org {orgId}, session {sessionId}
[CHAT HISTORY]    Query: [user query preview...]
[CHAT HISTORY]    Response: [bot response preview...]
[CHAT HISTORY]    Mode: EXPLAIN
[CHAT HISTORY] ✅ Chat logged successfully

[CHAT HISTORY] ===== INDEXING TO PINECONE =====
[CHAT HISTORY] Index: chat-history
[CHAT HISTORY] Vector ID: chat-{chatId}
[CHAT HISTORY] Metadata: {
  "org_id": "...",
  "session_id": "...",
  "user_query": "...",
  "bot_response": "...",
  "created_at": "..."
}
[CHAT HISTORY] Embedding dimension: 1536
[CHAT HISTORY] ✅ Successfully indexed chat {chatId} to Pinecone
[CHAT HISTORY] ===== END INDEXING =====
```

### Expected Log Pattern (Follow-up Message):
```
📚 [CHATBOT] Fetching conversation history...
[CHAT HISTORY] 🔍 Fetching chat history for org {orgId}
[CHAT HISTORY]    Session ID: {sessionId}
[CHAT HISTORY] ✅ Retrieved X chat history entries

[Chat History RAG] ===== CHAT HISTORY QUERY =====
[Chat History RAG] Index: chat-history
[Chat History RAG] Org ID: {orgId}
[Chat History RAG] Session ID: {sessionId}
[Chat History RAG] System ID: N/A (or {systemId})
[Chat History RAG] Filter: {
  "org_id": {
    "$eq": "{orgId}"
  },
  "session_id": {
    "$eq": "{sessionId}"
  }
}
[Chat History RAG] TopK: 5
[Chat History RAG] Query: [user query preview...]
[Chat History RAG] Query Response: Found X matches
[Chat History RAG] Found X relevant chat history chunks
[Chat History RAG] First chunk preview: User: ... Assistant: ...
[Chat History RAG] ===== END CHAT HISTORY QUERY =====
```

---

## Full Chat Request Log Flow

### Complete Log Sequence:
```
================================================================================
💬 [CHATBOT] ===== NEW CHAT REQUEST =====
================================================================================
⏰ [CHATBOT] Timestamp: [timestamp]
👤 [CHATBOT] User ID: [userId]
📝 [CHATBOT] User Message: [message]
📄 [CHATBOT] Page Context: {...}
🏢 [CHATBOT] Organization ID: [orgId]

────────────────────────────────────────────────────────────────────────────────
📚 [CHATBOT] Fetching conversation history...
[CHAT HISTORY] 🔍 Fetching chat history...
[Chat History RAG] ===== CHAT HISTORY QUERY =====
[Chat History RAG] Found X relevant chat history chunks
────────────────────────────────────────────────────────────────────────────────

🔍 [CHATBOT] Classifying intent...
✅ [CHATBOT] Intent classified: EXPLAIN

────────────────────────────────────────────────────────────────────────────────
📊 [CHATBOT] Fetching context for EXPLAIN mode...
[Context] ===== EXPLAIN MODE - REGULATION RAG =====
[RAG] ===== REGULATION QUERY =====
[RAG] Found X relevant chunks for EU
────────────────────────────────────────────────────────────────────────────────

📝 [CHATBOT] Building prompt with conversation history...
✅ [CHATBOT] Prompt built (length: X characters)

────────────────────────────────────────────────────────────────────────────────
🤖 [CHATBOT] Generating response with OpenAI...
✅ [CHATBOT] Response Generated Successfully

────────────────────────────────────────────────────────────────────────────────
💾 [CHATBOT] Logging conversation to database...
[CHAT HISTORY] 📝 Logging chat...
[CHAT HISTORY] ✅ Chat logged successfully
[CHAT HISTORY] ===== INDEXING TO PINECONE =====
[CHAT HISTORY] ✅ Successfully indexed chat {chatId} to Pinecone
────────────────────────────────────────────────────────────────────────────────

📤 [CHATBOT] Sending response to frontend
   Mode: EXPLAIN
   Processing Time: Xms
================================================================================
✅ [CHATBOT] Request completed successfully
```

---

## What to Copy/Paste

### For Regulations Testing:
Copy these log sections:
1. `[RAG] ===== REGULATION QUERY =====` through `[RAG] ===== END REGULATION QUERY =====`
2. Check that `Index: regulations` appears
3. Check that filter shows correct `regulation_type`

### For Chat History Testing:
Copy these log sections:
1. `[CHAT HISTORY] ===== INDEXING TO PINECONE =====` through `[CHAT HISTORY] ===== END INDEXING =====`
2. `[Chat History RAG] ===== CHAT HISTORY QUERY =====` through `[Chat History RAG] ===== END CHAT HISTORY QUERY =====`
3. Check that `Index: chat-history` appears
4. Check that filters include `org_id` and `session_id`

### For Full Flow Testing:
Copy the entire log from `===== NEW CHAT REQUEST =====` to `Request completed successfully`

---

## Troubleshooting Logs

### If Regulations Query Fails:
- Look for: `[RAG] Error retrieving context for {regulationType}`
- Check: Is `Index: regulations` shown?
- Check: Is filter correct?

### If Chat History Indexing Fails:
- Look for: `[CHAT HISTORY] ❌ Failed to index chat to Pinecone`
- Check: Is Pinecone client initialized?
- Check: Is `chat-history` index created?

### If Chat History RAG Fails:
- Look for: `[Chat History RAG] Error retrieving chat history context`
- Check: Are `org_id` and `session_id` in filter?
- Check: Are there any indexed conversations?

