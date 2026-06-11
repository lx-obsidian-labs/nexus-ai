"use client"

import DashboardShell from "@/components/dashboard/shell"
import { ImageGenerator } from "@/components/images/image-generator"
import { ImageGallery } from "@/components/images/image-gallery"
import { Sparkles } from "lucide-react"

export default function ImagesPage() {
  return (
    <DashboardShell>
      <div className="container mx-auto max-w-6xl space-y-10 px-6 py-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Image Generator</h1>
            <p className="text-muted-foreground mt-1">
              Generate stunning images with cutting-edge AI models.
            </p>
          </div>
        </div>
        <ImageGenerator />
        <ImageGallery />
      </div>
    </DashboardShell>
  )
}
