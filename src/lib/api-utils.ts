import { NextResponse } from "next/server"
import { z } from "zod"

export interface ApiError {
  error: string
  code?: string
  details?: unknown
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, code: "BAD_REQUEST", details } satisfies ApiError, { status: 400 })
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message, code: "UNAUTHORIZED" } satisfies ApiError, { status: 401 })
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message, code: "NOT_FOUND" } satisfies ApiError, { status: 404 })
}

export function tooManyRequests(message = "Too many requests. Please try again later.") {
  return NextResponse.json({ error: message, code: "RATE_LIMITED" } satisfies ApiError, { status: 429 })
}

export function serverError(message = "Internal server error") {
  return NextResponse.json({ error: message, code: "SERVER_ERROR" } satisfies ApiError, { status: 500 })
}

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { data: T; error?: never } | { data?: never; error: NextResponse } {
  const result = schema.safeParse(data)
  if (!result.success) {
    const firstIssue = result.error.issues[0]
    const message = firstIssue?.message ?? "Invalid input"
    return { error: badRequest(message, result.error.flatten().fieldErrors) }
  }
  return { data: result.data }
}
