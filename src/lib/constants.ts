import type { ChatModel } from "@/types"

export const APP_NAME = "Nexus AI"
export const APP_DESCRIPTION = "AI-powered chat with web search, coding assistance, and research capabilities"

export const CHAT_MODELS: { value: ChatModel; label: string; provider: string }[] = [
  { value: "meta/llama-3.1-70b-instruct", label: "Llama 3.1 70B", provider: "Meta" },
  { value: "deepseek/deepseek-r1", label: "DeepSeek R1", provider: "DeepSeek" },
  { value: "mistralai/mistral-large", label: "Mistral Large", provider: "Mistral" },
  { value: "qwen/qwen2.5-72b-instruct", label: "Qwen 2.5 72B", provider: "Qwen" },
  { value: "minimaxai/minimax-m2.7", label: "MiniMax M2.7", provider: "MiniMax" },
]

export const RATE_LIMITS = {
  CHAT_MESSAGES_PER_MINUTE: 30,
  AUTH_ATTEMPTS_PER_MINUTE: 5,
} as const

export const NAV_ITEMS = [
  { href: "/chat", label: "Chat", icon: "MessageSquare" },
  { href: "/settings", label: "Settings", icon: "Settings" },
] as const
