"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import { motion } from "framer-motion"
import { cn, formatRelativeTime } from "@/lib/utils"
import { Copy, Check, Sparkles } from "lucide-react"
import type { Message } from "@/types"

interface MessageBubbleProps {
  message: Message
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      onClick={handleCopy}
      className="absolute right-2 top-2 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover/code:opacity-100"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user"

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
      )}
      <div className={cn("flex max-w-[75%] flex-col", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm",
            isUser
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/50 border shadow-xs",
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {message.content ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    pre: ({ children }) => (
                      <div className="group/code relative">
                        <pre className="rounded-lg border bg-black/5 p-4 dark:bg-white/5">
                          {children}
                        </pre>
                      </div>
                    ),
                    code: ({ className, children, ...props }) => {
                      const isInline = !className
                      if (isInline) {
                        return (
                          <code
                            className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono"
                            {...props}
                          >
                            {children}
                          </code>
                        )
                      }
                      const text = String(children).replace(/\n$/, "")
                      return (
                        <>
                          <CopyButton text={text} />
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </>
                      )
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              ) : (
                <span className="text-muted-foreground italic">Thinking...</span>
              )}
            </div>
          )}
        </div>
        <span className="mt-1 px-1 text-[10px] text-muted-foreground/60">
          {formatRelativeTime(message.created_at)}
        </span>
      </div>
    </motion.div>
  )
}
