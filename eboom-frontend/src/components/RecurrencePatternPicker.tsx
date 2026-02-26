"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type Frequency = "daily" | "weekly" | "monthly" | "yearly";

export interface RecurrencePattern {
  frequency: Frequency;
  interval: number;
  daysOfWeek?: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  dayOfMonth?: number; // 1-31
}

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "daily", label: "Day" },
  { value: "weekly", label: "Week" },
  { value: "monthly", label: "Month" },
  { value: "yearly", label: "Year" },
];

const DAYS_OF_WEEK = [
  { value: 0, label: "S" },
  { value: 1, label: "M" },
  { value: 2, label: "T" },
  { value: 3, label: "W" },
  { value: 4, label: "T" },
  { value: 5, label: "F" },
  { value: 6, label: "S" },
];

interface RecurrencePatternPickerProps {
  value: RecurrencePattern;
  onChange: (pattern: RecurrencePattern) => void;
}

export function RecurrencePatternPicker({
  value,
  onChange,
}: RecurrencePatternPickerProps) {
  const pluralUnit = () => {
    const units: Record<Frequency, string> = {
      daily: "days",
      weekly: "weeks",
      monthly: "months",
      yearly: "years",
    };
    return units[value.frequency];
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Frequency + Interval row */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap">Every</span>
        <Input
          type="number"
          min={1}
          max={99}
          value={value.interval}
          onChange={(e) =>
            onChange({
              ...value,
              interval: Math.max(1, parseInt(e.target.value) || 1),
            })
          }
          className="w-16 h-8 text-center"
        />
        <Select
          value={value.frequency}
          onValueChange={(freq: Frequency) => {
            const next: RecurrencePattern = {
              ...value,
              frequency: freq,
            };
            // Clear irrelevant fields
            if (freq !== "weekly") delete next.daysOfWeek;
            if (freq !== "monthly") delete next.dayOfMonth;
            onChange(next);
          }}
        >
          <SelectTrigger className="h-8 w-28" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[80]">
            {FREQUENCY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {value.interval > 1 ? `${opt.label}s` : opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Weekly: day-of-week toggles */}
      {value.frequency === "weekly" && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Repeat on</Label>
          <ToggleGroup
            type="multiple"
            variant="outline"
            size="sm"
            value={(value.daysOfWeek ?? []).map(String)}
            onValueChange={(selected: string[]) =>
              onChange({
                ...value,
                daysOfWeek: selected.map(Number).sort(),
              })
            }
          >
            {DAYS_OF_WEEK.map((day) => (
              <ToggleGroupItem
                key={day.value}
                value={String(day.value)}
                className="w-8 h-8 text-xs font-medium"
              >
                {day.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      )}

      {/* Monthly: day of month */}
      {value.frequency === "monthly" && (
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">On day</Label>
          <Input
            type="number"
            min={1}
            max={31}
            value={value.dayOfMonth ?? 1}
            onChange={(e) =>
              onChange({
                ...value,
                dayOfMonth: Math.min(31, Math.max(1, parseInt(e.target.value) || 1)),
              })
            }
            className="w-16 h-8 text-center"
          />
          <span className="text-xs text-muted-foreground">
            of every {value.interval > 1 ? `${value.interval} ` : ""}
            {value.interval > 1 ? "months" : "month"}
          </span>
        </div>
      )}

      {/* Summary text */}
      <p className="text-xs text-muted-foreground">
        {buildSummary(value)}
      </p>
    </div>
  );
}

function buildSummary(pattern: RecurrencePattern): string {
  const { frequency, interval, daysOfWeek, dayOfMonth } = pattern;

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (frequency === "daily") {
    return interval === 1 ? "Repeats every day" : `Repeats every ${interval} days`;
  }

  if (frequency === "weekly") {
    const base = interval === 1 ? "Repeats every week" : `Repeats every ${interval} weeks`;
    if (daysOfWeek && daysOfWeek.length > 0) {
      const names = daysOfWeek.map((d) => dayNames[d]).join(", ");
      return `${base} on ${names}`;
    }
    return base;
  }

  if (frequency === "monthly") {
    const base = interval === 1 ? "Repeats every month" : `Repeats every ${interval} months`;
    if (dayOfMonth) {
      return `${base} on day ${dayOfMonth}`;
    }
    return base;
  }

  // yearly
  return interval === 1 ? "Repeats every year" : `Repeats every ${interval} years`;
}

export const DEFAULT_RECURRENCE_PATTERN: RecurrencePattern = {
  frequency: "monthly",
  interval: 1,
};
