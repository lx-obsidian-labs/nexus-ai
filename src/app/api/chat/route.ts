import { NextResponse } from "next/server"
import { streamChatCompletion } from "@/lib/ai/chat"
import { withRateLimit } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"
import type { ChatModel } from "@/types"

export async function POST(request: Request) {
  return withRateLimit(
    `chat:${request.headers.get("x-forwarded-for") ?? "unknown"}`,
    async () => {
      try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { model, messages } = await request.json()

        if (!model || !messages || !Array.isArray(messages)) {
          return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        if (messages.length > 100) {
          return NextResponse.json({ error: "Too many messages" }, { status: 400 })
        }

        const encoder = new TextEncoder()
        const stream = new ReadableStream({
          async start(controller) {
            try {
              const generator = streamChatCompletion(
                model as ChatModel,
                messages,
              )

              for await (const chunk of generator) {
                const data = JSON.stringify({ content: chunk })
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
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
      }
    },
  )
}
