import { NextResponse } from "next/server"
import { generateImage } from "@/lib/ai/images"
import { withRateLimit } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const requestSchema = z.object({
  model: z.string().min(1),
  prompt: z.string().min(1).max(1000),
  width: z.number().int().min(256).max(2048).default(1024),
  height: z.number().int().min(256).max(2048).default(1024),
})

export async function POST(request: Request) {
  return withRateLimit(
    `image:${request.headers.get("x-forwarded-for") ?? "unknown"}`,
    async () => {
      try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const parsed = requestSchema.safeParse(body)

        if (!parsed.success) {
          return NextResponse.json(
            { error: "Invalid request", details: parsed.error.flatten() },
            { status: 400 },
          )
        }

        const { model, prompt, width, height } = parsed.data

        const result = await generateImage(model as any, prompt, { width, height })

        return NextResponse.json({
          url: result.url,
          seed: result.seed,
          model,
          width,
          height,
        })
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Image generation failed" },
          { status: 500 },
        )
      }
    },
  )
}
