import { createClient } from "@/lib/supabase/server"
import { unauthorized, badRequest, serverError, ok, validate } from "@/lib/api-utils"
import { fileCreateSchema } from "@/lib/validators"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const parsed = validate(fileCreateSchema, body)
    if (parsed.error) return parsed.error

    const { conversation_id, filename, content, language } = parsed.data

    const { data, error } = await supabase
      .from("generated_files")
      .insert({ conversation_id, user_id: user.id, filename, content, language })
      .select()
      .single()

    if (error) return serverError(error.message)
    return ok(data)
  } catch {
    return serverError()
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return unauthorized()

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get("conversation_id")
    if (!conversationId) return badRequest("Missing conversation_id")

    const { data, error } = await supabase
      .from("generated_files")
      .select("*")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })

    if (error) return serverError(error.message)
    return ok(data ?? [])
  } catch {
    return serverError()
  }
}
