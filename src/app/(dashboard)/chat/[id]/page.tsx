"use client"

import DashboardShell from "@/components/dashboard/shell"
import { ChatInput } from "@/components/chat/chat-input"
import { MessageList } from "@/components/chat/message-list"
import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { ModelSelector } from "@/components/chat/model-selector"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn, downloadAsFile, formatConversationAsMarkdown, formatConversationAsJson } from "@/lib/utils"
import { Bot, Code2, Download, Globe, Briefcase } from "lucide-react"
import type { Conversation, Message, ChatModel, ChatMode } from "@/types"

const MODES: { value: ChatMode; label: string; icon: typeof Bot }[] = [
  { value: "chat", label: "Chat", icon: Bot },
  { value: "coding", label: "Coding", icon: Code2 },
  { value: "websearch", label: "Web Search", icon: Globe },
  { value: "research", label: "Research", icon: Briefcase },
]

export default function ConversationPage() {
  const params = useParams()
  const id = params.id as string
  const [mode, setMode] = useState<ChatMode>("chat")
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: conv } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", id)
        .single()

      if (conv) {
        setConversation(conv)

        const { data: msgs } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", id)
          .order("created_at", { ascending: true })

        setMessages(msgs ?? [])
      }

      setLoading(false)
    }

    load()
  }, [id])

  const handleModelChange = (model: ChatModel) => {
    if (conversation) {
      setConversation({ ...conversation, model })
    }
  }

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground">Loading conversation...</p>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="flex h-full">
        <ChatSidebar
          currentConversationId={conversation?.id}
          onSelect={(conv, msgs) => { setConversation(conv); setMessages(msgs) }}
        />
        <div className="flex flex-1 flex-col">
          {conversation && (
            <div className="glass border-b border-white/5 px-6 py-3 flex items-center justify-between shrink-0">
              <ModelSelector
                value={conversation.model as ChatModel}
                onChange={handleModelChange}
              />
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1.5 rounded-xl">
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem className="rounded-lg" onClick={() => {
                      const md = formatConversationAsMarkdown(
                        conversation?.title ?? "Conversation",
                        conversation?.model ?? "unknown",
                        conversation?.created_at ?? new Date().toISOString(),
                        messages.map(m => ({ role: m.role, content: m.content })),
                      )
                      downloadAsFile(md, `${conversation?.title ?? "conversation"}.md`)
                    }}>
                      Export as Markdown
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-lg" onClick={() => {
                      const json = formatConversationAsJson(
                        conversation?.title ?? "Conversation",
                        conversation?.model ?? "unknown",
                        conversation?.created_at ?? new Date().toISOString(),
                        messages.map(m => ({ role: m.role, content: m.content })),
                      )
                      downloadAsFile(json, `${conversation?.title ?? "conversation"}.json`, "application/json")
                    }}>
                      Export as JSON
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-background/50 p-0.5">
                  {MODES.map((m) => {
                    const Icon = m.icon
                    return (
                      <Button
                        key={m.value}
                        variant="ghost"
                        size="sm"
                        className={cn("gap-1.5 rounded-lg", mode === m.value && "bg-background shadow-xs")}
                        onClick={() => setMode(m.value)}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{m.label}</span>
                      </Button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
          <MessageList messages={messages} isStreaming={isStreaming} />
          <ChatInput
            mode={mode}
            conversation={conversation}
            messages={messages}
            onMessagesChange={setMessages}
            onStreamingChange={setIsStreaming}
            onConversationChange={setConversation}
          />
        </div>
      </div>
    </DashboardShell>
  )
}
