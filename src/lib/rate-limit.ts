const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

const defaultConfigs: Record<string, RateLimitConfig> = {
  chat: { maxRequests: 30, windowMs: 60000 },
  image: { maxRequests: 10, windowMs: 60000 },
  auth: { maxRequests: 5, windowMs: 60000 },
}

export function checkRateLimit(
  key: string,
  config?: RateLimitConfig,
): { allowed: boolean; remaining: number; resetAt: number } {
  const cfg = config ?? defaultConfigs.chat
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + cfg.windowMs })
    return { allowed: true, remaining: cfg.maxRequests - 1, resetAt: now + cfg.windowMs }
  }

  entry.count++

  if (entry.count > cfg.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  return { allowed: true, remaining: cfg.maxRequests - entry.count, resetAt: entry.resetAt }
}

export async function withRateLimit(
  key: string,
  handler: () => Promise<Response>,
  config?: RateLimitConfig,
): Promise<Response> {
  const result = checkRateLimit(key, config)

  if (!result.allowed) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Remaining": "0",
        },
      },
    )
  }

  const response = await handler()
  const headers = new Headers(response.headers)
  headers.set("X-RateLimit-Remaining", String(result.remaining))
  headers.set("X-RateLimit-Reset", String(result.resetAt))

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
