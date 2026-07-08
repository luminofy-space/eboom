"use client";

import { cn } from "@/lib/utils";
import { Typography } from "@/components/ui/typography";

interface BudgetProgressBarProps {
  percent: number;
  threshold?: number;
  label?: string;
  showPercent?: boolean;
  variant?: "budget" | "goal";
  className?: string;
}

function budgetBarColor(percent: number, threshold: number): string {
  if (percent >= 100) return "bg-destructive";
  if (percent >= threshold) return "bg-amber-500";
  if (percent >= 70) return "bg-amber-400";
  return "bg-emerald-500";
}

function goalBarColor(percent: number): string {
  const clamped = Math.min(Math.max(percent, 0), 100);
  const t = clamped / 100;
  const lightness = 75 - t * 47;
  const saturation = 60 + t * 10;
  return `hsl(152 ${saturation}% ${lightness}%)`;
}

export function BudgetProgressBar({
  percent,
  threshold = 80,
  label,
  showPercent = true,
  variant = "budget",
  className,
}: BudgetProgressBarProps) {
  const clamped = Math.min(Math.max(percent, 0), 100);
  const isGoal = variant === "goal";
  const goalColor = isGoal ? goalBarColor(clamped) : undefined;

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
            <Typography
              variant="muted-sm"
              className={cn("shrink-0 tabular-nums", !isGoal && "text-muted-foreground")}
              style={isGoal ? { color: goalColor } : undefined}
            >
              {clamped.toFixed(0)}%
            </Typography>
          )}
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            !isGoal && budgetBarColor(clamped, threshold)
          )}
          style={{
            width: `${clamped}%`,
            ...(isGoal ? { backgroundColor: goalColor } : {}),
          }}
        />
      </div>
    </div>
  );
}
