"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Image as ImageIcon, Loader2, Download, RefreshCw } from "lucide-react"
import { IMAGE_MODELS } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"
import { downloadImage, generateId } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import type { ImageModel, GeneratedImage } from "@/types"

export function ImageGenerator() {
  const [prompt, setPrompt] = useState("")
  const [model, setModel] = useState<ImageModel>("black-forest-labs/flux-schnell")
  const [width, setWidth] = useState(1024)
  const [height, setHeight] = useState(1024)
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<GeneratedImage | null>(null)
  const [images, setImages] = useState<GeneratedImage[]>([])

  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return

    setGenerating(true)
    setResult(null)

    try {
      const response = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt, width, height }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error ?? "Generation failed")
      }

      const data = await response.json()

      const supabase = createClient()
      const { data: user } = await supabase.auth.getUser()

      const image: GeneratedImage = {
        id: generateId(),
        user_id: user.user!.id,
        prompt,
        model,
        image_url: data.url,
        width,
        height,
        seed: data.seed,
        created_at: new Date().toISOString(),
      }

      await supabase.from("generated_images").insert(image)
      setResult(image)
      setImages((prev) => [image, ...prev])
      toast({ title: "Image generated successfully!", variant: "success" })
    } catch (error) {
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleDownload = () => {
    if (result) {
      const filename = `nexus-${result.id.slice(0, 8)}.png`
      downloadImage(result.image_url, filename)
    }
  }

  const handleRegenerate = () => {
    handleGenerate()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              placeholder="Describe the image you want to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Model</Label>
              <Select value={model} onValueChange={(v) => setModel(v as ImageModel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMAGE_MODELS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="width">Width</Label>
              <Select value={String(width)} onValueChange={(v) => setWidth(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="512">512</SelectItem>
                  <SelectItem value="768">768</SelectItem>
                  <SelectItem value="1024">1024</SelectItem>
                  <SelectItem value="1440">1440</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height</Label>
              <Select value={String(height)} onValueChange={(v) => setHeight(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="512">512</SelectItem>
                  <SelectItem value="768">768</SelectItem>
                  <SelectItem value="1024">1024</SelectItem>
                  <SelectItem value="1440">1440</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleGenerate} disabled={!prompt.trim() || generating} className="flex-1">
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardContent className="pt-6">
            <div className="relative overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.image_url}
                alt={result.prompt}
                className="w-full rounded-lg"
              />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground truncate max-w-[60%]">
                {result.prompt}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleRegenerate}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
