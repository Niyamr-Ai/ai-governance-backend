# AI Governance Copilot - Chatbot Documentation

## Overview

The AI Governance Copilot is a RAG-ready chatbot foundation that provides intelligent assistance for AI compliance and governance tasks. The chatbot operates in three distinct modes, each optimized for different use cases.

## Architecture

The chatbot is built with a clear separation of concerns to enable easy RAG integration later:

```
┌─────────────────┐
│  Frontend UI    │  (components/chatbot/Chatbot.tsx)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Chat API      │  (app/api/chat/route.ts)
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐  ┌──────────────────┐
│ Intent │  │ Context Providers│  (lib/chatbot/context-providers.ts)
│Classifier│ └──────────────────┘
└────────┘         │
                   ▼
            ┌──────────────┐
            │   Prompts    │  (lib/chatbot/prompts.ts)
            └──────────────┘
```

## Chatbot Modes

### 1. EXPLAIN Mode

**Purpose**: Educational mode for explaining regulations, concepts, and platform behavior.

**Characteristics**:
- **Uses System Data**: No
- **Tone**: Educational, neutral
- **Use Cases**:
  - "What is the EU AI Act?"
  - "How does risk assessment work?"
  - "Explain transparency requirements"
  - "What are high-risk AI systems?"

**Context Provider**: `getExplainContext()`
- **Current**: Returns mock data
- **RAG Integration**: Will query regulatory knowledge base (EU AI Act, UK AI Act, MAS regulations)

### 2. SYSTEM_ANALYSIS Mode

**Purpose**: Analyze a user's AI system against regulations.

**Characteristics**:
- **Uses System Data**: Yes (requires systemId)
- **Tone**: Analytical, evidence-based, cautious
- **Use Cases**:
  - "Is my system compliant?"
  - "What are the risks for this system?"
  - "How does my system compare to regulations?"
  - "What compliance gaps exist?"

#### Scope & Limitations (Important)

SYSTEM_ANALYSIS mode provides **governance guidance**, not legal or regulatory certification.

The chatbot:
- Does NOT determine legal compliance
- Does NOT issue approvals, certifications, or audit outcomes
- Does NOT replace formal legal, compliance, or regulatory review
- Bases its responses only on available system data and documented regulations

All outputs should be treated as **decision-support guidance** and must be reviewed by a human stakeholder.

**Context Provider**: `getSystemAnalysisContext(systemId, orgId)`
- **Current**: Fetches system data from database (assessments, risk levels, compliance status)
- **RAG Integration**: Will enhance with:
  - Regulatory requirements relevant to system's risk tier
  - Compliance obligations based on system characteristics
  - Gap analysis from regulatory knowledge base

### 3. ACTION Mode

**Purpose**: Recommend actionable next steps within the platform.

**Characteristics**:
- **Uses System Data**: Yes (may use systemId)
- **Tone**: Short, actionable, step-by-step
- **Use Cases**:
  - "What should I do next?"
  - "How do I complete this task?"
  - "What are my pending actions?"
  - "How do I create a risk assessment?"

**Context Provider**: `getActionContext(systemId)`
- **Current**: Fetches pending tasks and suggests workflows
- **RAG Integration**: Will query:
  - Platform workflow documentation
  - Step-by-step guides for common actions
  - Context-aware next steps based on system state

## Intent Classification

The chatbot uses an LLM-based intent classifier (`lib/chatbot/intent-classifier.ts`) that:

1. Takes the user message + page context
2. Classifies into one of: `EXPLAIN | SYSTEM_ANALYSIS | ACTION`
3. Uses GPT-4o-mini (cheap, fast model)
4. Returns ONLY the mode label (no explanation)

**Classification Logic**:
- Analyzes user message content
- Considers page context (page type, systemId presence)
- Returns mode with fallback to `EXPLAIN` if classification fails

## API Endpoint

### POST `/api/chat`

