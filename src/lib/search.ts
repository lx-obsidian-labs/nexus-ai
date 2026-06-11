export interface SearchResult {
  title: string
  link: string
  snippet: string
}

export async function webSearch(query: string): Promise<{ results: SearchResult[]; error?: string }> {
  const apiKey = process.env.SERPAPI_API_KEY
  const googleKey = process.env.GOOGLE_API_KEY
  const googleCx = process.env.GOOGLE_CSE_ID

  if (apiKey) {
    return searchSerpApi(query, apiKey)
  }

  if (googleKey && googleCx) {
    return searchGoogleCustom(query, googleKey, googleCx)
  }

  return {
    results: [],
    error: "No search API key configured. Set SERPAPI_API_KEY or GOOGLE_API_KEY + GOOGLE_CSE_ID in environment variables.",
  }
}

async function searchSerpApi(query: string, apiKey: string): Promise<{ results: SearchResult[]; error?: string }> {
  try {
    const params = new URLSearchParams({
      q: query,
      api_key: apiKey,
      engine: "google",
      num: "8",
    })

    const response = await fetch(`https://serpapi.com/search?${params}`, {
      headers: { Accept: "application/json" },
    })

    if (!response.ok) {
      return { results: [], error: `Search API error: ${response.status}` }
    }

    const data = await response.json()
    const results: SearchResult[] = (data.organic_results || []).map((r: any) => ({
      title: r.title || "",
      link: r.link || "",
      snippet: r.snippet || "",
    }))

    return { results }
  } catch (err) {
    return { results: [], error: err instanceof Error ? err.message : "Search failed" }
  }
}

async function searchGoogleCustom(query: string, key: string, cx: string): Promise<{ results: SearchResult[]; error?: string }> {
  try {
    const params = new URLSearchParams({ q: query, key, cx, num: "8" })
    const response = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`)

    if (!response.ok) {
      return { results: [], error: `Google Search API error: ${response.status}` }
    }

    const data = await response.json()
    const results: SearchResult[] = (data.items || []).map((r: any) => ({
      title: r.title || "",
      link: r.link || "",
      snippet: r.snippet || "",
    }))

    return { results }
  } catch (err) {
    return { results: [], error: err instanceof Error ? err.message : "Search failed" }
  }
}
