import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles, MessageSquare, Image, ArrowRight, Bot, Zap, Shield } from "lucide-react"
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants"

const features = [
  {
    icon: Bot,
    title: "AI Chat",
    description: "Have intelligent conversations with Llama 3, DeepSeek, Mistral, Qwen, and MiniMax models. Switch models mid-conversation with real-time streaming.",
    highlights: ["Multiple AI models", "Real-time streaming", "Chat history & search"],
  },
  {
    icon: Image,
    title: "Image Generation",
    description: "Generate stunning images with FLUX Schnell, FLUX Dev, and Stable Diffusion XL. Download, regenerate, and keep a history of all your creations.",
    highlights: ["Multiple image models", "High-resolution output", "Generation history"],
  },
]

const stats = [
  { label: "AI Models", value: "6+" },
  { label: "Response Time", value: "< 2s" },
  { label: "Uptime", value: "99.9%" },
]

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b bg-background/80 backdrop-blur-lg px-6">
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
        <section className="relative overflow-hidden px-6 pt-32 pb-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
          <div className="container mx-auto flex flex-col items-center text-center relative">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Powered by NVIDIA NIM
            </div>
            <h1 className="max-w-4xl text-5xl font-bold tracking-tight sm:text-7xl">
              Your All-in-One{" "}
              <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                AI Platform
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
              {APP_DESCRIPTION}. Chat with advanced language models and generate stunning images with cutting-edge AI.
            </p>
            <div className="mt-10 flex items-center gap-4">
              <Button size="lg" className="shadow-lg shadow-primary/25" asChild>
                <Link href="/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-6 py-20">
          <div className="grid gap-8 md:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="group relative rounded-xl border bg-card p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-semibold mb-3">{feature.title}</h2>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {feature.description}
                  </p>
                  <ul className="space-y-2">
                    {feature.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">&#10003;</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </section>

        <section className="border-y bg-muted/30 px-6 py-16">
          <div className="container mx-auto">
            <div className="grid grid-cols-3 gap-8 text-center">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-3xl font-bold text-primary">{stat.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-6 py-24 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to Get Started?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Join thousands of users already leveraging AI to boost their productivity.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button size="lg" className="shadow-lg shadow-primary/25" asChild>
              <Link href="/signup">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <div className="container mx-auto flex flex-col items-center gap-2 sm:flex-row sm:justify-between px-6">
          <p>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
