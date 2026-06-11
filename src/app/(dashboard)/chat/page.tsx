"use client"

import DashboardShell from "@/components/dashboard/shell"
import { ChatInput } from "@/components/chat/chat-input"
import { MessageList } from "@/components/chat/message-list"
import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { ModelSelector } from "@/components/chat/model-selector"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn, downloadAsFile, formatConversationAsMarkdown, formatConversationAsJson } from "@/lib/utils"
import { Bot, Code2, Download, MessageSquare } from "lucide-react"
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
          <div className="glass border-b border-white/5 px-6 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              {!conversation && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span>New conversation</span>
                </div>
              )}
              <ModelSelector
                value={conversation?.model as ChatModel ?? "meta/llama-3.1-70b-instruct"}
                onChange={handleModelChange}
              />
            </div>
            <div className="flex items-center gap-2">
              {conversation && (
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
                        conversation.title,
                        conversation.model,
                        conversation.created_at,
                        messages.map(m => ({ role: m.role, content: m.content })),
                      )
                      downloadAsFile(md, `${conversation.title}.md`)
                    }}>
                      Export as Markdown
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-lg" onClick={() => {
                      const json = formatConversationAsJson(
                        conversation.title,
                        conversation.model,
                        conversation.created_at,
                        messages.map(m => ({ role: m.role, content: m.content })),
                      )
                      downloadAsFile(json, `${conversation.title}.json`, "application/json")
                    }}>
                      Export as JSON
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-background/50 p-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("gap-1.5 rounded-lg", mode === "chat" && "bg-background shadow-xs")}
                  onClick={() => setMode("chat")}
                >
                  <Bot className="h-4 w-4" />
                  Chat
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("gap-1.5 rounded-lg", mode === "coding" && "bg-background shadow-xs")}
                  onClick={() => setMode("coding")}
                >
                  <Code2 className="h-4 w-4" />
                  Coding
                </Button>
              </div>
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
