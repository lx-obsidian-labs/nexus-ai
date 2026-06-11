"use client"

import DashboardShell from "@/components/dashboard/shell"
import { ChatInput } from "@/components/chat/chat-input"
import { MessageList } from "@/components/chat/message-list"
import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { ModelSelector } from "@/components/chat/model-selector"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Bot, Code2 } from "lucide-react"
import type { Conversation, Message, ChatModel } from "@/types"

export type ChatMode = "chat" | "coding"

export default function ChatPage() {
  const [mode, setMode] = useState<ChatMode>("chat")
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
          <div className="flex items-center justify-between border-b px-6 py-3">
            <div className="flex items-center gap-2">
              <ModelSelector
                value={conversation?.model as ChatModel ?? "meta/llama-3.1-70b-instruct"}
                onChange={handleModelChange}
              />
            </div>
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
