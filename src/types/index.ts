export type ChatModel =
  | "auto"
  | "meta/llama-3.1-70b-instruct"
  | "meta/llama-3.1-8b-instruct"
  | "nvidia/nemotron-3-ultra-550b-a55b"
  | "nvidia/nemotron-3-super-120b-a12b"
  | "nvidia/nemotron-3-nano-30b-a3b"

export type ChatMode = "chat" | "coding" | "websearch" | "research" | "agent"

export type MessageRole = "user" | "assistant" | "system" | "tool"

export interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  user_id: string
  title: string
  model: ChatModel
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: MessageRole
  content: string
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface UsageLog {
  id: string
  user_id: string
  action: string
  model: string
  tokens_used: number | null
  cost: number | null
  created_at: string
}

export interface UserSettings {
  id: string
  theme: "dark" | "light"
  default_chat_model: ChatModel
  created_at: string
  updated_at: string
}

export interface ChatStreamChunk {
  content: string
  done: boolean
}

export interface ToolCall {
  id: string
  type: "function"
  function: {
    name: string
    arguments: string
  }
}

export interface ToolMessage {
  role: "tool"
  tool_call_id: string
  content: string
}

export interface GeneratedFile {
  id: string
  conversation_id: string
  user_id: string
  filename: string
  content: string
  language: string
  created_at: string
}
