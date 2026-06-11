import type { ImageModel, ImageGenerationResult } from "@/types"

const NVIDIA_API_KEY = process.env.NVIDIA_NIM_API_KEY

const NVIDIA_OVERRIDE = process.env.NVIDIA_IMAGES_API_URL || process.env.NVIDIA_API_URL?.replace("/chat/completions", "/images/generations")

const MODEL_CONFIG: Record<string, { endpoint: string; steps: number }> = {
  "black-forest-labs/flux-schnell": {
    endpoint: "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell",
    steps: 4,
  },
  "black-forest-labs/flux-dev": {
    endpoint: "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-dev",
    steps: 28,
  },
  "black-forest-labs/flux-1.1-pro": {
    endpoint: "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1.1-pro",
    steps: 28,
  },
  "stabilityai/stable-diffusion-xl": {
    endpoint: "https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-xl",
    steps: 50,
  },
}

interface ImageResponse {
  artifacts?: { base64: string; seed: number }[]
  image?: string
  seed?: number
  data?: { url?: string; b64_json?: string; index?: number }[]
}

export async function generateImage(
  model: ImageModel,
  prompt: string,
  options?: { width?: number; height?: number; seed?: number },
): Promise<ImageGenerationResult> {
  if (!NVIDIA_API_KEY) {
    throw new Error("NVIDIA NIM API key is not configured")
  }

  const config = MODEL_CONFIG[model]
  const endpoint = NVIDIA_OVERRIDE || config?.endpoint

  if (!endpoint) {
    throw new Error(`Unknown model: ${model}`)
  }

  const body: Record<string, unknown> = {
    prompt,
    mode: "Image Generation",
    steps: config?.steps ?? 28,
    width: options?.width ?? 1024,
    height: options?.height ?? 1024,
    seed: options?.seed ?? 0,
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${NVIDIA_API_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => "")
    throw new Error(`NVIDIA API error: ${response.status}${errText ? ` - ${errText.slice(0, 200)}` : ""}`)
  }

  const data: ImageResponse = await response.json()

  if (data.data && data.data.length > 0) {
    const entry = data.data[0]
    if (entry.url) {
      return { url: entry.url, seed: data.seed ?? null }
    }
    if (entry.b64_json) {
      return { url: `data:image/png;base64,${entry.b64_json}`, seed: data.seed ?? null }
    }
  }

  if (data.image) {
    const url = data.image.startsWith("data:") || data.image.startsWith("http") ? data.image : `data:image/png;base64,${data.image}`
    return { url, seed: data.seed ?? null }
  }

  if (data.artifacts && data.artifacts.length > 0) {
    const base64 = data.artifacts[0].base64
    const url = `data:image/png;base64,${base64}`
    return { url, seed: data.artifacts[0].seed }
  }

  throw new Error("No image generated from API response")
}
