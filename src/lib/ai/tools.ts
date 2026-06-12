import { webSearch } from "@/lib/search"
import { createClient as createServerClient } from "@/lib/supabase/server"
import type { ToolCall, ToolName } from "@/types"

const MAX_TOOL_RESULT_LENGTH = 8000

export interface ToolDefinition {
  type: "function"
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

export interface ToolCallResult {
  role: "tool"
  tool_call_id: string
  content: string
}

export interface CreatedFile {
  filename: string
  content: string
  language: string
}

export interface ToolResult {
  content: string
  file?: { filename: string; content: string; language: string }
}

export type ToolHandler = (args: Record<string, unknown>) => Promise<string | ToolResult>

function truncate(str: string, max: number): string {
  if (str.length <= max) return str
  return str.slice(0, max) + `\n\n[... truncated to ${max} characters]`
}

const webSearchHandler: ToolHandler = async (args) => {
  const query = String(args.query ?? args.q ?? "")
  if (!query) return "Error: No search query provided."
  try {
    const { results, error } = await webSearch(query)
    if (error) return `Search error: ${error}`
    if (!results.length) return "No search results found."
    return truncate(results.map((r, i) =>
      `[${i + 1}] ${r.title}\n${r.snippet ?? ""}\nURL: ${r.link}`
    ).join("\n\n"), MAX_TOOL_RESULT_LENGTH)
  } catch (e) {
    return `Web search failed: ${e instanceof Error ? e.message : "Unknown error"}`
  }
}

const calculateHandler: ToolHandler = async (args) => {
  const expression = String(args.expression ?? "")
  try {
    const sanitized = expression.replace(/[^0-9+\-*/.()%^ ]/g, "")
    if (!sanitized) return "Error: Invalid expression."
    const result = Function(`"use strict"; return (${sanitized})`)()
    return String(result)
  } catch {
    return "Error: Could not evaluate the expression."
  }
}

const getDatetimeHandler: ToolHandler = async () => {
  const now = new Date()
  return JSON.stringify({
    iso: now.toISOString(),
    date: now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
    time: now.toLocaleTimeString("en-US"),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timestamp: now.getTime(),
  })
}

const createFileHandler: ToolHandler = async (args) => {
  const filename = String(args.filename ?? args.name ?? "untitled.txt")
  const raw = args.content ?? args.code ?? ""
  const content = typeof raw === "string" ? raw : JSON.stringify(raw)
  const language = String(args.language ?? args.lang ?? "")
  const conversationId = String(args.conversation_id ?? "")

  if (!filename || !content) return "Error: filename and content are required."

  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return "Error: Not authenticated."

    if (conversationId) {
      const { data: conv } = await supabase
        .from("conversations")
        .select("user_id")
        .eq("id", conversationId)
        .single()
      if (conv && conv.user_id !== user.id) return "Error: Conversation not found."
    }

    const { data, error } = await supabase
      .from("generated_files")
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        filename,
        content,
        language,
      })
      .select()
      .single()

    if (error) return `Error saving file: ${error.message}`

    return {
      content: `File created successfully: ${filename} (${language || "text"})`,
      file: { filename, content, language },
    }
  } catch (e) {
    return `Error creating file: ${e instanceof Error ? e.message : "Unknown error"}`
  }
}

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web for current information on any topic. Use this when you need up-to-date data, news, or facts.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "calculate",
      description: "Perform mathematical calculations. Use this for arithmetic, percentages, or any numeric computation.",
      parameters: {
        type: "object",
        properties: {
          expression: {
            type: "string",
            description: "The math expression to evaluate (e.g. 2 + 2, 15 * 3.5, (100 - 20) * 0.15)",
          },
        },
        required: ["expression"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_current_datetime",
      description: "Get the current date and time. Use this when you need to know what time it is or the current date.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_file",
      description: "Create or save a code file. Use this whenever you generate code — save each code block as a file so the user can download, preview, or export it. Include the full file content, filename with extension, and language.",
      parameters: {
        type: "object",
        properties: {
          filename: {
            type: "string",
            description: "The filename including extension (e.g. main.ts, app.py, index.html)",
          },
          content: {
            type: "string",
            description: "The complete file content",
          },
          language: {
            type: "string",
            description: "The programming language (e.g. typescript, python, rust, html)",
          },
          conversation_id: {
            type: "string",
            description: "The conversation ID to associate this file with",
          },
        },
        required: ["filename", "content", "language", "conversation_id"],
      },
    },
  },
]

const toolHandlers: Record<string, ToolHandler> = {
  web_search: webSearchHandler,
  calculate: calculateHandler,
  get_current_datetime: getDatetimeHandler,
  create_file: createFileHandler,
}

const TOOL_CAPABLE_MODELS = [
  "nvidia/nemotron-3-ultra-550b-a55b",
  "nvidia/nemotron-3-super-120b-a12b",
  "nvidia/nemotron-3-nano-30b-a3b",
]

export function getToolsForModel(model: string, mode?: string): ToolDefinition[] {
  if (mode === "agent") return TOOL_DEFINITIONS
  if (TOOL_CAPABLE_MODELS.includes(model)) return TOOL_DEFINITIONS
  return []
}

export interface ExecuteToolCallResult {
  content: string
  file?: { filename: string; content: string; language: string }
}

export async function executeToolCall(toolCall: ToolCall): Promise<ExecuteToolCallResult> {
  const handler = toolHandlers[toolCall.function.name]
  if (!handler) return { content: `Error: Unknown tool "${toolCall.function.name}".` }

  try {
    const args = JSON.parse(toolCall.function.arguments)
    const result = await handler(args)
    if (typeof result === "string") return { content: result }
    return result
  } catch (e) {
    return { content: `Error executing ${toolCall.function.name}: ${e instanceof Error ? e.message : "Unknown error"}` }
  }
}
