"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Download, Trash2, Clock, ImageIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { downloadImage, formatRelativeTime } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import type { GeneratedImage } from "@/types"

export function ImageGallery() {
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadImages()
  }, [])

  async function loadImages() {
    const supabase = createClient()
    const { data } = await supabase
      .from("generated_images")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    if (data) setImages(data)
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    await supabase.from("generated_images").delete().eq("id", id)
    setImages((prev) => prev.filter((img) => img.id !== id))
    toast({ title: "Image deleted" })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Loading history...</span>
        </div>
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No images yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Generate your first image above. All your creations will appear here.
        </p>
      </motion.div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Generation History</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((image, i) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Dialog>
              <DialogTrigger asChild>
                <div className="group relative cursor-pointer overflow-hidden rounded-xl border bg-card transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
                  <div className="aspect-square overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.image_url}
                      alt={image.prompt}
                      className="h-full w-full object-cover transition-all duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-8 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <p className="text-sm font-medium text-white truncate">{image.prompt}</p>
                    <p className="text-xs text-white/70 mt-1">{formatRelativeTime(image.created_at)}</p>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle className="truncate">{image.prompt}</DialogTitle>
                  <DialogDescription>
                    {image.model} &middot; {image.width}x{image.height}
                    {image.seed != null && ` \u00B7 Seed: ${image.seed}`}
                    &nbsp; &middot; {formatRelativeTime(image.created_at)}
                  </DialogDescription>
                </DialogHeader>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.image_url}
                  alt={image.prompt}
                  className="w-full rounded-lg"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadImage(image.image_url, `nexus-${image.id.slice(0, 8)}.png`)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(image.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
