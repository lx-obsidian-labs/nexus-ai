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
    <div className="flex w-72 flex-col border-r border-white/5 bg-sidebar-background">
      <div className="p-3">
        <Button
          onClick={onNew}
          className="w-full justify-start gap-2 rounded-xl border-white/10 bg-background/50 hover:bg-background/80 transition-all duration-200"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          New conversation
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-0.5 px-2 pb-2">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => handleSelect(conv)}
              className={cn(
                "group flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                conv.id === currentConversationId
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
              )}
            >
              <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg shrink-0", conv.id === currentConversationId && "bg-primary/10")}>
                <MessageSquare className={cn("h-3.5 w-3.5", conv.id === currentConversationId && "text-primary")} />
              </div>
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
                    className="h-6 w-6 shrink-0"
                    onClick={(e) => { e.stopPropagation(); handleRename(conv.id) }}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={(e) => { e.stopPropagation(); setEditingId(null) }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <span className="flex-1 truncate">{conv.title}</span>
                  <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-background/50"
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
                      className="h-6 w-6 text-destructive hover:bg-destructive/10"
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
