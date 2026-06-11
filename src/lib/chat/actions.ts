"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getConversations() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .order("updated_at", { ascending: false })

  if (error) throw error
  return data
}

export async function getConversation(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", id)
    .single()

  if (error) throw error
  return data
}

export async function createConversation(title: string, model: string) {
  const supabase = await createClient()
  const user = await supabase.auth.getUser()

  if (!user.data.user) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from("conversations")
    .insert({ user_id: user.data.user.id, title, model })
    .select()
    .single()

  if (error) throw error
  revalidatePath("/chat")
  return data
}

export async function updateConversation(id: string, data: { title?: string; model?: string }) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("conversations")
    .update(data)
    .eq("id", id)

  if (error) throw error
  revalidatePath("/chat")
}

export async function deleteConversation(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", id)

  if (error) throw error
  revalidatePath("/chat")
}

export async function getMessages(conversationId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  if (error) throw error
  return data
}

export async function saveMessage(
  conversationId: string,
  role: "user" | "assistant" | "system",
  content: string,
  metadata?: Record<string, unknown>,
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, role, content, metadata })
    .select()
    .single()

  if (error) throw error

  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId)

  return data
}
