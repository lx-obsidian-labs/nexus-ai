"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Image as ImageIcon, Loader2, Download, RefreshCw, Sparkles } from "lucide-react"
import { IMAGE_MODELS } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"
import { downloadImage, generateId } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import type { ImageModel, GeneratedImage } from "@/types"

export function ImageGenerator() {
  const [prompt, setPrompt] = useState("")
  const [model, setModel] = useState<ImageModel>("black-forest-labs/flux-schnell")
  const [width, setWidth] = useState(1024)
  const [height, setHeight] = useState(1024)
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<GeneratedImage | null>(null)

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

  return (
    <div className="space-y-8">
      <div className="glass-card p-6 space-y-5">
        <div className="space-y-2">
          <label htmlFor="prompt" className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Prompt
          </label>
          <Textarea
            id="prompt"
            placeholder="Describe the image you want to generate..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[100px] resize-none bg-background/50 border-white/10 focus:border-primary/30 transition-all duration-200"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium">Model</label>
            <Select value={model} onValueChange={(v) => setModel(v as ImageModel)}>
              <SelectTrigger className="bg-background/50">
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
            <label className="text-sm font-medium">Width</label>
            <Select value={String(width)} onValueChange={(v) => setWidth(Number(v))}>
              <SelectTrigger className="bg-background/50">
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
            <label className="text-sm font-medium">Height</label>
            <Select value={String(height)} onValueChange={(v) => setHeight(Number(v))}>
              <SelectTrigger className="bg-background/50">
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

        <Button
          onClick={handleGenerate}
          disabled={!prompt.trim() || generating}
          className="w-full h-11 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Image
            </>
          )}
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {generating && (
          <motion.div
            key="generating"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center justify-center py-16"
          >
            <div className="text-center space-y-4">
              <div className="relative mx-auto h-24 w-24">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 animate-pulse" />
                <div className="absolute inset-2 rounded-xl bg-background flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Creating your masterpiece...</p>
            </div>
          </motion.div>
        )}

        {result && !generating && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card overflow-hidden"
          >
            <div className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.image_url}
                alt={result.prompt}
                className="w-full object-contain max-h-[600px] bg-background"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-xl bg-black/50 backdrop-blur-sm hover:bg-black/70 border-white/10"
                  onClick={handleGenerate}
                >
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  Regenerate
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-xl bg-black/50 backdrop-blur-sm hover:bg-black/70 border-white/10"
                  onClick={handleDownload}
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Download
                </Button>
              </div>
            </div>
            <div className="p-4 border-t border-white/5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground truncate max-w-[70%]">{result.prompt}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="bg-primary/10 px-2 py-0.5 rounded-md">{result.model.split("/").pop()}</span>
                  <span>{result.width}&times;{result.height}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
