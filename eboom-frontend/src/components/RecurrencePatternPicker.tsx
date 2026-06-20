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
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

export type Frequency = "daily" | "weekly" | "monthly" | "yearly";

export interface RecurrencePattern {
  frequency: Frequency;
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
}

const FREQUENCY_VALUES: Frequency[] = ["daily", "weekly", "monthly", "yearly"];

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

interface RecurrencePatternPickerProps {
  value: RecurrencePattern;
  onChange: (pattern: RecurrencePattern) => void;
}

function frequencyLabel(t: TFunction<"common">, frequency: Frequency, interval: number): string {
  const key = interval > 1
    ? `recurrence.frequency.${frequency === "daily" ? "days" : frequency === "weekly" ? "weeks" : frequency === "monthly" ? "months" : "years"}`
    : `recurrence.frequency.${frequency === "daily" ? "day" : frequency === "weekly" ? "week" : frequency === "monthly" ? "month" : "year"}`;
  return t(key);
}

export function RecurrencePatternPicker({
  value,
  onChange,
}: RecurrencePatternPickerProps) {
  const { t } = useTranslation("common");

  const daysOfWeek = useMemo(
    () =>
      DAY_KEYS.map((key, index) => ({
        value: index,
        label: t(`recurrence.daysOfWeek.${key}`),
      })),
    [t]
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap">{t("recurrence.every")}</span>
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
            if (freq !== "weekly") delete next.daysOfWeek;
            if (freq !== "monthly") delete next.dayOfMonth;
            onChange(next);
          }}
        >
          <SelectTrigger className="h-8 w-28" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[80]">
            {FREQUENCY_VALUES.map((freq) => (
              <SelectItem key={freq} value={freq}>
                {frequencyLabel(t, freq, value.interval)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {value.frequency === "weekly" && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">{t("recurrence.repeatOn")}</Label>
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
            {daysOfWeek.map((day) => (
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

      {value.frequency === "monthly" && (
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">{t("recurrence.onDay")}</Label>
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
            {value.interval > 1
              ? t("recurrence.ofEveryNMonths", { interval: value.interval })
              : t("recurrence.ofEveryMonth")}
          </span>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {buildSummary(value, t)}
      </p>
    </div>
  );
}

function buildSummary(pattern: RecurrencePattern, t: TFunction<"common">): string {
  const { frequency, interval, daysOfWeek, dayOfMonth } = pattern;

  const dayNameKeys = DAY_KEYS;

  if (frequency === "daily") {
    return interval === 1
      ? t("recurrence.summary.everyDay")
      : t("recurrence.summary.everyNDays", { interval });
  }

  if (frequency === "weekly") {
    if (daysOfWeek && daysOfWeek.length > 0) {
      const names = daysOfWeek
        .map((d) => t(`recurrence.dayNames.${dayNameKeys[d]}`))
        .join(", ");
      return interval === 1
        ? t("recurrence.summary.everyWeekOnDays", { days: names })
        : t("recurrence.summary.everyNWeeksOnDays", { interval, days: names });
    }
    return interval === 1
      ? t("recurrence.summary.everyWeek")
      : t("recurrence.summary.everyNWeeks", { interval });
  }

  if (frequency === "monthly") {
    if (dayOfMonth) {
      return interval === 1
        ? t("recurrence.summary.everyMonthOnDay", { day: dayOfMonth })
        : t("recurrence.summary.everyNMonthsOnDay", { interval, day: dayOfMonth });
    }
    return interval === 1
      ? t("recurrence.summary.everyMonth")
      : t("recurrence.summary.everyNMonths", { interval });
  }

  return interval === 1
    ? t("recurrence.summary.everyYear")
    : t("recurrence.summary.everyNYears", { interval });
}

export const DEFAULT_RECURRENCE_PATTERN: RecurrencePattern = {
  frequency: "monthly",
  interval: 1,
};
