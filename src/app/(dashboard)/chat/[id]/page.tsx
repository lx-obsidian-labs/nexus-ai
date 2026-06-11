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
import { Bot, Code2, Download } from "lucide-react"
import type { Conversation, Message, ChatModel } from "@/types"

export default function ConversationPage() {
  const params = useParams()
  const id = params.id as string
  const [mode, setMode] = useState<"chat" | "coding">("chat")
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
            <div className="flex items-center justify-between border-b px-6 py-3">
              <ModelSelector
                value={conversation.model as ChatModel}
                onChange={handleModelChange}
              />
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1.5">
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
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
                    <DropdownMenuItem onClick={() => {
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
                <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn("gap-1.5", mode === "chat" && "bg-background shadow-xs")}
                    onClick={() => setMode("chat")}
                  >
                    <Bot className="h-4 w-4" />
                    Chat
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn("gap-1.5", mode === "coding" && "bg-background shadow-xs")}
                    onClick={() => setMode("coding")}
                  >
                    <Code2 className="h-4 w-4" />
                    Coding
                  </Button>
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
