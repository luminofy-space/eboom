"use client";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRESET_COLORS } from "./canvasUtils";

interface CanvasColorSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function CanvasColorSelect({ value, onValueChange, disabled, className }: CanvasColorSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger size="sm" className={cn("w-full max-w-[68px]", className)}>
        <SelectValue>
          <span
            className="size-4 shrink-0 rounded-full"
            style={{ backgroundColor: value }}
            aria-hidden
          />
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {PRESET_COLORS.map((color) => (
          <SelectItem key={color} value={color} aria-label={color}>
            <span
              className="size-4 shrink-0 rounded-full"
              style={{ backgroundColor: color }}
              aria-hidden
            />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
