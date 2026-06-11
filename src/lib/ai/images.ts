import type { ImageModel, ImageGenerationResult } from "@/types"

const IMAGES_API_URL = process.env.NVIDIA_API_URL?.replace("/chat/completions", "/images/generations") || `${process.env.NVIDIA_NIM_BASE_URL || "https://integrate.api.nvidia.com/v1"}/images/generations`
const NVIDIA_API_KEY = process.env.NVIDIA_NIM_API_KEY

interface NVCFImageRequest {
  model: string
  prompt: string
  width?: number
  height?: number
  seed?: number
}

interface NVCFImageResponse {
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

  const body: NVCFImageRequest = {
    model,
    prompt,
    width: options?.width ?? 1024,
    height: options?.height ?? 1024,
    seed: options?.seed,
  }

  const response = await fetch(IMAGES_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${NVIDIA_API_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`NVIDIA API error: ${response.status} ${response.statusText}`)
  }

  const data: NVCFImageResponse = await response.json()

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
    return { url: data.image, seed: data.seed ?? null }
  }

  if (data.artifacts && data.artifacts.length > 0) {
    const base64 = data.artifacts[0].base64
    const url = `data:image/png;base64,${base64}`
    return { url, seed: data.artifacts[0].seed }
  }

  throw new Error("No image generated")
}
