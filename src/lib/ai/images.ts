import type { ImageModel, ImageGenerationResult } from "@/types"

const NVIDIA_BASE_URL = process.env.NVIDIA_NIM_BASE_URL || "https://integrate.api.nvidia.com/v1"
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

  const response = await fetch(`${NVIDIA_BASE_URL}/image/generation`, {
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
