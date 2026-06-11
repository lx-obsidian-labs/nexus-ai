"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Download, Trash2, ImageIcon, X, ZoomIn } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { downloadImage, formatRelativeTime } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import type { GeneratedImage } from "@/types"

export function ImageGallery() {
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [loading, setLoading] = useState(true)
  const [previewImage, setPreviewImage] = useState<GeneratedImage | null>(null)

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
      <div className="flex items-center justify-center py-16">
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
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10">
          <ImageIcon className="h-10 w-10 text-primary/60" />
        </div>
        <h3 className="mt-6 text-xl font-semibold">No images yet</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          Generate your first image above. All your creations will appear here.
        </p>
      </motion.div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Generation History</h2>
        <span className="text-sm text-muted-foreground">{images.length} images</span>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((image, i) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <button
              onClick={() => setPreviewImage(image)}
              className="group relative w-full cursor-pointer overflow-hidden rounded-xl border border-white/5 bg-card transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 text-left"
            >
              <div className="aspect-square overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.image_url}
                  alt={image.prompt}
                  className="h-full w-full object-cover transition-all duration-500 group-hover:scale-110"
                  loading="lazy"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
                  <ZoomIn className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-4 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <p className="text-sm font-medium text-white truncate">{image.prompt}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-white/60">{formatRelativeTime(image.created_at)}</span>
                  <span className="text-xs text-white/40">&middot;</span>
                  <span className="text-xs text-white/60">{image.width}&times;{image.height}</span>
                </div>
              </div>
            </button>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {previewImage && (
          <Dialog open={!!previewImage} onOpenChange={(v) => { if (!v) setPreviewImage(null) }}>
            <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden rounded-2xl">
              <div className="relative">
                <DialogClose className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors">
                  <X className="h-4 w-4" />
                </DialogClose>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewImage.image_url}
                  alt={previewImage.prompt}
                  className="w-full max-h-[70vh] object-contain bg-background"
                />
              </div>
              <div className="p-6 space-y-4">
                <DialogHeader className="p-0">
                  <DialogTitle className="truncate text-lg">{previewImage.prompt}</DialogTitle>
                  <DialogDescription className="flex items-center gap-3 flex-wrap">
                    <span className="bg-primary/10 px-2 py-0.5 rounded-md text-xs font-medium text-primary">
                      {previewImage.model.split("/").pop()}
                    </span>
                    <span>{previewImage.width}&times;{previewImage.height}</span>
                    {previewImage.seed != null && <span>Seed: {previewImage.seed}</span>}
                    <span>{formatRelativeTime(previewImage.created_at)}</span>
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadImage(previewImage.image_url, `nexus-${previewImage.id.slice(0, 8)}.png`)}
                    className="rounded-xl"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      handleDelete(previewImage.id)
                      setPreviewImage(null)
                    }}
                    className="rounded-xl"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  )
}
