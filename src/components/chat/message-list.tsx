"use client"

import { useEffect, useRef } from "react"
import { MessageBubble } from "./message-bubble"
import { MessageSquare } from "lucide-react"
import type { Message } from "@/types"

interface MessageListProps {
  messages: Message[]
  isStreaming: boolean
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <MessageSquare className="h-7 w-7 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold">Start a conversation</h2>
          <p className="text-sm text-muted-foreground">
            Choose a model from the sidebar and type a message below to begin.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {["Ask a question", "Write code", "Explain something", "Brainstorm ideas"].map((hint) => (
              <span
                key={hint}
                className="rounded-full border bg-muted/50 px-3 py-1 text-xs text-muted-foreground"
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
          <div className="flex items-center gap-2 text-muted-foreground px-4">
            <div className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-primary animate-bounce" />
              <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0.1s]" />
              <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
