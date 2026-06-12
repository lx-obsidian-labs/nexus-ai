"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import { motion } from "framer-motion"
import { cn, formatRelativeTime } from "@/lib/utils"
import { Sparkles, User } from "lucide-react"
import { CodeBlock } from "./code-block"
import type { Message } from "@/types"

interface MessageBubbleProps {
  message: Message
  conversationId?: string
}

export function MessageBubble({ message, conversationId }: MessageBubbleProps) {
  const isUser = message.role === "user"

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
    >
      <div className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
        isUser
          ? "bg-primary/10 text-primary"
          : "bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary"
      )}>
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
      </div>
      <div className={cn("flex max-w-[80%] flex-col", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              : "glass border-white/5",
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:p-0 prose-pre:border-0 prose-pre:bg-transparent">
              {message.content ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    pre: ({ children }) => <>{children}</>,
                    code: ({ className, children, ...props }) => {
                      const match = /language-(\w+)/.exec(className || "")
                      const code = String(children).replace(/\n$/, "")
                      if (match) {
                        return <CodeBlock language={match[1]} code={code} conversationId={conversationId} />
                      }
                      return (
                        <code
                          className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono"
                          {...props}
                        >
                          {children}
                        </code>
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
        <span className="mt-1 px-1 text-[10px] text-muted-foreground/50">
          {formatRelativeTime(message.created_at)}
        </span>
      </div>
    </motion.div>
  )
}
