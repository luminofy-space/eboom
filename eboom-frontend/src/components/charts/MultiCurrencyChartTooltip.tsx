"use client";

import { formatMoney } from "@/src/i18n/formatters";

export interface MultiCurrencyChartTooltipRow {
  label: string;
  amount: number;
  symbol: string;
}

export interface MultiCurrencyChartTooltipGroup {
  currency: string;
  color: string;
  rows: MultiCurrencyChartTooltipRow[];
}

interface MultiCurrencyChartTooltipProps {
  dateLabel: string;
  groups: MultiCurrencyChartTooltipGroup[];
}

export function MultiCurrencyChartTooltip({
  dateLabel,
  groups,
}: MultiCurrencyChartTooltipProps) {
  if (groups.length === 0) return null;

  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
      <div className="mb-2 font-medium">{dateLabel}</div>
      <div className="grid gap-2">
        {groups.map((group) => (
          <div key={group.currency} className="grid gap-1">
            <div className="flex items-center gap-2 font-medium">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: group.color }}
              />
              {group.currency}
            </div>
            {group.rows.map((row) => (
              <div
                key={`${group.currency}-${row.label}`}
                className="flex justify-between gap-4 tabular-nums"
              >
                <span className="text-muted-foreground">{row.label}</span>
                <span>{formatMoney(row.amount, row.symbol)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
