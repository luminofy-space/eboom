"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type TransactionStatus =
  | "received"
  | "paid"
  | "pending"
  | "expected"
  | "due"
  | "unpaid"
  | "overdue";

const STATUS_CHIP_CLASS: Record<TransactionStatus, string> = {
  received:
    "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30",
  paid: "bg-red-500/15 text-red-800 dark:text-red-300 border-red-500/30",
  pending:
    "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/25",
  expected:
    "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/25",
  due: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
  unpaid:
    "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/25",
  overdue:
    "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
};

interface TransactionStatusChipProps {
  status: TransactionStatus;
  label: string;
  className?: string;
}

export function TransactionStatusChip({
  status,
  label,
  className,
}: TransactionStatusChipProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md font-medium",
        STATUS_CHIP_CLASS[status],
        className
      )}
    >
      {label}
    </Badge>
  );
}
