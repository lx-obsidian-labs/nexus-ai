"use client"

import { useEffect, useRef } from "react"
import { MessageBubble } from "./message-bubble"
import { MessageSquare, Bot, Globe, Briefcase, Code2 } from "lucide-react"
import { motion } from "framer-motion"
import type { Message, ChatMode } from "@/types"

interface MessageListProps {
  messages: Message[]
  isStreaming: boolean
  mode?: ChatMode
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
}

export function MessageList({ messages, isStreaming, mode = "chat" }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

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
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
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
  )
}
