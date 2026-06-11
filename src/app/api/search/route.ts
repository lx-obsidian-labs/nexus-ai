import { NextResponse } from "next/server"
import { webSearch } from "@/lib/search"

export async function POST(request: Request) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    if (query.length > 500) {
      return NextResponse.json({ error: "Query too long" }, { status: 400 })
    }

    const result = await webSearch(query.trim())

    if (result.error) {
      return NextResponse.json({ error: result.error, results: [] }, { status: 200 })
    }

    return NextResponse.json({ results: result.results })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 500 },
    )
  }
}
