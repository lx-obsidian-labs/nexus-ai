import { streamChatCompletion, generateChatCompletion, resolveModel } from "@/lib/ai/chat"
import { getToolsForModel, executeToolCall } from "@/lib/ai/tools"
import { withRateLimit } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"
import { unauthorized, badRequest, serverError, validate } from "@/lib/api-utils"
import { chatRequestSchema } from "@/lib/validators"
import type { ChatModel, ChatMode, Message, ToolCall } from "@/types"

const MAX_TOOL_ROUNDS = 5

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

        const { model, messages, mode } = parsed.data

        const resolvedModel = resolveModel(model as ChatModel, messages as Pick<Message, "content" | "role">[], (mode as ChatMode) ?? "chat")
        const tools = getToolsForModel(resolvedModel)

        let currentMessages = [...messages]
        let toolRounds = 0

        while (toolRounds < MAX_TOOL_ROUNDS) {
          const result = await generateChatCompletion(
            resolvedModel,
            currentMessages,
            { tools: tools.length > 0 ? tools : undefined },
          )

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
                const generator = streamChatCompletion(
                  resolvedModel,
                  currentMessages,
                )

                for await (const chunk of generator) {
                  const data = JSON.stringify({ content: chunk })
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`))
                }
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
