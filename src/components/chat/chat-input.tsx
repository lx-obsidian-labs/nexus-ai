"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowUp, StopCircle, Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { generateId } from "@/lib/utils"
import { getDefaultSystemPrompt, getCodingSystemPrompt, getWebSearchSystemPrompt, getResearchSystemPrompt } from "@/lib/ai/chat"
import { toast } from "@/hooks/use-toast"
import type { Conversation, Message, ChatModel, ChatMode } from "@/types"

interface ChatInputProps {
  mode: ChatMode
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

  const [improving, setImproving] = useState(false)

  const handleImprove = useCallback(async () => {
    const content = input.trim()
    if (!content || improving) return

    setImproving(true)
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: conversation?.model ?? "meta/llama-3.1-70b-instruct",
          messages: [
            { role: "system", content: "You are a prompt engineering expert. Rewrite the user's message to be more detailed, specific, and effective. Return ONLY the improved prompt, no explanations." },
            { role: "user", content },
          ],
        }),
      })

      if (!response.ok) throw new Error("Failed to improve prompt")

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No reader")

      const decoder = new TextDecoder()
      let improved = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value, { stream: true })
        for (const line of text.split("\n")) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") continue
            try {
              const parsed = JSON.parse(data)
              improved += parsed.content ?? ""
            } catch { continue }
          }
        }
      }

      if (improved) setInput(improved)
    } catch {
      toast({ title: "Failed to improve prompt", variant: "destructive" })
    } finally {
      setImproving(false)
    }
  }, [input, improving, conversation?.model])

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

      let systemPrompt = getDefaultSystemPrompt()
      if (mode === "coding") systemPrompt = getCodingSystemPrompt()
      else if (mode === "websearch") systemPrompt = getWebSearchSystemPrompt()
      else if (mode === "research") systemPrompt = getResearchSystemPrompt()

      let searchContext = ""
      if (mode === "websearch") {
        const searchRes = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: content }),
        })
        const searchData = await searchRes.json()
        if (searchData.results?.length > 0) {
          searchContext = "\n\nWeb search results:\n" + searchData.results.map((r: any, i: number) =>
            `[${i + 1}] ${r.title}\n${r.snippet}\nURL: ${r.link}`
          ).join("\n\n")
        } else if (searchData.error) {
          searchContext = `\n\n[Note: Web search unavailable - ${searchData.error}]`
        }
      }

      const apiMessages = [
        { role: "system" as const, content: systemPrompt + (searchContext ? `\n\n${searchContext}` : "") },
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
    <div className="border-t border-white/5 bg-gradient-to-t from-background via-background to-transparent px-4 py-4 pt-6">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <div className="relative flex-1">
          <div className="glass rounded-2xl p-1">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="min-h-[48px] max-h-[200px] resize-none rounded-xl border-0 bg-transparent pr-12 pl-4 py-3 shadow-none transition-all placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0"
              rows={1}
              disabled={isStreaming}
            />
          </div>
          {isStreaming ? (
            <Button
              size="icon"
              variant="secondary"
              onClick={handleStop}
              className="absolute right-2 bottom-2 h-8 w-8 rounded-xl bg-destructive/90 hover:bg-destructive"
            >
              <StopCircle className="h-4 w-4" />
            </Button>
          ) : (
            <>
              {input.trim() && !improving && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleImprove}
                  className="absolute right-11 bottom-2 h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-background/50"
                  title="Improve prompt"
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="icon"
                onClick={handleSubmit}
                disabled={!input.trim()}
                className="absolute right-2 bottom-2 h-8 w-8 rounded-xl"
              >
                {improving ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <ArrowUp className="h-4 w-4" />
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
