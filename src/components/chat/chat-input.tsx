"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowUp, StopCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { generateId } from "@/lib/utils"
import { getDefaultSystemPrompt, getCodingSystemPrompt } from "@/lib/ai/chat"
import { toast } from "@/hooks/use-toast"
import type { Conversation, Message, ChatModel } from "@/types"

interface ChatInputProps {
  mode: "chat" | "coding"
  conversation: Conversation | null
  messages: Message[]
  onMessagesChange: (messages: Message[]) => void
  onStreamingChange: (isStreaming: boolean) => void
  onConversationChange: (conversation: Conversation) => void
}

export function ChatInput({
  mode,
  conversation,
  messages,
  onMessagesChange,
  onStreamingChange,
  onConversationChange,
}: ChatInputProps) {
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  const handleStop = useCallback(() => {
    abortRef.current?.abort()
    setIsStreaming(false)
    onStreamingChange(false)
  }, [onStreamingChange])

  const handleSubmit = useCallback(async () => {
    const content = input.trim()
    if (!content || isStreaming) return

    setInput("")
    setIsStreaming(true)
    onStreamingChange(true)

    const supabase = createClient()
    const model = conversation?.model ?? "meta/llama-3.1-70b-instruct"

    try {
      let convId = conversation?.id

      if (!convId) {
        const { data: user } = await supabase.auth.getUser()
        if (!user.user) throw new Error("Not authenticated")

        const title = content.length > 50 ? content.slice(0, 50) + "..." : content
        const { data: newConv } = await supabase
          .from("conversations")
          .insert({ user_id: user.user.id, title, model })
          .select()
          .single()

        if (newConv) {
          convId = newConv.id
          onConversationChange(newConv)
          window.history.replaceState(null, "", `/chat/${newConv.id}`)
        }
      }

      if (!convId) throw new Error("Failed to create conversation")

      const userMessage: Message = {
        id: generateId(),
        conversation_id: convId,
        role: "user",
        content,
        metadata: null,
        created_at: new Date().toISOString(),
      }

      await supabase.from("messages").insert({
        id: userMessage.id,
        conversation_id: convId,
        role: "user",
        content,
      })

      const assistantMessage: Message = {
        id: generateId(),
        conversation_id: convId,
        role: "assistant",
        content: "",
        metadata: null,
        created_at: new Date().toISOString(),
      }

      const updatedMessages = [...messages, userMessage, assistantMessage]
      onMessagesChange(updatedMessages)

      const apiMessages = [
        { role: "system" as const, content: mode === "coding" ? getCodingSystemPrompt() : getDefaultSystemPrompt() },
        ...updatedMessages
          .filter((m) => m.role !== "system")
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      ]

      abortRef.current = new AbortController()

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages: apiMessages }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) {
        const errBody = await response.text().catch(() => "")
        throw new Error(errBody || `API error: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No reader")

      const decoder = new TextDecoder()
      let fullContent = ""
      let streamError: string | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value, { stream: true })
        const lines = text.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") continue
            try {
              const parsed = JSON.parse(data)
              if (parsed.error) {
                streamError = parsed.error
                continue
              }
              fullContent += parsed.content ?? ""
              onMessagesChange(
                updatedMessages.map((m) =>
                  m.id === assistantMessage.id ? { ...m, content: fullContent } : m,
                ),
              )
            } catch {
              continue
            }
          }
        }
      }

      if (!fullContent && streamError) {
        throw new Error(streamError)
      }

      await supabase.from("messages").insert({
        id: assistantMessage.id,
        conversation_id: convId,
        role: "assistant",
        content: fullContent,
      })
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      const msg = err instanceof Error ? err.message : "Chat failed"
      toast({ title: "Chat error", description: msg, variant: "destructive" })
    } finally {
      setIsStreaming(false)
      onStreamingChange(false)
      abortRef.current = null
    }
  }, [input, isStreaming, conversation, messages, onMessagesChange, onStreamingChange, onConversationChange])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="border-t bg-gradient-to-t from-background to-transparent px-4 py-4 pt-6">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[48px] max-h-[200px] resize-none rounded-xl border bg-muted/50 pr-12 pl-4 py-3 shadow-xs transition-shadow focus-visible:shadow-sm focus-visible:shadow-primary/10"
            rows={1}
            disabled={isStreaming}
          />
          {isStreaming ? (
            <Button
              size="icon"
              variant="secondary"
              onClick={handleStop}
              className="absolute right-1.5 bottom-1.5 h-8 w-8 rounded-lg"
            >
              <StopCircle className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="absolute right-1.5 bottom-1.5 h-8 w-8 rounded-lg"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