**Request**:
```typescript
{
  message: string;
  pageContext: {
    pageType: 'dashboard' | 'ai-system' | 'compliance' | ...;
    systemId?: string;
    orgId?: string;
    additionalMetadata?: Record<string, any>;
  };
  conversationHistory?: ChatMessage[];
}
```

**Response**:
```typescript
{
  answer: string;
  mode: 'EXPLAIN' | 'SYSTEM_ANALYSIS' | 'ACTION';
  suggestedActions?: string[];
  error?: string;
}
```

**Flow**:
1. Authenticate user
2. Validate request
3. Classify intent
4. Get context based on mode
5. Build prompt
6. Generate response with OpenAI
7. Extract suggested actions
8. Return response

## How It Currently Works (Without RAG)

**Important**: The chatbot currently works, but relies on:

1. **GPT-4o's Training Data**: For EXPLAIN mode, GPT-4o uses its pre-trained knowledge about regulations (EU AI Act, UK AI Act, MAS). This is acceptable for a foundation but not ideal for production.

2. **Real Database Data**: For SYSTEM_ANALYSIS and ACTION modes, the chatbot fetches actual system data from your database (assessments, risk levels, tasks, etc.). This provides real, system-specific information.

3. **Prompt Engineering**: The prompts guide GPT-4o to provide helpful, safe responses with appropriate disclaimers.

**Limitations Without RAG**:
- EXPLAIN mode cannot provide specific regulatory text or article references
- Responses may not reflect the latest regulatory updates
- Cannot answer questions about specific regulatory articles or sections
- May provide general information that isn't tailored to your specific regulatory knowledge base

**What Works Well**:
- SYSTEM_ANALYSIS mode provides real system-specific analysis using database data
- ACTION mode provides real task recommendations from your database
- Intent classification works correctly
- Safety guardrails are in place

## RAG Integration Points

The chatbot is designed to be RAG-ready. Here are the integration points:

### 1. `getExplainContext()` - Regulatory Knowledge Base

**Location**: `lib/chatbot/context-providers.ts`

**Current Implementation**: Returns mock data

**RAG Integration**:
```typescript
// TODO: Replace with RAG query
// 1. Create embedding from userMessage
// 2. Query vector database (Pinecone/Supabase) for regulatory text
// 3. Retrieve relevant articles, definitions, explanations
// 4. Return structured context
```

**Vector Database Schema** (to be implemented):
- Index: `regulatory-knowledge`
- Metadata: `{ type: 'regulation' | 'concept' | 'platform', regulation: 'EU' | 'UK' | 'MAS', article?: string }`

### 2. `getSystemAnalysisContext()` - System + Regulatory Context

**Location**: `lib/chatbot/context-providers.ts`

**Current Implementation**: Fetches system data from database

**RAG Integration**:
```typescript
// TODO: Enhance with RAG
// 1. Query system-specific data (existing)
// 2. Create embedding from system characteristics
// 3. Query regulatory knowledge base for relevant requirements
// 4. Retrieve compliance obligations based on risk tier
// 5. Get gap analysis from regulatory context
// 6. Combine system data + regulatory context
```

**Enhancement Strategy**:
- Use system risk tier to filter regulatory requirements
- Query regulations relevant to system's use case
- Retrieve compliance checklists based on system characteristics

### 3. `getActionContext()` - Workflow Documentation

**Location**: `lib/chatbot/context-providers.ts`

**Current Implementation**: Fetches tasks and suggests workflows

**RAG Integration**:
```typescript
// TODO: Replace with RAG query
// 1. Query platform workflow documentation
// 2. Retrieve step-by-step guides for common actions
// 3. Get context-aware next steps based on system state
// 4. Return actionable workflows
```

**Vector Database Schema** (to be implemented):
- Index: `platform-workflows`
- Metadata: `{ workflow_type: string, steps: string[], prerequisites: string[] }`

## Safety & Guardrails

The chatbot includes multiple safety mechanisms:

### 1. Prompt-Level Safety

