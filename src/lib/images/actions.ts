"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getGeneratedImages() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("generated_images")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function saveGeneratedImage(
  prompt: string,
  model: string,
  imageUrl: string,
  width: number,
  height: number,
  seed: number | null,
) {
  const supabase = await createClient()
  const user = await supabase.auth.getUser()

  if (!user.data.user) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from("generated_images")
    .insert({
      user_id: user.data.user.id,
      prompt,
      model,
      image_url: imageUrl,
      width,
      height,
      seed,
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath("/images")
  return data
}

export async function deleteGeneratedImage(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("generated_images")
    .delete()
    .eq("id", id)

  if (error) throw error
  revalidatePath("/images")
}
