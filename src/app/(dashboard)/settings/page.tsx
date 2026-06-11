"use client"

import DashboardShell from "@/components/dashboard/shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"
import { CHAT_MODELS, IMAGE_MODELS } from "@/lib/constants"
import type { User } from "@supabase/supabase-js"
import type { ChatModel, ImageModel } from "@/types"

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [fullName, setFullName] = useState("")
  const [defaultChatModel, setDefaultChatModel] = useState<ChatModel>("meta/llama-3.1-70b-instruct")
  const [defaultImageModel, setDefaultImageModel] = useState<ImageModel>("black-forest-labs/flux-schnell")
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
          setDefaultImageModel(settings.default_image_model as ImageModel)
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
      default_image_model: defaultImageModel,
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
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="container mx-auto max-w-2xl space-y-8 px-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account and preferences.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user?.user_metadata?.avatar_url ?? ""} />
                <AvatarFallback className="text-lg">
                  {(user?.email?.[0] ?? "U").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user?.email}</p>
                <p className="text-sm text-muted-foreground">
                  Member since{" "}
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Default Models</CardTitle>
            <CardDescription>Choose your preferred AI models</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Default chat model</Label>
              <Select value={defaultChatModel} onValueChange={(v) => setDefaultChatModel(v as ChatModel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHAT_MODELS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Default image model</Label>
              <Select value={defaultImageModel} onValueChange={(v) => setDefaultImageModel(v as ImageModel)}>
                <SelectTrigger>
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
          </CardContent>
        </Card>

        <Button onClick={handleSave}>Save changes</Button>
      </div>
    </DashboardShell>
  )
}
