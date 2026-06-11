"use client"

import DashboardShell from "@/components/dashboard/shell"
import { ImageGenerator } from "@/components/images/image-generator"
import { ImageGallery } from "@/components/images/image-gallery"

export default function ImagesPage() {
  return (
    <DashboardShell>
      <div className="container mx-auto max-w-6xl space-y-8 px-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">AI Image Generator</h1>
          <p className="text-muted-foreground mt-2">
            Generate stunning images with cutting-edge AI models.
          </p>
        </div>
        <ImageGenerator />
        <ImageGallery />
      </div>
    </DashboardShell>
  )
}
