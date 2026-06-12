import type { ChatModel, Message, ChatMode } from "@/types"

const CHAT_API_URL = process.env.NVIDIA_API_URL || `${process.env.NVIDIA_NIM_BASE_URL || "https://integrate.api.nvidia.com/v1"}/chat/completions`
const NVIDIA_API_KEY = process.env.NVIDIA_NIM_API_KEY

const CODING_KEYWORDS = [
  "code", "function", "bug", "debug", "api", "endpoint", "route", "component",
  "class", "method", "variable", "array", "object", "json", "sql", "query",
  "typescript", "javascript", "python", "rust", "go", "java", "react", "node",
  "css", "html", "docker", "git", "deploy", "test", "jest", "lint", "refactor",
  "compile", "error", "exception", "async", "promise", "callback", "import",
  "export", "module", "config", "build", "algorithm", "data structure",
]

const REASONING_KEYWORDS = [
  "math", "equation", "solve", "prove", "theorem", "calculate", "logic",
  "reasoning", "explain why", "analysis", "compare", "contrast", "evaluate",
  "hypothesis", "theory", "deduce", "infer", "synthesize",
]

const CREATIVE_KEYWORDS = [
  "story", "poem", "essay", "creative", "write", "blog", "article", "content",
  "marketing", "ad copy", "headline", "describe", "narrative", "dialogue",
  "metaphor", "imagine", "brainstorm", "idea",
]

export const MODEL_FALLBACK_CHAIN: ChatModel[] = [
  "nvidia/nemotron-3-ultra-550b-a55b",
  "nvidia/nemotron-3-super-120b-a12b",
  "nvidia/nemotron-3-nano-30b-a3b",
  "meta/llama-3.1-70b-instruct",
  "meta/llama-3.1-8b-instruct",
]

export function resolveModel(model: ChatModel, messages: Pick<Message, "role" | "content">[], mode: ChatMode): ChatModel {
  if (model !== "auto") return model

  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")
  const prompt = (lastUserMsg?.content ?? "").toLowerCase()
  const fullContext = messages.map((m) => m.content).join(" ").toLowerCase()

  const text = `${prompt} ${fullContext}`

  if (mode === "coding") {
    return "nvidia/nemotron-3-ultra-550b-a55b"
  }

  if (mode === "websearch") {
    return "meta/llama-3.1-70b-instruct"
  }

  if (mode === "research") {
    return "nvidia/nemotron-3-super-120b-a12b"
  }

  if (mode === "agent") {
    return "nvidia/nemotron-3-ultra-550b-a55b"
  }

  const codingScore = CODING_KEYWORDS.filter((k) => text.includes(k)).length
  const reasoningScore = REASONING_KEYWORDS.filter((k) => text.includes(k)).length
  const creativeScore = CREATIVE_KEYWORDS.filter((k) => text.includes(k)).length

  if (codingScore >= reasoningScore && codingScore >= creativeScore && codingScore >= 2) {
    return "nvidia/nemotron-3-ultra-550b-a55b"
  }

  if (reasoningScore >= codingScore && reasoningScore >= creativeScore && reasoningScore >= 2) {
    return "nvidia/nemotron-3-super-120b-a12b"
  }

  if (creativeScore >= codingScore && creativeScore >= reasoningScore && creativeScore >= 2) {
    return "nvidia/nemotron-3-nano-30b-a3b"
  }

  if (text.length > 8000) {
    return "nvidia/nemotron-3-super-120b-a12b"
  }

  return "nvidia/nemotron-3-nano-30b-a3b"
}

interface NVCFRequest {
  model: string
  messages: { role: string; content: string }[]
  temperature?: number
  top_p?: number
  max_tokens?: number
  stream?: boolean
  tools?: unknown[]
  tool_choice?: string
}

interface NVCFResponseMessage {
  role: string
  content: string | null
  tool_calls?: {
    id: string
    type: "function"
    function: { name: string; arguments: string }
  }[]
}

interface NVCFResponseChoice {
  index: number
  message: NVCFResponseMessage
  finish_reason: string
}

