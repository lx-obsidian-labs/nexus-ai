"use client"

import { create } from "zustand"
import type { Conversation, Message, ChatModel, ImageModel, GeneratedImage } from "@/types"

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

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isStreaming: false,
  selectedModel: "meta/llama-3.1-70b-instruct",

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
}))

interface ImageState {
  images: GeneratedImage[]
  isGenerating: boolean
  selectedModel: ImageModel

  setImages: (images: GeneratedImage[]) => void
  addImage: (image: GeneratedImage) => void
  setIsGenerating: (isGenerating: boolean) => void
  setSelectedModel: (model: ImageModel) => void
}

export const useImageStore = create<ImageState>((set) => ({
  images: [],
  isGenerating: false,
  selectedModel: "black-forest-labs/flux-schnell",

  setImages: (images) => set({ images }),
  addImage: (image) => set((state) => ({ images: [image, ...state.images] })),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setSelectedModel: (selectedModel) => set({ selectedModel }),
}))
