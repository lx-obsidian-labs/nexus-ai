import type { ChatModel, Message } from "@/types"

const NVIDIA_BASE_URL = process.env.NVIDIA_NIM_BASE_URL || "https://integrate.api.nvidia.com/v1"
const NVIDIA_API_KEY = process.env.NVIDIA_NIM_API_KEY

interface NVCFRequest {
  model: string
  messages: { role: string; content: string }[]
  temperature?: number
  top_p?: number
  max_tokens?: number
  stream?: boolean
}

interface NVCFResponse {
  choices: {
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export async function generateChatCompletion(
  model: ChatModel,
  messages: Pick<Message, "role" | "content">[],
  options?: { temperature?: number; maxTokens?: number },
): Promise<{ content: string; usage: { promptTokens: number; completionTokens: number } }> {
  if (!NVIDIA_API_KEY) {
    throw new Error("NVIDIA NIM API key is not configured")
  }

  const body: NVCFRequest = {
    model,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 2048,
    stream: false,
  }

  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${NVIDIA_API_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`NVIDIA API error: ${response.status} ${response.statusText}`)
  }

  const data: NVCFResponse = await response.json()

  return {
    content: data.choices[0]?.message?.content ?? "",
    usage: {
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
    },
  }
}

export async function* streamChatCompletion(
  model: ChatModel,
  messages: Pick<Message, "role" | "content">[],
  options?: { temperature?: number; maxTokens?: number },
): AsyncGenerator<string> {
  if (!NVIDIA_API_KEY) {
    throw new Error("NVIDIA NIM API key is not configured")
  }

  const body: NVCFRequest = {
    model,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 2048,
    stream: true,
  }

  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${NVIDIA_API_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`NVIDIA API error: ${response.status} ${response.statusText}`)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error("No response body")

  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith("data: ")) continue

        const data = trimmed.slice(6)
        if (data === "[DONE]") return

        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content
          if (content) yield content
        } catch {
          continue
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

export function getDefaultSystemPrompt(): string {
  return `You are Nexus AI, a helpful and knowledgeable AI assistant. You provide accurate, thoughtful, and well-reasoned responses. You support markdown formatting in your responses.`
}
