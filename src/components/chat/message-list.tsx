"use client"

import { useEffect, useRef } from "react"
import { MessageBubble } from "./message-bubble"
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
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold">Start a conversation</h2>
          <p className="text-muted-foreground">Type a message below to begin.</p>
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
