"use client";

import * as React from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
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
import { MultiCurrencyChartTooltip } from "@/src/components/charts/MultiCurrencyChartTooltip";
import { formatDate } from "@/src/i18n/formatters";
import {
  formatChartScaleTick,
  getRawSeriesValue,
  transformSeriesForScaleMode,
  type ChartScaleMode,
} from "@/src/utils/chartScale";
import type { CanvasSummary } from "@/src/types/dashboard";
import {
  assignCurrencyChartColors,
  buildMultiCurrencySeriesKeys,
  getCurrencyColorMap,
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
  const [scaleMode, setScaleMode] = React.useState<ChartScaleMode>("loglike");

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

  const colorByCurrency = React.useMemo(
    () => getCurrencyColorMap(currencyCodes),
    [currencyCodes]
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

  const rawChartData = React.useMemo(
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

  const displayChartData = React.useMemo(
    () => transformSeriesForScaleMode(rawChartData, seriesKeys, scaleMode),
    [rawChartData, seriesKeys, scaleMode]
  );

  const rawChartByDate = React.useMemo(
    () => new Map(rawChartData.map((point) => [String(point.date), point])),
    [rawChartData]
  );

  const rangeTotal = React.useMemo(
    () =>
      rawChartData.reduce((sum, point) => {
        let pointTotal = 0;
        for (const key of seriesKeys) {
          pointTotal += Number(point[key]) || 0;
        }
        return sum + pointTotal;
      }, 0),
    [rawChartData, seriesKeys]
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
          <div className="flex flex-wrap items-center justify-end gap-2">
            <ToggleGroup
              type="single"
              value={scaleMode}
              onValueChange={(value) =>
                value && setScaleMode(value as ChartScaleMode)
              }
              variant="outline"
              className="*:data-[slot=toggle-group-item]:!px-3"
            >
              <ToggleGroupItem value="linear">
                {tc("chart.scale.linear")}
              </ToggleGroupItem>
              <ToggleGroupItem value="loglike">
                {tc("chart.scale.loglike")}
              </ToggleGroupItem>
            </ToggleGroup>
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
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <LineChart data={displayChartData}>
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
            {scaleMode === "loglike" && (
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={52}
                tickFormatter={(value) =>
                  formatChartScaleTick(Number(value), scaleMode)
                }
              />
            )}
            <ChartTooltip
              cursor={false}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;

                const rawPoint = rawChartByDate.get(String(label));
                const byCurrency = new Map<
                  string,
                  { received?: number; paid?: number }
                >();

                for (const item of payload) {
                  const key = String(item.dataKey);
                  const currency = getCurrencyFromSeriesKey(key);
                  const raw = getRawSeriesValue(rawPoint, key);
                  if (raw <= 0) continue;

                  const entry = byCurrency.get(currency) ?? {};
                  if (isPaidSeriesKey(key)) {
                    entry.paid = raw;
                  } else {
                    entry.received = raw;
                  }
                  byCurrency.set(currency, entry);
                }

                const groups = Array.from(byCurrency.entries()).map(
                  ([currency, values]) => ({
                    currency,
                    color: colorByCurrency[currency] ?? "",
                    rows: [
                      ...(values.received != null && values.received > 0
                        ? [
                            {
                              label: t("chart.legend.received"),
                              amount: values.received,
                              symbol: symbolByCurrency[currency] ?? currency,
                            },
                          ]
                        : []),
                      ...(values.paid != null && values.paid > 0
                        ? [
                            {
                              label: t("chart.legend.paid"),
                              amount: values.paid,
                              symbol: symbolByCurrency[currency] ?? currency,
                            },
                          ]
                        : []),
                    ],
                  })
                );

                return (
                  <MultiCurrencyChartTooltip
                    dateLabel={formatDate(String(label), {
                      preset: "short",
                      fallback: emDash,
                    })}
                    groups={groups}
                  />
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
