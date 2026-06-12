import { webSearch } from "@/lib/search"
import { createClient } from "@/lib/supabase/server"
import type { ToolCall } from "@/types"

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

export type ToolHandler = (args: Record<string, unknown>) => Promise<string>

const webSearchHandler: ToolHandler = async (args) => {
  const query = (args.query ?? args.q ?? "") as string
  if (!query) return "Error: No search query provided."
  try {
    const { results, error } = await webSearch(query)
    if (error) return `Search error: ${error}`
    if (!results.length) return "No search results found."
    return results.map((r, i) =>
      `[${i + 1}] ${r.title}\n${r.snippet ?? ""}\nURL: ${r.link}`
    ).join("\n\n")
  } catch (e) {
    return `Web search failed: ${e instanceof Error ? e.message : "Unknown error"}`
  }
}

const calculateHandler: ToolHandler = async (args) => {
  const expression = (args.expression ?? "") as string
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

export const FILE_TOOL_CALLS: { conversationId: string; filename: string; content: string; language: string }[] = []

const createFileHandler: ToolHandler = async (args) => {
  const filename = (args.filename ?? args.name ?? "untitled.txt") as string
  const content = (args.content ?? args.code ?? "") as string
  const language = (args.language ?? args.lang ?? "") as string
  const conversationId = (args.conversation_id ?? "") as string

  if (!filename || !content) return "Error: filename and content are required."

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return "Error: Not authenticated."

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

    FILE_TOOL_CALLS.push({ conversationId, filename, content, language })

    return `File created successfully: ${filename} (${language || "text"})`
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

export function getToolsForModel(model: string, mode?: string): ToolDefinition[] {
  if (mode === "agent") return TOOL_DEFINITIONS
  if (model.includes("nemotron-3-ultra")) return TOOL_DEFINITIONS
  const nonToolModels = [
    "deepseek/deepseek-r1",
    "minimaxai/minimax-m2.7",
    "google/gemma-2-27b-it",
  ]
  if (nonToolModels.some((m) => model.includes(m))) return []
  return TOOL_DEFINITIONS
}

export async function executeToolCall(toolCall: ToolCall): Promise<string> {
  const handler = toolHandlers[toolCall.function.name]
  if (!handler) return `Error: Unknown tool "${toolCall.function.name}".`

  try {
    const args = JSON.parse(toolCall.function.arguments)
    const result = await handler(args)
    return result
  } catch (e) {
    return `Error executing ${toolCall.function.name}: ${e instanceof Error ? e.message : "Unknown error"}`
  }
}
