"use client";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRESET_EMOJIS } from "./canvasUtils";

interface CanvasIconSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function CanvasIconSelect({ value, onValueChange, disabled, className }: CanvasIconSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger size="sm" className={cn("w-full max-w-[68px]", className)}>
        <SelectValue>
          <span className="text-base leading-none" aria-hidden>
            {value}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {PRESET_EMOJIS.map((emoji) => (
          <SelectItem key={emoji} value={emoji} aria-label={emoji}>
            <span className="text-base leading-none">{emoji}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
