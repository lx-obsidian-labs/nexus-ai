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

export const modelEnum = z.enum(CHAT_MODELS.map((m) => m.value) as [string, ...string[]])

const toolCallSchema = z.object({
  id: z.string(),
  type: z.literal("function"),
  function: z.object({ name: z.string(), arguments: z.string() }),
})

const messageSchema = z.object({
  role: z.enum(["user", "assistant", "system", "tool"]),
  content: z.string(),
  tool_calls: z.array(toolCallSchema).optional(),
  tool_call_id: z.string().optional(),
})

export const chatMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(10000, "Message too long"),
  conversationId: z.string().uuid().optional(),
  model: modelEnum,
  mode: z.enum(["chat", "coding", "websearch", "research", "agent"]).optional(),
})

export const chatRequestSchema = z.object({
  model: modelEnum,
  messages: z.array(messageSchema).min(1).max(100, "Too many messages"),
  mode: z.enum(["chat", "coding", "websearch", "research", "agent"]).optional(),
})

export const fileCreateSchema = z.object({
  conversation_id: z.string().uuid(),
  filename: z.string().min(1).max(255),
  content: z.string().min(1),
  language: z.string().max(50).default(""),
})

export const searchRequestSchema = z.object({
  query: z.string().min(1, "Query is required").max(500, "Query too long"),
})

export const conversationUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  model: modelEnum.optional(),
})

export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
}
