import { streamChatCompletion, generateChatCompletion, resolveModel, MODEL_FALLBACK_CHAIN } from "@/lib/ai/chat"
import { getToolsForModel, executeToolCall, type ExecuteToolCallResult } from "@/lib/ai/tools"
import { withRateLimit } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"
import { unauthorized, serverError, validate } from "@/lib/api-utils"
import { chatRequestSchema } from "@/lib/validators"
import type { ChatModel, ChatMode, ToolCall, ApiMessage } from "@/types"

const MAX_TOOL_ROUNDS = 5
const MODEL_TIMEOUT_MS = 60000
const TOOL_TIMEOUT_MS = 30000

function toApiMessage(m: any): ApiMessage {
  const msg: ApiMessage = { role: m.role, content: m.content ?? "" }
  if (m.tool_calls) msg.tool_calls = m.tool_calls
  if (m.tool_call_id) msg.tool_call_id = m.tool_call_id
  return msg
}

async function tryGenerateWithFallback(
  model: ChatModel,
  messages: ApiMessage[],
  tools: unknown[] | undefined,
  mode: ChatMode,
  signal?: AbortSignal,
): Promise<{ content: string | null; toolCalls: any[] | null; modelUsed: ChatModel }> {
  const fallbacks = MODEL_FALLBACK_CHAIN.filter((m) => m !== model)

  for (const candidate of [model, ...fallbacks]) {
    try {
      const result = await Promise.race([
            generateChatCompletion(candidate, messages, { tools, signal }),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error(`Model ${candidate} timed out`)), MODEL_TIMEOUT_MS),
            ),
          ])
          return { content: result.content, toolCalls: result.toolCalls ?? null, modelUsed: candidate }
    } catch (e) {
      if (candidate === model) continue
      const fallbackIndex = fallbacks.indexOf(candidate as ChatModel)
      if (fallbackIndex < fallbacks.length - 1) continue
      return { content: null, toolCalls: null, modelUsed: candidate }
    }
  }

  return { content: null, toolCalls: null, modelUsed: model }
}

export async function POST(request: Request) {
  return withRateLimit(
    `chat:${request.headers.get("x-forwarded-for") ?? "unknown"}`,
    async () => {
      try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          return unauthorized()
        }

        const body = await request.json()

        const parsed = validate(chatRequestSchema, body)
        if (parsed.error) return parsed.error

        const { model, messages, mode, conversation_id } = parsed.data as { model: ChatModel; messages: ApiMessage[]; mode: ChatMode; conversation_id?: string }

        const resolvedModel = resolveModel(model, messages, mode ?? "chat")
        const tools = getToolsForModel(resolvedModel, mode)
        const convId = conversation_id || ""

        const createdFiles: { filename: string; content: string; language: string }[] = []
        const toolMessages: { tool_call_id: string; name: string; content: string }[] = []
        let currentMessages: ApiMessage[] = messages.map(toApiMessage)
        let toolRounds = 0

        while (toolRounds < MAX_TOOL_ROUNDS) {
          const result = await tryGenerateWithFallback(resolvedModel, currentMessages, tools.length > 0 ? tools : undefined, mode)

          if (!result.toolCalls || result.toolCalls.length === 0) {
            currentMessages.push({ role: "assistant", content: result.content ?? "" })
            break
          }

          currentMessages.push({
            role: "assistant",
            content: result.content ?? "",
            tool_calls: result.toolCalls,
          })

          const toolResults = await Promise.all(
            result.toolCalls.map(async (tc: ToolCall) => {
              const toolResult = await Promise.race([
                executeToolCall(tc),
                new Promise<ExecuteToolCallResult>((_, reject) =>
                  setTimeout(() => reject(new Error(`Tool ${tc.function.name} timed out`)), TOOL_TIMEOUT_MS),
                ),
              ])
              return { tc, toolResult }
            }),
          )

          for (const { tc, toolResult } of toolResults) {
            currentMessages.push({
              role: "tool",
              tool_call_id: tc.id,
              content: toolResult.content,
            })
            if (toolResult.file) {
              createdFiles.push(toolResult.file)
            }
          }

          toolRounds++
        }

        const encoder = new TextEncoder()
        const stream = new ReadableStream({
          async start(controller) {
            try {
              const lastAssistantMsg = currentMessages[currentMessages.length - 1]
              let finalContent = ""

              if (lastAssistantMsg?.role === "assistant" && lastAssistantMsg.content) {
                finalContent = lastAssistantMsg.content
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: finalContent })}\n\n`))
              } else {
                const summaryMessages = currentMessages.slice()
                summaryMessages.push({
                  role: "user",
                  content: "Please summarize what you just did, including what files were created and their purposes. Be specific about filenames and contents.",
                })
                const generator = streamChatCompletion(resolvedModel, summaryMessages)
                for await (const chunk of generator) {
                  finalContent += chunk
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`))
                }
              }

              for (const file of createdFiles) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ file_created: file })}\n\n`))
              }

              controller.enqueue(encoder.encode("data: [DONE]\n\n"))
            } catch (error) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : "Stream failed" })}\n\n`))
            } finally {
              controller.close()
            }
          },
        })

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        })
      } catch {
        return serverError()
      }
    },
  )
}
