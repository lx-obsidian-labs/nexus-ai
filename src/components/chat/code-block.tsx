"use client"

import { useState } from "react"
import { Check, Copy, Terminal, Eye, ExternalLink } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

interface CodeBlockProps {
  language: string
  code: string
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

export function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

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
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Copied!" : "Copy"}
            </button>
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
