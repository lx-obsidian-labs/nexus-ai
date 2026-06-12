-- Add tool support to messages table
-- Required for agent mode: tool_call_id links results to tool calls,
-- tool_calls stores the model's tool invocation requests for the OpenAI-compatible API.

-- Extend the role CHECK constraint to allow 'tool' messages
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_role_check;
ALTER TABLE messages ADD CONSTRAINT messages_role_check
  CHECK (role IN ('user', 'assistant', 'system', 'tool'));

-- Add columns for tool-calling protocol
ALTER TABLE messages ADD COLUMN IF NOT EXISTS tool_call_id TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS tool_calls JSONB;
