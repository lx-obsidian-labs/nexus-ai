"use client"

import DashboardShell from "@/components/dashboard/shell"
import { ChatView } from "@/components/chat/chat-view"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Conversation, Message } from "@/types"

export default function ConversationPage() {
  const params = useParams()
  const id = params.id as string
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
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
      <ChatView
        conversation={conversation}
        messages={messages}
        onSelectConversation={(conv, msgs) => { setConversation(conv); setMessages(msgs) }}
        onNewConversation={() => { setConversation(null); setMessages([]) }}
        onConversationChange={setConversation}
        onMessagesChange={setMessages}
      />
    </DashboardShell>
  )
}
