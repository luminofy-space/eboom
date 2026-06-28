"use client";

import { cn } from "@/lib/utils";
import { Typography } from "@/components/ui/typography";

interface BudgetProgressBarProps {
  percent: number;
  threshold?: number;
  label?: string;
  showPercent?: boolean;
  className?: string;
}

function barColor(percent: number, threshold: number): string {
  if (percent >= 100) return "bg-destructive";
  if (percent >= threshold) return "bg-amber-500";
  if (percent >= 70) return "bg-amber-400";
  return "bg-emerald-500";
}

export function BudgetProgressBar({
  percent,
  threshold = 80,
  label,
  showPercent = true,
  className,
}: BudgetProgressBarProps) {
  const clamped = Math.min(Math.max(percent, 0), 100);

  return (
    <div className={cn("space-y-1.5", className)}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <Typography variant="muted-sm" className="truncate">
              {label}
            </Typography>
          )}
          {showPercent && (
            <Typography variant="muted-sm" className="shrink-0 tabular-nums">
              {clamped.toFixed(0)}%
            </Typography>
          )}
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", barColor(clamped, threshold))}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
