"use client"

import DashboardShell from "@/components/dashboard/shell"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"
import { CHAT_MODELS } from "@/lib/constants"
import { Settings2, User as UserIcon, Cpu, Sparkles } from "lucide-react"
import type { User } from "@supabase/supabase-js"
import type { ChatModel } from "@/types"

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [fullName, setFullName] = useState("")
  const [defaultChatModel, setDefaultChatModel] = useState<ChatModel>("meta/llama-3.1-70b-instruct")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: settings } = await supabase
          .from("user_settings")
          .select("*")
          .eq("id", user.id)
          .single()

        if (settings) {
          setDefaultChatModel(settings.default_chat_model as ChatModel)
        }

        setFullName(user.user_metadata?.full_name ?? "")
      }

      setLoading(false)
    }

    load()
  }, [])

  const handleSave = async () => {
    const supabase = createClient()

    await supabase.from("user_settings").upsert({
      id: user!.id,
      default_chat_model: defaultChatModel,
    })

    if (fullName) {
      await supabase.auth.updateUser({ data: { full_name: fullName } })
      await supabase.from("profiles").update({ full_name: fullName }).eq("id", user!.id)
    }

    toast({ title: "Settings saved", variant: "success" })
  }

  if (loading) {
    return (
      <DashboardShell>
        <div className="container mx-auto max-w-2xl px-6 py-8">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Loading settings...</span>
          </div>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="container mx-auto max-w-2xl space-y-6 md:space-y-8 px-4 md:px-6 py-6 md:py-8">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 shrink-0">
            <Settings2 className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-0.5 md:mt-1 text-sm md:text-base">Manage your account and preferences.</p>
          </div>
        </div>

        <div className="glass-card p-4 md:p-6 space-y-4 md:space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <UserIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Profile</h2>
              <p className="text-sm text-muted-foreground">Your personal information</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
            <Avatar className="h-14 w-14 md:h-16 md:w-16 ring-2 ring-primary/20 shrink-0">
              <AvatarImage src={user?.user_metadata?.avatar_url ?? ""} />
              <AvatarFallback className="text-base md:text-lg bg-primary/10 text-primary">
                {(user?.email?.[0] ?? "U").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-base md:text-lg">{user?.email}</p>
              <p className="text-xs md:text-sm text-muted-foreground">
                Member since{" "}
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
                  : "N/A"}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium">Full name</label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="bg-background/50"
            />
          </div>
        </div>

        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Cpu className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Default Models</h2>
              <p className="text-sm text-muted-foreground">Choose your preferred AI models</p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Default chat model</label>
            <select
              value={defaultChatModel}
              onChange={(e) => setDefaultChatModel(e.target.value as ChatModel)}
              className="flex h-10 w-full rounded-xl border border-white/10 bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {CHAT_MODELS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        <Button
          onClick={handleSave}
          className="w-full h-11 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Save changes
        </Button>
      </div>
    </DashboardShell>
  )
}
