"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { conversationUpdateSchema } from "@/lib/validators"

async function getUserId(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  return user.id
}

async function verifyConversationOwnership(conversationId: string, userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("conversations")
    .select("user_id")
    .eq("id", conversationId)
    .single()

  if (error || !data) throw new Error("Conversation not found")
  if (data.user_id !== userId) throw new Error("Unauthorized")
}

export async function getConversations() {
  const userId = await getUserId()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })

  if (error) throw error
  return data
}

export async function getConversation(id: string) {
  const userId = await getUserId()
  await verifyConversationOwnership(id, userId)
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
  const userId = await getUserId()
  const supabase = await createClient()

  if (!title?.trim() || title.length > 200) {
    throw new Error("Title must be between 1 and 200 characters")
  }

  const { data, error } = await supabase
    .from("conversations")
    .insert({ user_id: userId, title: title.trim(), model })
    .select()
    .single()

  if (error) throw error
  revalidatePath("/chat")
  return data
}

export async function updateConversation(id: string, data: { title?: string; model?: string }) {
  const parsed = conversationUpdateSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid update data")
  }

  const userId = await getUserId()
  await verifyConversationOwnership(id, userId)
  const supabase = await createClient()

  const { error } = await supabase
    .from("conversations")
    .update(parsed.data)
    .eq("id", id)

  if (error) throw error
  revalidatePath("/chat")
}

export async function deleteConversation(id: string) {
  const userId = await getUserId()
  await verifyConversationOwnership(id, userId)
  const supabase = await createClient()

  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", id)

  if (error) throw error
  revalidatePath("/chat")
}

export async function getMessages(conversationId: string) {
  const userId = await getUserId()
  await verifyConversationOwnership(conversationId, userId)
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
  const userId = await getUserId()
  await verifyConversationOwnership(conversationId, userId)
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
