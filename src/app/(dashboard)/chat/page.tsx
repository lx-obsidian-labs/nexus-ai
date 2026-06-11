"use client"

import DashboardShell from "@/components/dashboard/shell"
import { ChatInput } from "@/components/chat/chat-input"
import { MessageList } from "@/components/chat/message-list"
import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { ModelSelector } from "@/components/chat/model-selector"
import { useState } from "react"
import type { Conversation, Message, ChatModel } from "@/types"

export default function ChatPage() {
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)

  const handleSelectConversation = (conv: Conversation, msgs: Message[]) => {
    setConversation(conv)
    setMessages(msgs)
  }

  const handleNewConversation = () => {
    setConversation(null)
    setMessages([])
  }

  const handleModelChange = (model: ChatModel) => {
    if (conversation) {
      setConversation({ ...conversation, model })
    }
  }

  return (
    <DashboardShell>
      <div className="flex h-full">
        <ChatSidebar
          currentConversationId={conversation?.id}
          onSelect={handleSelectConversation}
          onNew={handleNewConversation}
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
