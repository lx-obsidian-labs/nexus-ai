import type { ChatModel } from "@/types"

export const APP_NAME = "Nexus AI"
export const APP_DESCRIPTION = "AI-powered chat with web search, coding assistance, and research capabilities"

export const CHAT_MODELS: { value: ChatModel; label: string; provider: string }[] = [
  { value: "auto", label: "Auto (best for task)", provider: "Nexus AI" },
  { value: "nvidia/nemotron-3-ultra-550b-a55b", label: "Nemotron Ultra 550B", provider: "NVIDIA" },
  { value: "nvidia/nemotron-3-super-120b-a12b", label: "Nemotron Super 120B", provider: "NVIDIA" },
  { value: "nvidia/nemotron-3-nano-30b-a3b", label: "Nemotron Nano 30B", provider: "NVIDIA" },
  { value: "meta/llama-3.1-70b-instruct", label: "Llama 3.1 70B", provider: "Meta" },
  { value: "meta/llama-3.1-8b-instruct", label: "Llama 3.1 8B", provider: "Meta" },
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
