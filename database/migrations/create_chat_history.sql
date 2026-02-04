-- Create Chat History table for AI Governance Copilot
-- Stores conversation history for context retention and report-related queries
-- Uses org_id for tenant isolation (not user_id)

-- Drop existing table if it exists (safe since this is a new feature)
-- Comment out the DROP statement if you want to preserve existing data
DROP TABLE IF EXISTS chat_history CASCADE;

-- Table: chat_history
-- Stores user queries and bot responses for conversation context
CREATE TABLE chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant Isolation (org_id is primary isolation mechanism)
  org_id UUID NOT NULL,
  
  -- Session Management
  session_id TEXT NOT NULL DEFAULT 'default',
  session_title TEXT,
  
  -- System Association (optional - for report-related conversations)
  system_id UUID,
  
  -- Conversation Data
  user_query TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  
  -- Chatbot Mode (for filtering/analysis)
  chatbot_mode TEXT CHECK (chatbot_mode IN ('EXPLAIN', 'SYSTEM_ANALYSIS', 'ACTION')),
  
  -- Page Context (stored as JSONB for flexibility)
  page_context JSONB DEFAULT '{}'::jsonb,
  
  -- User who initiated the conversation
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chat_history_org_id ON chat_history(org_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_session_id ON chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_system_id ON chat_history(system_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_org_session ON chat_history(org_id, session_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view chat history for their organization
-- For now, users can see chat history where they are the user_id
-- This will be expanded when proper org_id membership is implemented
CREATE POLICY "Users can view their organization's chat history"
ON chat_history
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  user_id = auth.uid()
);

-- RLS Policy: Users can create chat history entries for their organization
CREATE POLICY "Users can create chat history for their organization"
ON chat_history
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  user_id = auth.uid()
);

-- RLS Policy: Users can update their own chat history entries (for corrections)
CREATE POLICY "Users can update their chat history"
ON chat_history
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND
  user_id = auth.uid()
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  user_id = auth.uid()
);

-- RLS Policy: Users can delete their own chat history entries
CREATE POLICY "Users can delete their chat history"
ON chat_history
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND
  user_id = auth.uid()
);

-- Add comments for documentation
COMMENT ON TABLE chat_history IS 'Stores conversation history for AI Governance Copilot chatbot. Used for context retention and answering report-related questions.';
COMMENT ON COLUMN chat_history.org_id IS 'Organization ID for tenant isolation. Primary mechanism for multi-tenancy.';
COMMENT ON COLUMN chat_history.session_id IS 'Session identifier for grouping related conversations. Defaults to "default".';
COMMENT ON COLUMN chat_history.system_id IS 'Optional system ID for associating conversations with specific AI systems/reports.';
COMMENT ON COLUMN chat_history.chatbot_mode IS 'Chatbot mode (EXPLAIN, SYSTEM_ANALYSIS, ACTION) used for this conversation.';
COMMENT ON COLUMN chat_history.page_context IS 'Page context information (pageType, systemId, orgId, etc.) stored as JSONB.';

