"use client"

import { createContext, useContext } from "react"

interface ChatCtxValue {
  conversationId: string | undefined
}

const ChatCtx = createContext<ChatCtxValue>({ conversationId: undefined })

export function ChatProvider({ children, conversationId }: { children: React.ReactNode; conversationId: string | undefined }) {
  return <ChatCtx value={{ conversationId }}>{children}</ChatCtx>
}

export function useChatContext() {
  return useContext(ChatCtx)
}
