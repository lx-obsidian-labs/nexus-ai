import type { ChatModel } from "@/types"

export const APP_NAME = "Nexus AI"
export const APP_DESCRIPTION = "AI-powered chat with web search, coding assistance, and research capabilities"

export const CHAT_MODELS: { value: ChatModel; label: string; provider: string }[] = [
  { value: "auto", label: "Auto (best for task)", provider: "Nexus AI" },
  { value: "meta/llama-3.1-70b-instruct", label: "Llama 3.1 70B", provider: "Meta" },
  { value: "meta/llama-3.1-8b-instruct", label: "Llama 3.1 8B", provider: "Meta" },
  { value: "deepseek/deepseek-r1", label: "DeepSeek R1", provider: "DeepSeek" },
  { value: "mistralai/mistral-large", label: "Mistral Large", provider: "Mistral" },
  { value: "mistralai/mixtral-8x22b-instruct", label: "Mixtral 8x22B", provider: "Mistral" },
  { value: "qwen/qwen2.5-72b-instruct", label: "Qwen 2.5 72B", provider: "Qwen" },
  { value: "minimaxai/minimax-m2.7", label: "MiniMax M2.7", provider: "MiniMax" },
  { value: "google/gemma-2-27b-it", label: "Gemma 2 27B", provider: "Google" },
  { value: "microsoft/phi-3-medium-128k-instruct", label: "Phi-3 Medium 128K", provider: "Microsoft" },
  { value: "nvidia/nemotron-3-super-120b-a12b", label: "Nemotron Super 120B", provider: "NVIDIA" },
]

export const AUTO_MODEL = "auto" as ChatModel

export const RATE_LIMITS = {
  CHAT_MESSAGES_PER_MINUTE: 30,
  AUTH_ATTEMPTS_PER_MINUTE: 5,
} as const

export const NAV_ITEMS = [
  { href: "/chat", label: "Chat", icon: "MessageSquare" },
  { href: "/settings", label: "Settings", icon: "Settings" },
] as const
