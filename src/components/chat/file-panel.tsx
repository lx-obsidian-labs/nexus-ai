"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { cn, downloadAsFile } from "@/lib/utils"
import { FileCode, FileText, Download, Trash2, X, PanelRightClose, Archive, FileJson, FileType } from "lucide-react"
import type { GeneratedFile } from "@/types"

interface FilePanelProps {
  conversationId: string | undefined
  open: boolean
  onToggle: () => void
}

const languageIcons: Record<string, typeof FileCode> = {
  typescript: FileCode,
  javascript: FileCode,
  tsx: FileCode,
  jsx: FileCode,
  python: FileCode,
  rust: FileCode,
  go: FileCode,
  html: FileType,
  css: FileType,
  json: FileJson,
  xml: FileCode,
  yaml: FileCode,
  markdown: FileText,
  sql: FileCode,
  bash: FileCode,
  shell: FileCode,
}

function getFileIcon(language: string) {
  const Icon = languageIcons[language.toLowerCase()] ?? FileCode
  return Icon
}

export function FilePanel({ conversationId, open, onToggle }: FilePanelProps) {
  const [files, setFiles] = useState<GeneratedFile[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !conversationId) return
    loadFiles()
  }, [open, conversationId])

  async function loadFiles() {
    if (!conversationId) return
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from("generated_files")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
    if (data) setFiles(data)
    setLoading(false)
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    await supabase.from("generated_files").delete().eq("id", id)
    setFiles((prev) => prev.filter((f) => f.id !== id))
    if (selected === id) setSelected(null)
  }

  async function handleDownloadAll() {
    if (files.length === 0) return
    try {
      const JSZip = (await import("jszip")).default
      const zip = new JSZip()
      files.forEach((f) => zip.file(f.filename, f.content))
      const blob = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `files-${conversationId?.slice(0, 8) ?? "export"}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch { /* fallback: download individually */ }
  }

  const selectedFile = files.find((f) => f.id === selected)

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="hidden md:flex flex-col border-l border-white/5 bg-sidebar-background overflow-hidden shrink-0"
          >
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3 shrink-0">
              <span className="text-sm font-medium">Files ({files.length})</span>
              <div className="flex items-center gap-1">
                {files.length > 1 && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDownloadAll} title="Download all as ZIP">
                    <Archive className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggle}>
                  <PanelRightClose className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : files.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-6 text-center">
                <div className="space-y-2">
                  <FileCode className="h-8 w-8 mx-auto text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground/60">No files yet</p>
                  <p className="text-[11px] text-muted-foreground/40">Save code blocks as files to see them here.</p>
                </div>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-0.5">
                  {files.map((file) => {
                    const Icon = getFileIcon(file.language)
                    const isSelected = selected === file.id
                    return (
                      <div
                        key={file.id}
                        onClick={() => setSelected(isSelected ? null : file.id)}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-xl px-3 py-2.5 cursor-pointer transition-all duration-200",
                          isSelected
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                        )}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0", isSelected && "text-primary")} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{file.filename}</p>
                          <p className="text-[10px] text-muted-foreground/50 truncate">
                            {new Date(file.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => { e.stopPropagation(); downloadAsFile(file.content, file.filename) }}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:bg-destructive/10"
                            onClick={(e) => { e.stopPropagation(); handleDelete(file.id) }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
            {selectedFile && (
              <div className="border-t border-white/5">
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
                  <span className="text-xs font-medium truncate">{selectedFile.filename}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelected(null)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <ScrollArea className="h-48">
                  <pre className="p-3 text-[11px] font-mono leading-relaxed whitespace-pre-wrap break-all text-muted-foreground/80">
                    {selectedFile.content}
                  </pre>
                </ScrollArea>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile floating toggle */}
      {conversationId && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "fixed bottom-20 right-3 z-30 md:hidden glass h-9 w-9 rounded-xl",
            open && "hidden",
          )}
          onClick={onToggle}
          title="Show files"
        >
          <FileCode className="h-4 w-4" />
        </Button>
      )}
    </>
  )
}
