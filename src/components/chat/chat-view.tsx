"use client"

import { ChatInput } from "@/components/chat/chat-input"
import { MessageList } from "@/components/chat/message-list"
import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { FilePanel } from "@/components/chat/file-panel"
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
import { useChatStore } from "@/store"
import { Bot, Code2, Download, Globe, Briefcase, FileCode } from "lucide-react"
import type { Conversation, Message, ChatModel, ChatMode } from "@/types"

const MODES: { value: ChatMode; label: string; icon: typeof Bot }[] = [
  { value: "chat", label: "Chat", icon: Bot },
  { value: "coding", label: "Coding", icon: Code2 },
  { value: "websearch", label: "Web Search", icon: Globe },
  { value: "research", label: "Research", icon: Briefcase },
]

interface ChatViewProps {
  conversation: Conversation | null
  messages: Message[]
  onSelectConversation: (conv: Conversation, msgs: Message[]) => void
  onNewConversation: () => void
  onConversationChange: (conv: Conversation) => void
  onMessagesChange: (msgs: Message[]) => void
}

export function ChatView({
  conversation,
  messages,
  onSelectConversation,
  onNewConversation,
  onConversationChange,
  onMessagesChange,
}: ChatViewProps) {
  const [mode, setMode] = useState<ChatMode>("chat")
  const [isStreaming, setIsStreaming] = useState(false)
  const [filePanelOpen, setFilePanelOpen] = useState(false)
  const selectedModel = useChatStore((s) => s.selectedModel)
  const setSelectedModel = useChatStore((s) => s.setSelectedModel)

  const handleModelChange = (model: ChatModel) => {
    setSelectedModel(model)
    if (conversation) {
      onConversationChange({ ...conversation, model })
    }
  }

  return (
    <div className="flex h-full">
      <ChatSidebar
        currentConversationId={conversation?.id}
        onSelect={onSelectConversation}
        onNew={onNewConversation}
      />
      <div className="flex flex-1 flex-col">
        <div className="glass border-b border-white/5 py-3 shrink-0 md:px-6 px-4 pl-14 md:pl-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              {!conversation && (
                <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                  <Bot className="h-4 w-4" />
                  <span>New conversation</span>
                </div>
              )}
              <ModelSelector
                value={conversation?.model ?? selectedModel ?? "auto"}
                onChange={handleModelChange}
              />
            </div>
            <div className="flex items-center gap-2">
              {conversation && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("gap-1.5 rounded-xl", filePanelOpen && "bg-background shadow-xs")}
                  onClick={() => setFilePanelOpen(!filePanelOpen)}
                >
                  <FileCode className="h-4 w-4" />
                  <span className="hidden sm:inline">Files</span>
                </Button>
              )}
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
        </div>
        <MessageList messages={messages} isStreaming={isStreaming} mode={mode} conversationId={conversation?.id} />
        <ChatInput
          mode={mode}
          conversation={conversation}
          messages={messages}
          onMessagesChange={onMessagesChange}
          onStreamingChange={setIsStreaming}
          onConversationChange={onConversationChange}
        />
      </div>
      <FilePanel
        conversationId={conversation?.id}
        open={filePanelOpen}
        onToggle={() => setFilePanelOpen(!filePanelOpen)}
      />
    </div>
  )
}
