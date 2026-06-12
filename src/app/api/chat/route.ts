import { streamChatCompletion, generateChatCompletion, resolveModel, MODEL_FALLBACK_CHAIN } from "@/lib/ai/chat"
import { getToolsForModel, executeToolCall, FILE_TOOL_CALLS } from "@/lib/ai/tools"
import { withRateLimit } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"
import { unauthorized, serverError, validate } from "@/lib/api-utils"
import { chatRequestSchema } from "@/lib/validators"
import type { ChatModel, ChatMode, ToolCall, ApiMessage } from "@/types"

const MAX_TOOL_ROUNDS = 5
const MODEL_TIMEOUT_MS = 60000

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
): Promise<{ content: string | null; toolCalls: any[] | null; modelUsed: ChatModel }> {
  const fallbacks = MODEL_FALLBACK_CHAIN.filter((m) => m !== model).slice(0, 2)

  for (const candidate of [model, ...fallbacks]) {
    try {
      const result = await Promise.race([
            generateChatCompletion(candidate, messages, { tools }),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error(`Model ${candidate} timed out`)), MODEL_TIMEOUT_MS),
            ),
          ])
          return { content: result.content, toolCalls: result.toolCalls ?? null, modelUsed: candidate }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error"
      if (candidate === model) continue
      return { content: `[${candidate} failed: ${msg}]`, toolCalls: null, modelUsed: candidate }
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

        const { model, messages, mode } = parsed.data as { model: ChatModel; messages: ApiMessage[]; mode: ChatMode }

        const resolvedModel = resolveModel(model, messages, mode ?? "chat")
        const tools = getToolsForModel(resolvedModel, mode)

        FILE_TOOL_CALLS.length = 0

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

          for (const tc of result.toolCalls) {
            const toolResult = await executeToolCall(tc as ToolCall)
            currentMessages.push({
              role: "tool",
              tool_call_id: tc.id,
              content: toolResult,
            })
          }

          toolRounds++
        }

        const encoder = new TextEncoder()
        const stream = new ReadableStream({
          async start(controller) {
            try {
              const lastAssistantMsg = currentMessages[currentMessages.length - 1]
              if (lastAssistantMsg?.role === "assistant" && lastAssistantMsg.content) {
                const data = JSON.stringify({ content: lastAssistantMsg.content })
                controller.enqueue(encoder.encode(`data: ${data}\n\n`))
              } else {
                const summaryMessages = currentMessages.slice()
                summaryMessages.push({
                  role: "user",
                  content: "Please summarize what you just did, including what files were created and their purposes.",
                })
                const generator = streamChatCompletion(resolvedModel, summaryMessages)
                for await (const chunk of generator) {
                  const data = JSON.stringify({ content: chunk })
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`))
                }
              }

              for (const file of FILE_TOOL_CALLS) {
                const data = JSON.stringify({ file_created: file })
                controller.enqueue(encoder.encode(`data: ${data}\n\n`))
              }

              controller.enqueue(encoder.encode("data: [DONE]\n\n"))
            } catch (error) {
              const data = JSON.stringify({
                error: error instanceof Error ? error.message : "Stream failed",
              })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
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
