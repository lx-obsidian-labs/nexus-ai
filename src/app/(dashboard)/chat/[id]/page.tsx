"use client"

import DashboardShell from "@/components/dashboard/shell"
import { ChatInput } from "@/components/chat/chat-input"
import { MessageList } from "@/components/chat/message-list"
import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { ModelSelector } from "@/components/chat/model-selector"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Conversation, Message, ChatModel } from "@/types"

export default function ConversationPage() {
  const params = useParams()
  const id = params.id as string
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
            </div>
          )}
          <MessageList messages={messages} isStreaming={isStreaming} />
          <ChatInput
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
