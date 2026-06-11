"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.VERCEL_URL}` || "http://localhost:3000"
}

export async function signUp(email: string, password: string, fullName?: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${getAppUrl()}/auth/callback`,
      },
    })

    if (error) return { error: error.message }
    revalidatePath("/", "layout")
    return { error: null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unexpected error" }
  }
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  revalidatePath("/", "layout")
}

export async function signInWithGoogle() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${getAppUrl()}/auth/callback`,
    },
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()
  if (error) throw error
  revalidatePath("/", "layout")
}

export async function resetPassword(email: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getAppUrl()}/auth/callback?next=update-password`,
  })

  if (error) throw error
}

export async function getSession() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
