"use client";

import * as React from "react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { formatDate, formatMoney } from "@/src/i18n/formatters";
import type { CanvasSummary } from "../types";
import {
  assignCurrencyChartColors,
  buildMultiCurrencySeriesKeys,
  getCurrencyFromSeriesKey,
  isPaidSeriesKey,
} from "../utils/assignCurrencyChartColors";
import { buildMultiCurrencyCashFlowChartData } from "../utils/cashFlowChartData";
import { computeDashboardStatsByCurrency } from "../utils/dashboardStats";
import { DashboardChartLegend } from "./DashboardChartLegend";
import { useTranslation } from "react-i18next";

interface DashboardCashFlowChartProps {
  summary?: CanvasSummary;
  isLoading?: boolean;
}

export function DashboardCashFlowChart({
  summary,
  isLoading,
}: DashboardCashFlowChartProps) {
  const { t } = useTranslation("dashboard");
  const { t: tc } = useTranslation("common");
  const emDash = tc("empty.emDash");
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("90d");

  const currencyStats = React.useMemo(
    () => (summary ? computeDashboardStatsByCurrency(summary) : []),
    [summary]
  );

  const currencyCodes = React.useMemo(
    () => currencyStats.map((item) => item.currencyCode),
    [currencyStats]
  );

  const symbolByCurrency = React.useMemo(
    () =>
      Object.fromEntries(
        currencyStats.map((item) => [item.currencyCode, item.currencySymbol])
      ),
    [currencyStats]
  );

  const seriesKeys = React.useMemo(
    () => buildMultiCurrencySeriesKeys(currencyCodes),
    [currencyCodes]
  );

  const colorMap = React.useMemo(
    () => assignCurrencyChartColors(currencyCodes),
    [currencyCodes]
  );

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {};
    for (const key of seriesKeys) {
      const currency = getCurrencyFromSeriesKey(key);
      config[key] = {
        label: isPaidSeriesKey(key)
          ? `${currency} ${t("chart.legend.paid")}`
          : `${currency} ${t("chart.legend.received")}`,
        color: colorMap[key],
      };
    }
    return config;
  }, [seriesKeys, colorMap, t]);

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("30d");
    }
  }, [isMobile]);

  const chartData = React.useMemo(
    () =>
      summary
        ? buildMultiCurrencyCashFlowChartData(
            summary.incomeEntries,
            summary.expensePayments,
            timeRange,
            currencyCodes
          )
        : [],
    [summary, timeRange, currencyCodes]
  );

  const rangeTotal = React.useMemo(
    () =>
      chartData.reduce((sum, point) => {
        let pointTotal = 0;
        for (const key of seriesKeys) {
          pointTotal += Number(point[key]) || 0;
        }
        return sum + pointTotal;
      }, 0),
    [chartData, seriesKeys]
  );

  const timeRangeLabel =
    timeRange === "7d"
      ? tc("chart.timeRange.last7Days")
      : timeRange === "30d"
        ? tc("chart.timeRange.last30Days")
        : tc("chart.timeRange.last3Months");

  if (isLoading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <Skeleton className="aspect-auto h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>{t("chart.title")}</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            {rangeTotal > 0
              ? t("chart.description.multiCurrency", { timeRange: timeRangeLabel })
              : t("chart.description.noData", { timeRange: timeRangeLabel })}
          </span>
          <span className="@[540px]/card:hidden">{timeRangeLabel}</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(value) => value && setTimeRange(value)}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">{tc("chart.last3Months")}</ToggleGroupItem>
            <ToggleGroupItem value="30d">{tc("chart.last30Days")}</ToggleGroupItem>
            <ToggleGroupItem value="7d">{tc("chart.last7Days")}</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label={tc("chart.selectTimeRange")}
            >
              <SelectValue placeholder={tc("chart.last3Months")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                {tc("chart.last3Months")}
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                {tc("chart.last30Days")}
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                {tc("chart.last7Days")}
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <LineChart data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) =>
                formatDate(value, { preset: "monthDay", fallback: emDash })
              }
            />
            <ChartTooltip
              cursor={false}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;

                const byCurrency = new Map<
                  string,
                  { received?: number; paid?: number }
                >();

                for (const item of payload) {
                  const key = String(item.dataKey);
                  const currency = getCurrencyFromSeriesKey(key);
                  const entry = byCurrency.get(currency) ?? {};
                  if (isPaidSeriesKey(key)) {
                    entry.paid = Number(item.value) || 0;
                  } else {
                    entry.received = Number(item.value) || 0;
                  }
                  byCurrency.set(currency, entry);
                }

                return (
                  <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
                    <div className="mb-2 font-medium">
                      {formatDate(String(label), { preset: "short", fallback: emDash })}
                    </div>
                    <div className="grid gap-2">
                      {Array.from(byCurrency.entries()).map(([currency, values]) => (
                        <div key={currency} className="grid gap-1">
                          <div className="font-medium">{currency}</div>
                          {values.received != null && values.received > 0 && (
                            <div className="flex justify-between gap-4 tabular-nums">
                              <span className="text-muted-foreground">
                                {t("chart.legend.received")}
                              </span>
                              <span>
                                {formatMoney(values.received, symbolByCurrency[currency])}
                              </span>
                            </div>
                          )}
                          {values.paid != null && values.paid > 0 && (
                            <div className="flex justify-between gap-4 tabular-nums">
                              <span className="text-muted-foreground">
                                {t("chart.legend.paid")}
                              </span>
                              <span>
                                {formatMoney(values.paid, symbolByCurrency[currency])}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }}
            />
            {seriesKeys.map((key) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colorMap[key]}
                strokeWidth={2}
                strokeDasharray={isPaidSeriesKey(key) ? "4 4" : undefined}
                dot={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ChartContainer>
        {currencyCodes.length > 0 && (
          <DashboardChartLegend currencyCodes={currencyCodes} />
        )}
      </CardContent>
    </Card>
  );
}
