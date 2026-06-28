"use client";

import { useTranslation } from "react-i18next";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { BudgetPeriodType } from "../types";

const PERIODS: BudgetPeriodType[] = ["weekly", "monthly", "yearly"];

interface BudgetPeriodTabsProps {
  value: BudgetPeriodType;
  onValueChange: (value: BudgetPeriodType) => void;
  disabled?: boolean;
  className?: string;
}

export function BudgetPeriodTabs({
  value,
  onValueChange,
  disabled,
  className,
}: BudgetPeriodTabsProps) {
  const { t } = useTranslation("budget-planning");

  return (
    <Tabs
      value={value}
      onValueChange={(v) => onValueChange(v as BudgetPeriodType)}
      className={cn("min-w-0 flex-1", className)}
    >
      <TabsList className="flex h-11 w-full">
        {PERIODS.map((p) => (
          <TabsTrigger
            key={p}
            value={p}
            disabled={disabled}
            className="flex-1 px-4 text-base"
          >
            {t(`period.${p}`)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
