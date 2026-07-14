"use client";

import * as React from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDate, formatMoney } from "@/src/i18n/formatters";
import { useTranslation } from "react-i18next";
import type { CanvasSummary } from "@/src/types/dashboard";
import {
  buildYearlyHeatmapData,
  getAvailableHeatmapYears,
  getDashboardCurrencyCodes,
  type YearlyHeatmapDay,
} from "../utils/yearlyHeatmapData";

interface DashboardYearlyHeatmapProps {
  summary?: CanvasSummary;
  isLoading?: boolean;
}

const CELL_SIZE_CLASS = "h-3 w-3 rounded-[2px]";
const HEATMAP_TOOLTIP_CLASS =
  "w-56 !bg-popover !text-popover-foreground border p-2 shadow-md [&_[class*='rotate-45']]:!bg-popover [&_[class*='rotate-45']]:!fill-popover";

function HeatmapCellTooltip({
  day,
  symbol,
  children,
}: {
  day: YearlyHeatmapDay;
  symbol: string;
  children: React.ReactNode;
}) {
  const { t } = useTranslation("dashboard");
  const { t: tc } = useTranslation("common");
  const emDash = tc("empty.emDash");

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="top" sideOffset={6} className={HEATMAP_TOOLTIP_CLASS}>
        <div className="font-medium">
          {formatDate(day.date, { preset: "short", fallback: emDash })}
        </div>
        <div className="mt-1 grid gap-0.5 text-muted-foreground">
          <div className="flex justify-between gap-4">
            <span>{t("heatmap.tooltip.income")}</span>
            <span className="text-foreground">{formatMoney(day.income, symbol)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>{t("heatmap.tooltip.expense")}</span>
            <span className="text-foreground">{formatMoney(day.expense, symbol)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>{t("heatmap.tooltip.net")}</span>
            <span className="text-foreground">{formatMoney(day.net, symbol)}</span>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function getHeatmapCellColor(day: YearlyHeatmapDay): string {
  if (!day.inYear) return "bg-muted/30";
  if (day.direction === "neutral") return "bg-muted/60";

  if (day.direction === "profit") {
    if (day.intensity >= 4) return "bg-emerald-600";
    if (day.intensity >= 3) return "bg-emerald-500";
    if (day.intensity >= 2) return "bg-emerald-400";
    return "bg-emerald-300";
  }

  if (day.intensity >= 4) return "bg-rose-600";
  if (day.intensity >= 3) return "bg-rose-500";
  if (day.intensity >= 2) return "bg-rose-400";
  return "bg-rose-300";
}

export function DashboardYearlyHeatmap({
  summary,
  isLoading,
}: DashboardYearlyHeatmapProps) {
  const { t, i18n } = useTranslation("dashboard");
  const { t: tc } = useTranslation("common");
  const emDash = tc("empty.emDash");

  const currencyCodes = React.useMemo(
    () =>
      summary
        ? getDashboardCurrencyCodes(summary.incomeEntries, summary.expensePayments)
        : [],
    [summary]
  );

  const symbolByCurrency = React.useMemo(() => {
    const pairs: Array<[string, string]> = [];
    if (!summary) return Object.fromEntries(pairs);

    for (const balance of summary.walletBalances) {
      pairs.push([balance.currencyCode, balance.currencySymbol]);
    }
    for (const entry of summary.incomeEntries) {
      pairs.push([entry.currencyCode, entry.currencySymbol]);
    }
    for (const payment of summary.expensePayments) {
      pairs.push([payment.currencyCode, payment.currencySymbol]);
    }
    return Object.fromEntries(pairs);
  }, [summary]);

  const [selectedCurrency, setSelectedCurrency] = React.useState<string>("");
  React.useEffect(() => {
    if (!currencyCodes.length) {
      setSelectedCurrency("");
      return;
    }
    if (!selectedCurrency || !currencyCodes.includes(selectedCurrency)) {
      setSelectedCurrency(currencyCodes[0]);
    }
  }, [currencyCodes, selectedCurrency]);

  const availableYears = React.useMemo(
    () =>
      summary
        ? getAvailableHeatmapYears(
            summary.incomeEntries,
            summary.expensePayments,
            selectedCurrency || undefined
          )
        : [new Date().getFullYear()],
    [summary, selectedCurrency]
  );

  const [selectedYear, setSelectedYear] = React.useState<number>(new Date().getFullYear());
  React.useEffect(() => {
    if (!availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0] ?? new Date().getFullYear());
    }
  }, [availableYears, selectedYear]);

  const heatmapData = React.useMemo(
    () =>
      summary
        ? buildYearlyHeatmapData(
            summary.incomeEntries,
            summary.expensePayments,
            selectedYear,
            selectedCurrency || undefined
          )
        : null,
    [summary, selectedYear, selectedCurrency]
  );

  const weekColumns = React.useMemo(() => {
    if (!heatmapData) return [];
    return Array.from({ length: heatmapData.totalWeeks }, (_, weekIndex) =>
      heatmapData.days.filter((day) => day.weekIndex === weekIndex)
    );
  }, [heatmapData]);

  const monthLabelByWeek = React.useMemo(() => {
    if (!heatmapData) return {};
    const labels: Record<number, string> = {};
    for (const monthLabel of heatmapData.monthLabels) {
      labels[monthLabel.weekIndex] = formatDate(
        new Date(selectedYear, monthLabel.monthIndex, 1),
        { preset: "monthShort", fallback: emDash }
      );
    }
    return labels;
  }, [heatmapData, emDash, i18n.language, selectedYear]);

  const activeDayCount = React.useMemo(
    () =>
      heatmapData
        ? heatmapData.days.filter(
            (day) => day.inYear && (day.income > 0 || day.expense > 0)
          ).length
        : 0,
    [heatmapData]
  );

  if (isLoading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[220px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>{t("heatmap.title")}</CardTitle>
        <CardDescription>
          {activeDayCount > 0
            ? t("heatmap.description", { year: selectedYear })
            : t("heatmap.noData", { year: selectedYear })}
        </CardDescription>
        <CardAction className="flex items-center gap-2">
          <Select
            value={String(selectedYear)}
            onValueChange={(value) => setSelectedYear(Number(value))}
          >
            <SelectTrigger
              className="w-[104px]"
              size="sm"
              aria-label={t("heatmap.controls.selectYear")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {availableYears.map((year) => (
                <SelectItem key={year} value={String(year)} className="rounded-lg">
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
            <SelectTrigger
              className="w-[116px]"
              size="sm"
              aria-label={t("heatmap.controls.selectCurrency")}
            >
              <SelectValue placeholder={t("heatmap.controls.currency")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {currencyCodes.map((currencyCode) => (
                <SelectItem
                  key={currencyCode}
                  value={currencyCode}
                  className="rounded-lg"
                >
                  {currencyCode}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-4 overflow-x-auto">
        {!currencyCodes.length || !heatmapData ? (
          <p className="text-sm text-muted-foreground">{t("heatmap.empty")}</p>
        ) : (
          <TooltipProvider>
            <div className="inline-block min-w-max">
            <div className="mb-2 flex items-center gap-1 ps-8">
              {weekColumns.map((_, weekIndex) => (
                <div
                  key={`month-${weekIndex}`}
                  className="w-3 text-[10px] text-muted-foreground"
                >
                  {monthLabelByWeek[weekIndex] ?? ""}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <div className="flex flex-col gap-1 pt-[2px]">
                {Array.from({ length: 7 }, (_, dayIndex) => (
                  <div
                    key={`weekday-${dayIndex}`}
                    className="h-3 text-[10px] leading-3 text-muted-foreground"
                  >
                    {dayIndex === 1
                      ? t("heatmap.weekdays.mon")
                      : dayIndex === 3
                        ? t("heatmap.weekdays.wed")
                        : dayIndex === 5
                          ? t("heatmap.weekdays.fri")
                          : ""}
                  </div>
                ))}
              </div>

              <div className="flex gap-1">
                {weekColumns.map((weekDays, weekIndex) => (
                  <div key={`week-${weekIndex}`} className="flex flex-col gap-1">
                    {Array.from({ length: 7 }, (_, dayIndex) => {
                      const day = weekDays.find((item) => item.dayIndex === dayIndex);
                      if (!day) {
                        return (
                          <div
                            key={`empty-${weekIndex}-${dayIndex}`}
                            className={`${CELL_SIZE_CLASS} bg-transparent`}
                          />
                        );
                      }

                      const symbol = symbolByCurrency[selectedCurrency] ?? selectedCurrency;
                      return (
                        <HeatmapCellTooltip key={day.date} day={day} symbol={symbol}>
                          <div
                            className={`${CELL_SIZE_CLASS} ${getHeatmapCellColor(day)}`}
                          />
                        </HeatmapCellTooltip>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            </div>
          </TooltipProvider>
        )}

        <div className="ms-auto flex items-center gap-2 text-xs text-muted-foreground">
          <span>{t("heatmap.legend.less")}</span>
          <div className={`${CELL_SIZE_CLASS} bg-muted/60`} />
          <div className={`${CELL_SIZE_CLASS} bg-rose-300`} />
          <div className={`${CELL_SIZE_CLASS} bg-rose-500`} />
          <div className={`${CELL_SIZE_CLASS} bg-rose-600`} />
          <div className={`${CELL_SIZE_CLASS} bg-emerald-300`} />
          <div className={`${CELL_SIZE_CLASS} bg-emerald-500`} />
          <div className={`${CELL_SIZE_CLASS} bg-emerald-600`} />
          <span>{t("heatmap.legend.more")}</span>
        </div>
      </CardContent>
    </Card>
  );
}
