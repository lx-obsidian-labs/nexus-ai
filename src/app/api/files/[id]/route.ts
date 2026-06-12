import { createClient } from "@/lib/supabase/server"
import { unauthorized, notFound, serverError, ok, validate } from "@/lib/api-utils"
import { z } from "zod"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return unauthorized()

    const { data, error } = await supabase
      .from("generated_files")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (error || !data) return notFound("File not found")
    return ok(data)
  } catch {
    return serverError()
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return unauthorized()

    const { error } = await supabase
      .from("generated_files")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) return serverError(error.message)
    return ok({ success: true })
  } catch {
    return serverError()
  }
}
