"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CHAT_MODELS } from "@/lib/constants"
import type { ChatModel } from "@/types"

interface ModelSelectorProps {
  value: ChatModel
  onChange: (model: ChatModel) => void
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ChatModel)}>
      <SelectTrigger className="w-[200px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CHAT_MODELS.map((model) => (
          <SelectItem key={model.value} value={model.value}>
            <span className="flex items-center gap-2">
              <span>{model.label}</span>
              <span className="text-xs text-muted-foreground">by {model.provider}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
