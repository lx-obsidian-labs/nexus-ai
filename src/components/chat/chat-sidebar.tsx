"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn, formatRelativeTime, truncate } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Plus, MessageSquare, Trash2, Pencil, Check, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { Conversation, Message } from "@/types"

interface ChatSidebarProps {
  currentConversationId?: string
  onSelect: (conversation: Conversation, messages: Message[]) => void
  onNew?: () => void
}

export function ChatSidebar({ currentConversationId, onSelect, onNew }: ChatSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")

  useEffect(() => {
    const supabase = createClient()
    loadConversations()

    const channel = supabase
      .channel("conversations")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => {
        loadConversations()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadConversations() {
    const supabase = createClient()
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .order("updated_at", { ascending: false })

    if (data) setConversations(data)
  }

  const handleSelect = async (conv: Conversation) => {
    const supabase = createClient()
    const { data: messages } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true })

    onSelect(conv, messages ?? [])
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const supabase = createClient()
    await supabase.from("conversations").delete().eq("id", id)
    loadConversations()
  }

  const handleRename = async (id: string) => {
    if (!editTitle.trim()) return
    const supabase = createClient()
    await supabase.from("conversations").update({ title: editTitle }).eq("id", id)
    setEditingId(null)
    loadConversations()
  }

  return (
    <div className="flex w-72 flex-col border-r">
      <div className="p-3">
        <Button onClick={onNew} className="w-full justify-start gap-2" variant="outline">
          <Plus className="h-4 w-4" />
          New conversation
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1 px-2 pb-2">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => handleSelect(conv)}
              className={cn(
                "group flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent",
                conv.id === currentConversationId && "bg-accent",
              )}
            >
              <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
              {editingId === conv.id ? (
                <div className="flex flex-1 items-center gap-1">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-7 text-sm"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(conv.id)
                      if (e.key === "Escape") setEditingId(null)
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => { e.stopPropagation(); handleRename(conv.id) }}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => { e.stopPropagation(); setEditingId(null) }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <span className="flex-1 truncate">{conv.title}</span>
                  <span className="text-xs text-muted-foreground hidden group-hover:block">
                    {formatRelativeTime(conv.updated_at)}
                  </span>
                  <div className="hidden group-hover:flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingId(conv.id)
                        setEditTitle(conv.title)
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={(e) => handleDelete(conv.id, e)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
