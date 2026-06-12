"use client"

import { useState, useRef, useCallback } from "react"
import { Check, Copy, Terminal, Eye, ExternalLink, Save, FileCode } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"

interface CodeBlockProps {
  language: string
  code: string
  conversationId?: string
}

function PreviewDialog({ code, language, open, onOpenChange }: { code: string; language: string; open: boolean; onOpenChange: (v: boolean) => void }) {
  const sandboxSrc = `data:text/html;charset=utf-8,${encodeURIComponent(code)}`
  const isHtml = code.toLowerCase().includes("<!doctype") || code.toLowerCase().includes("<html") || code.toLowerCase().includes("<body")

  const fallbackSrc = `data:text/html;charset=utf-8,${encodeURIComponent(
    `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem;color:#333;background:#fff"><h2>Preview not available</h2><p>This code type (${language}) doesn't support live preview.</p><hr/><pre>${code.slice(0, 500)}</pre></body></html>`
  )}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
        <DialogTitle className="sr-only">Preview</DialogTitle>
        <div className="flex items-center justify-between border-b px-4 py-2 shrink-0">
          <span className="text-sm font-medium">Preview</span>
          <a
            href={sandboxSrc}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Open in new tab
          </a>
        </div>
        <iframe
          src={isHtml ? sandboxSrc : fallbackSrc}
          className="flex-1 w-full bg-white"
          sandbox="allow-scripts"
          title="Preview"
        />
      </DialogContent>
    </Dialog>
  )
}

export function CodeBlock({ language, code, conversationId }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showSaveInput, setShowSaveInput] = useState(false)
  const [fileName, setFileName] = useState(`code.${language || "txt"}`)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setToastVisible(true)
    setTimeout(() => {
      setCopied(false)
      setToastVisible(false)
    }, 1500)
  }

  const handleSave = useCallback(async () => {
    if (!conversationId || saving || !fileName.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversationId,
          filename: fileName.trim(),
          content: code,
          language: language || "",
        }),
      })
      if (!res.ok) throw new Error("Failed to save file")
      toast({ title: "File saved", description: fileName.trim(), variant: "success" })
      setShowSaveInput(false)
    } catch {
      toast({ title: "Failed to save file", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }, [conversationId, fileName, code, language, saving])

  const isPreviewable = ["html", "htm", "svg"].includes(language)
  const langLabel = language || "code"

  return (
    <>
      <div className="group relative my-3 overflow-hidden rounded-xl border bg-[#0d1117]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
          <div className="flex items-center gap-2">
            <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-mono">{langLabel}</span>
          </div>
          <div className="flex items-center gap-1">
            {isPreviewable && (
              <button
                onClick={() => setPreviewOpen(true)}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
              >
                <Eye className="h-3.5 w-3.5" />
                Preview
              </button>
            )}
            {conversationId && !showSaveInput && (
              <button
                onClick={() => setShowSaveInput(true)}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
              >
                <Save className="h-3.5 w-3.5" />
                Save
              </button>
            )}
            {conversationId && showSaveInput && (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <Input
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="h-7 w-32 text-[11px] rounded-md bg-white/5 border-white/10"
                  placeholder="filename.ext"
                  onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setShowSaveInput(false) }}
                  autoFocus
                />
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-50"
                >
                  {saving ? "..." : <FileCode className="h-3 w-3" />}
                </button>
              </div>
            )}
            <div className="relative">
              <button
                ref={buttonRef}
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-all duration-200 hover:bg-white/10"
              >
                <motion.span
                  key={copied ? "check" : "copy"}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-1.5"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span className={copied ? "text-green-400" : "text-muted-foreground"}>
                    {copied ? "Copied!" : "Copy"}
                  </span>
                </motion.span>
              </button>
              <AnimatePresence>
                {toastVisible && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="absolute -top-9 right-0 whitespace-nowrap rounded-lg bg-green-500/90 px-2.5 py-1 text-[11px] font-medium text-white shadow-lg backdrop-blur-sm"
                  >
                    Copied to clipboard
                    <div className="absolute -bottom-1 right-4 h-2 w-2 rotate-45 bg-green-500/90" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <pre className="p-4 text-sm leading-relaxed">
            <code className={`language-${language}`}>{code}</code>
          </pre>
        </div>
      </div>
      <PreviewDialog code={code} language={language} open={previewOpen} onOpenChange={setPreviewOpen} />
    </>
  )
}
