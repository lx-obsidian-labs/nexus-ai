import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles, MessageSquare, Globe, Briefcase, ArrowRight, Bot, Code2, Zap, Shield, Activity } from "lucide-react"
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants"

const features = [
  {
    icon: MessageSquare,
    title: "AI Chat",
    description: "Have intelligent conversations with Llama 3, DeepSeek, Mistral, Qwen, and MiniMax models. Switch models mid-conversation with real-time streaming.",
    highlights: ["Multiple AI models", "Real-time streaming", "Chat history & search"],
  },
  {
    icon: Code2,
    title: "Coding Agent",
    description: "Expert programming assistant that helps you write, debug, explain, and refactor code across all major languages.",
    highlights: ["Full code generation", "Multi-language support", "Best practices"],
  },
  {
    icon: Globe,
    title: "Web Search",
    description: "Search the web in real-time and get AI-powered answers with cited sources and up-to-date information.",
    highlights: ["Real-time search", "Source citations", "Current information"],
  },
  {
    icon: Briefcase,
    title: "Research & Planning",
    description: "Strategic analysis, market research, architecture planning, and business recommendations with structured outputs.",
    highlights: ["Market analysis", "Architecture planning", "Strategic recommendations"],
  },
]

const stats = [
  { label: "AI Models", value: "5", icon: Activity },
  { label: "Response Time", value: "< 2s", icon: Zap },
  { label: "Uptime", value: "99.9%", icon: Shield },
]

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b bg-background/80 backdrop-blur-xl px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          <span className="text-gradient text-sm md:text-lg">{APP_NAME}</span>
        </Link>
        <div className="flex items-center gap-2 md:gap-3">
          <Button variant="ghost" className="rounded-full text-sm h-9 md:h-10" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button className="rounded-full shadow-lg shadow-primary/25 text-sm h-9 md:h-10" asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden px-4 md:px-6 pt-28 md:pt-36 pb-16 md:pb-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-primary/5 to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />
          <div className="container mx-auto flex flex-col items-center text-center relative">
            <div className="mb-6 glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs md:text-sm text-muted-foreground">
              <Sparkles className="h-3 w-3 md:h-3.5 md:w-3.5 text-primary" />
              Powered by NVIDIA NIM
            </div>
            <h1 className="max-w-4xl text-3xl md:text-5xl lg:text-7xl font-bold tracking-tight">
              Your All-in-One{" "}
              <span className="text-gradient">
                AI Platform
              </span>
            </h1>
            <p className="mt-4 md:mt-6 max-w-2xl text-base md:text-lg text-muted-foreground px-2">
              {APP_DESCRIPTION}.
            </p>
            <div className="mt-8 md:mt-10 flex flex-col sm:flex-row items-center gap-3 md:gap-4">
              <Button size="default" className="w-full sm:w-auto rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300" asChild>
                <Link href="/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="default" variant="outline" className="w-full sm:w-auto rounded-full" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 md:px-6 py-16 md:py-24">
          <div className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="group glass-card p-6 md:p-8 transition-all duration-500 hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30">
                  <div className="mb-4 flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-all duration-300 group-hover:scale-110">
                    <Icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-semibold mb-3">{feature.title}</h2>
                  <p className="text-muted-foreground mb-6 leading-relaxed text-sm md:text-base">
                    {feature.description}
                  </p>
                  <ul className="space-y-2 md:space-y-3">
                    {feature.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary shrink-0">&#10003;</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </section>

        <section className="border-y bg-muted/30 px-4 md:px-6 py-16 md:py-20">
          <div className="container mx-auto">
            <div className="grid grid-cols-3 gap-8 md:gap-12 text-center">
              {stats.map((stat) => {
                const Icon = stat.icon
                return (
                  <div key={stat.label} className="group">
                    <div className="mb-3 inline-flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-primary/10 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-gradient">{stat.value}</p>
                    <p className="mt-1 text-xs md:text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 md:px-6 py-16 md:py-24 text-center">
          <div className="glass-card mx-auto max-w-2xl p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
              Ready to Get Started?
            </h2>
            <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-md mx-auto">
              Join thousands of users already leveraging AI to boost their productivity.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Button size="default" className="w-full sm:w-auto rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300" asChild>
                <Link href="/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 md:py-8 text-center text-xs md:text-sm text-muted-foreground">
        <div className="container mx-auto flex flex-col items-center gap-2 sm:flex-row sm:justify-between px-4 md:px-6">
          <p>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
          <div className="flex items-center gap-4 md:gap-6">
            <Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
