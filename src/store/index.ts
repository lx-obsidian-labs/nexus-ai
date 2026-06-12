"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Conversation, Message, ChatModel } from "@/types"

interface ChatState {
  conversations: Conversation[]
  currentConversation: Conversation | null
  messages: Message[]
  isStreaming: boolean
  selectedModel: ChatModel

  setConversations: (conversations: Conversation[]) => void
  setCurrentConversation: (conversation: Conversation | null) => void
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  updateLastMessage: (content: string) => void
  setIsStreaming: (isStreaming: boolean) => void
  setSelectedModel: (model: ChatModel) => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      conversations: [],
      currentConversation: null,
      messages: [],
      isStreaming: false,
      selectedModel: "auto" as ChatModel,

      setConversations: (conversations) => set({ conversations }),
      setCurrentConversation: (currentConversation) => set({ currentConversation }),
      setMessages: (messages) => set({ messages }),
      addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
      updateLastMessage: (content) =>
        set((state) => {
          const messages = [...state.messages]
          const last = messages[messages.length - 1]
          if (last && last.role === "assistant") {
            messages[messages.length - 1] = { ...last, content }
          }
          return { messages }
        }),
      setIsStreaming: (isStreaming) => set({ isStreaming }),
      setSelectedModel: (selectedModel) => set({ selectedModel }),
    }),
    {
      name: "nexus-ai-store",
      partialize: (state) => ({ selectedModel: state.selectedModel }),
    },
  ),
)
