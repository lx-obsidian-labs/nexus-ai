import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles, MessageSquare, Image, ArrowRight } from "lucide-react"
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between border-b px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <Sparkles className="h-6 w-6 text-primary" />
          {APP_NAME}
        </Link>
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto flex flex-col items-center justify-center px-6 py-24 text-center">
          <h1 className="max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl">
            Your All-in-One{" "}
            <span className="text-primary">AI Platform</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            {APP_DESCRIPTION}. Chat with advanced language models and generate stunning images with cutting-edge AI.
          </p>
          <div className="mt-10 flex items-center gap-4">
            <Button size="lg" asChild>
              <Link href="/signup">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </section>

        <section className="container mx-auto px-6 py-20">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-xl border bg-card p-8">
              <MessageSquare className="h-10 w-10 text-primary mb-4" />
              <h2 className="text-2xl font-semibold mb-3">AI Chat</h2>
              <p className="text-muted-foreground mb-6">
                Have intelligent conversations with Llama 3, DeepSeek, Mistral, and Qwen models.
                Switch models mid-conversation and enjoy markdown-formatted responses.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">&#10003; Multiple AI models</li>
                <li className="flex items-center gap-2">&#10003; Real-time streaming</li>
                <li className="flex items-center gap-2">&#10003; Chat history & search</li>
              </ul>
            </div>
            <div className="rounded-xl border bg-card p-8">
              <Image className="h-10 w-10 text-primary mb-4" />
              <h2 className="text-2xl font-semibold mb-3">Image Generation</h2>
              <p className="text-muted-foreground mb-6">
                Generate stunning images with FLUX Schnell, FLUX Dev, and Stable Diffusion XL.
                Download, regenerate, and keep a history of all your creations.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">&#10003; Multiple image models</li>
                <li className="flex items-center gap-2">&#10003; High-resolution output</li>
                <li className="flex items-center gap-2">&#10003; Generation history</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
      </footer>
    </div>
  )
}
