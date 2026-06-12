import { webSearch } from "@/lib/search"
import { badRequest, serverError, ok, validate } from "@/lib/api-utils"
import { searchRequestSchema } from "@/lib/validators"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const parsed = validate(searchRequestSchema, body)
    if (parsed.error) return parsed.error

    const result = await webSearch(parsed.data.query.trim())

    if (result.error) {
      return ok({ error: result.error, results: [] })
    }

    return ok({ results: result.results })
  } catch {
    return serverError()
  }
}
