"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Download, Trash2, Clock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { downloadImage, formatRelativeTime } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
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
        <p className="text-muted-foreground">Loading history...</p>
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No images yet</h3>
        <p className="text-muted-foreground">Generate your first image above.</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Generation History</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((image) => (
          <Card key={image.id} className="group overflow-hidden">
            <CardContent className="p-0">
              <Dialog>
                <DialogTrigger asChild>
                  <div className="cursor-pointer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.image_url}
                      alt={image.prompt}
                      className="h-64 w-full object-cover transition-opacity group-hover:opacity-90"
                    />
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
              <div className="p-3">
                <p className="text-sm truncate">{image.prompt}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatRelativeTime(image.created_at)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
