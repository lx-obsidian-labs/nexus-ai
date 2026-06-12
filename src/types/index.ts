export type ChatModel =
  | "meta/llama-3.1-70b-instruct"
  | "deepseek/deepseek-r1"
  | "mistralai/mistral-large"
  | "qwen/qwen2.5-72b-instruct"
  | "minimaxai/minimax-m2.7"

export type ChatMode = "chat" | "coding" | "websearch" | "research"

export type MessageRole = "user" | "assistant" | "system"

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
