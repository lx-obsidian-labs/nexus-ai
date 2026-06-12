"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CHAT_MODELS } from "@/lib/constants"
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChatModel } from "@/types"

interface ModelSelectorProps {
  value: ChatModel
  onChange: (model: ChatModel) => void
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const isAuto = value === "auto"

  return (
    <Select value={value} onValueChange={(v) => onChange(v as ChatModel)}>
      <SelectTrigger className={cn("w-[200px]", isAuto && "border-primary/30")}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CHAT_MODELS.map((model) => {
          const isAutoItem = model.value === "auto"
          return (
            <SelectItem key={model.value} value={model.value}>
              <span className="flex items-center gap-2">
                {isAutoItem && <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />}
                <span className={cn(isAutoItem && "font-medium text-primary")}>{model.label}</span>
                <span className="text-xs text-muted-foreground">
                  {isAutoItem ? "recommended" : `by ${model.provider}`}
                </span>
              </span>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
