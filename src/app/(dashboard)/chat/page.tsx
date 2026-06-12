"use client"

import DashboardShell from "@/components/dashboard/shell"
import { ChatView } from "@/components/chat/chat-view"
import { useState } from "react"
import type { Conversation, Message } from "@/types"

export default function ChatPage() {
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])

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
