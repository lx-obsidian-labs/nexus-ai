"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { MessageBubble } from "./message-bubble"
import { MessageSquare, Bot, Globe, Briefcase, Code2, ArrowDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { Message, ChatMode } from "@/types"

interface MessageListProps {
  messages: Message[]
  isStreaming: boolean
  mode?: ChatMode
  conversationId?: string
}

const emptyStates: Record<ChatMode, { icon: typeof Bot; title: string; desc: string; hints: string[] }> = {
  chat: {
    icon: MessageSquare,
    title: "Start a conversation",
    desc: "Type a message below to begin chatting.",
    hints: ["Ask a question", "Tell me a story", "Explain a concept", "Help me decide"],
  },
  coding: {
    icon: Code2,
    title: "What do you want to build?",
    desc: "Describe the code or project you need help with.",
    hints: ["Write a React component", "Debug this error", "Build an API", "Review my code"],
  },
  websearch: {
    icon: Globe,
    title: "Search the web",
    desc: "Ask a question and I'll search the web for current information.",
    hints: ["Latest tech news", "Today's weather", "Recent AI developments", "Compare products"],
  },
  research: {
    icon: Briefcase,
    title: "Research & Planning",
    desc: "Ask for market analysis, architecture planning, or strategic advice.",
    hints: ["Market analysis", "System architecture", "Business strategy", "Risk assessment"],
  },
  agent: {
    icon: Briefcase,
    title: "Agent Mode",
    desc: "I'll autonomously build, code, create files, and complete tasks for you.",
    hints: ["Build a React app", "Create an API server", "Generate a full project", "Automate a workflow"],
  },
}

function isNearBottom(element: HTMLElement, threshold = 100): boolean {
  return element.scrollHeight - element.scrollTop - element.clientHeight < threshold
}

export function MessageList({ messages, isStreaming, mode = "chat", conversationId }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const userNearBottomRef = useRef(true)
  const [showScrollBtn, setShowScrollBtn] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    if (userNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  useEffect(() => {
    if (isStreaming && userNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [isStreaming])

  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const near = isNearBottom(container)
    userNearBottomRef.current = near
    setShowScrollBtn(!near)
  }, [])

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    userNearBottomRef.current = true
    setShowScrollBtn(false)
  }, [])

  if (messages.length === 0) {
    const state = emptyStates[mode] || emptyStates.chat
    const Icon = state.icon

    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center space-y-6 max-w-sm">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10">
              <Icon className="h-10 w-10 text-primary/60" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">{state.title}</h2>
            <p className="text-sm text-muted-foreground">{state.desc}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {state.hints.map((hint) => (
              <span
                key={hint}
                className="glass rounded-full px-3 py-1.5 text-xs text-muted-foreground"
              >
                {hint}
              </span>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto"
      >
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} conversationId={conversationId} />
          ))}
          {isStreaming && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-muted-foreground px-4 py-2"
            >
              <div className="flex gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" />
                <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0.12s]" />
                <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0.24s]" />
              </div>
              <span className="text-xs text-muted-foreground/60">Generating response...</span>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>
      <AnimatePresence>
        {showScrollBtn && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2"
          >
            <Button
              onClick={scrollToBottom}
              size="sm"
              className="h-8 rounded-full shadow-lg gap-1.5"
            >
              <ArrowDown className="h-3.5 w-3.5" />
              New messages
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
