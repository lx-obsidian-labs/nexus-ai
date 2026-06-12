import { z } from "zod"
import { CHAT_MODELS } from "@/lib/constants"

export const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(1, "Full name is required").max(100).optional(),
})

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export const chatMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(10000, "Message too long"),
  conversationId: z.string().uuid().optional(),
  model: z.enum(CHAT_MODELS.map((m) => m.value) as [string, ...string[]]),
})

export const conversationUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  model: z.enum(CHAT_MODELS.map((m) => m.value) as [string, ...string[]]).optional(),
})

export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
}
