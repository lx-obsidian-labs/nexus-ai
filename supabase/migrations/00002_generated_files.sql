-- Generated files table (files created from code blocks in chat)
CREATE TABLE generated_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  content TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_generated_files_conversation_id ON generated_files(conversation_id);
CREATE INDEX idx_generated_files_user_id ON generated_files(user_id);

ALTER TABLE generated_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own generated files"
  ON generated_files FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own generated files"
  ON generated_files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own generated files"
  ON generated_files FOR DELETE
  USING (auth.uid() = user_id);