All prompts include base safety rules:
- Never provide legal advice
- Always state assumptions clearly
- Explicitly mention missing data
- Never access cross-tenant data
- Be cautious and evidence-based

### 2. API-Level Validation

- Authentication required
- SystemId access validation (TODO: implement explicit access control)
- Input validation (message length, required fields)
- Error handling with user-friendly messages

### 3. Response Formatting

- Structured responses with clear sections
- Mode indicators in UI
- Suggested actions extraction
- Error messages for failures

## Frontend Integration

### Component Location

`components/chatbot/Chatbot.tsx`

### Features

- Floating chat button (bottom-right)
- Chat panel with message history
- Mode badges on assistant messages
- Loading states
- Error handling
- Auto-scroll to latest message
- Keyboard shortcuts (Enter to send)

### Page Context Detection

The chatbot automatically detects page context:
- Extracts `systemId` from URL params (`/ai-systems/[id]`)
- Determines page type from pathname
- Passes context to API for intent classification

### Authentication

- Only renders for authenticated users
- Checks auth status on mount
- API enforces authentication

## Adding RAG Integration

To add RAG without changing the existing architecture:

### Step 1: Update Context Providers

Replace mock/static data in `lib/chatbot/context-providers.ts`:

```typescript
// Before (mock)
return {
  regulatoryText: 'Mock regulatory text',
  // ...
};

// After (RAG)
const embedding = await createEmbedding(userMessage);
const results = await vectorDB.query(embedding, { topK: 5 });
return {
  regulatoryText: results.map(r => r.text).join('\n\n'),
  // ...
};
```

### Step 2: No Frontend Changes Needed

The frontend and API remain unchanged. Context providers are the only integration point.

### Step 3: No Prompt Changes Needed

Prompts accept context as-is. RAG just provides better context.

## Testing

### Manual Testing

1. **EXPLAIN Mode**:
   - Ask: "What is the EU AI Act?"
   - Verify: Educational response, no system data used

2. **SYSTEM_ANALYSIS Mode**:
   - Navigate to `/ai-systems/[id]`
   - Ask: "Is my system compliant?"
   - Verify: System-specific analysis, evidence-based tone

3. **ACTION Mode**:
   - Ask: "What should I do next?"
   - Verify: Actionable steps, workflow references

### API Testing

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: [auth-cookie]" \
  -d '{
    "message": "What is the EU AI Act?",
    "pageContext": {
      "pageType": "dashboard"
    }
  }'
```

## Future Enhancements

1. **Conversation Memory**: Store conversation history in database
2. **Streaming Responses**: Stream tokens for better UX
3. **Multi-turn Context**: Better handling of follow-up questions
4. **Custom Actions**: Execute platform actions directly from chat
5. **Feedback Loop**: Collect user feedback to improve responses
6. **Analytics**: Track mode usage and common questions

## File Structure

```
types/
  └── chatbot.ts                    # Type definitions

lib/chatbot/
  ├── constants.ts                  # Mode definitions
  ├── intent-classifier.ts          # LLM-based classification
  ├── context-providers.ts         # RAG-ready context (placeholders)
  └── prompts.ts                   # Mode-specific prompts

app/api/chat/
  └── route.ts                      # Chat API endpoint

components/chatbot/
  └── Chatbot.tsx                   # Frontend UI component
```

## Dependencies

- **OpenAI**: GPT-4o for responses, GPT-4o-mini for classification
- **Supabase**: Authentication and database queries
- **Next.js**: API routes and React components
- **Radix UI**: UI components (Dialog, ScrollArea, etc.)

## Environment Variables

Required:
- `OPEN_AI_KEY`: OpenAI API key

Optional (for RAG):
- `PINECONE_API_KEY`: Pinecone vector database key
- `SUPABASE_SERVICE_ROLE_KEY`: For enhanced queries

## Support

For questions or issues:
1. Check this documentation
2. Review code comments in context providers
3. Check API logs for errors
4. Verify authentication status

---

**Last Updated**: January 2025
**Version**: 1.0.0 (RAG-ready foundation)