interface NVCFResponse {
  choices: NVCFResponseChoice[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export async function generateChatCompletion(
  model: ChatModel,
  messages: Pick<Message, "role" | "content">[],
  options?: { temperature?: number; maxTokens?: number; tools?: unknown[] },
): Promise<{ content: string | null; toolCalls: NVCFResponseMessage["tool_calls"] | null; usage: { promptTokens: number; completionTokens: number } }> {
  if (!NVIDIA_API_KEY) {
    throw new Error("NVIDIA NIM API key is not configured")
  }

  const body: NVCFRequest = {
    model,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 8192,
    stream: false,
  }

  if (options?.tools && options.tools.length > 0) {
    body.tools = options.tools
    body.tool_choice = "auto"
  }

  const response = await fetch(CHAT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${NVIDIA_API_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errBody = await response.text().catch(() => "")
    throw new Error(`NVIDIA API error (${response.status}): ${errBody || response.statusText}`)
  }

  const data: NVCFResponse = await response.json()
  const message = data.choices[0]?.message

  return {
    content: message?.content ?? null,
    toolCalls: message?.tool_calls ?? null,
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
    max_tokens: options?.maxTokens ?? 8192,
    stream: true,
  }

  const response = await fetch(CHAT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${NVIDIA_API_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errBody = await response.text().catch(() => "")
    throw new Error(`NVIDIA API error (${response.status}): ${errBody || response.statusText}`)
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

export function getAgentSystemPrompt(): string {
  return `You are Nexus AI Agent — an autonomous coding and task-completion agent.

Your capabilities:
- Write, debug, and refactor code in any language
- Create files using the \`create_file\` tool — ALWAYS use this whenever you write code
- Search the web for up-to-date information
- Perform calculations and data analysis
- Plan and execute multi-step tasks independently

Rules:
1. When you write code, ALWAYS save it as a file using \`create_file\`. Do not just show the code — save it.
2. Use descriptive filenames with proper extensions (e.g. \`server.ts\`, \`App.tsx\`, \`main.py\`).
3. For multi-file projects, save each file separately with its correct filename.
4. After creating files, summarize what was created and where.
5. You can chain multiple tool calls to accomplish complex tasks.
6. Think step by step and use the right tool for each sub-task.
7. Always provide clear explanations alongside your code.`
}

export function getCodingSystemPrompt(): string {
  return `You are Nexus AI Coding Agent, an expert programming assistant. You help users write, debug, explain, and refactor code.

Guidelines:
- Write clean, production-quality code with proper error handling.
- Always show complete code blocks with the correct language tag.
- When suggesting changes, show the full file or the relevant diff.
- Explain your reasoning concisely before writing code.
- Use modern patterns, best practices, and consider edge cases.
- If you're unsure about something, ask for clarification.
- Support all major languages: TypeScript, Python, Rust, Go, Java, etc.

Format all code with proper markdown code fences showing the language.`
}

export function getWebSearchSystemPrompt(): string {
  return `You are Nexus AI with web search capability. You have access to real-time web search results that are provided to you as context.

When responding:
- Use the search results provided in the context to answer the user's question.
- Cite your sources by including relevant URLs from the search results.
- If the search results don't contain enough information, clearly state what you know and what you couldn't find.
- Summarize information from multiple sources when possible.
- Prioritize recent, authoritative sources.
- Format responses with clear headings and bullet points for readability.
- Never claim to have live access — you can only use the search results that have been provided.`
}

export function getResearchSystemPrompt(): string {
  return `You are Nexus AI Research & Business Agent, an expert analyst and strategic advisor.

You excel at:
- Market research and competitive analysis
- Business strategy and planning
- Technical architecture and system design
- Project planning and roadmap creation
- Data analysis and insight generation
- Industry trend analysis
- Risk assessment and mitigation strategies

When responding:
- Structure answers with clear sections and actionable recommendations.
- Provide data-driven insights and cite specific examples.
- Consider multiple perspectives and scenarios.
- Include concrete next steps or implementation guidance.
- Use tables, lists, and structured formats for complex information.
- Be honest about uncertainties and assumptions.

For project/architecture planning, include:
- Requirements analysis
- System architecture overview
- Technology recommendations with rationale
- Implementation phases and timeline estimates
- Risk assessment
- Success metrics`
}
