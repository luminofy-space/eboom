"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
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
  ChartTooltipContent,
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
import { formatMoney } from "@/src/i18n/formatters";
import type { CanvasSummary } from "../types";
import { buildCashFlowChartData } from "../utils/cashFlowChartData";
import { computeDashboardStatsByCurrency } from "../utils/dashboardStats";
import { useTranslation } from "react-i18next";

interface DashboardCashFlowChartProps {
  summary?: CanvasSummary;
  currencyCode?: string;
  isLoading?: boolean;
}

export function DashboardCashFlowChart({
  summary,
  currencyCode,
  isLoading,
}: DashboardCashFlowChartProps) {
  const { t } = useTranslation("dashboard");
  const { t: tc } = useTranslation("common");
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("90d");
  const fillReceivedId = React.useId();
  const fillPaidId = React.useId();

  const primaryCurrency = React.useMemo(() => {
    if (currencyCode) return currencyCode;
    if (!summary) return undefined;
    const stats = computeDashboardStatsByCurrency(summary);
    return stats[0]?.currencyCode;
  }, [summary, currencyCode]);

  const currencySymbol = React.useMemo(() => {
    if (!summary || !primaryCurrency) return undefined;
    const stats = computeDashboardStatsByCurrency(summary);
    return stats.find((s) => s.currencyCode === primaryCurrency)?.currencySymbol;
  }, [summary, primaryCurrency]);

  const chartConfig = React.useMemo(
    () =>
      ({
        received: {
          label: t("chart.series.received"),
          color: "var(--primary)",
        },
        paid: {
          label: t("chart.series.paid"),
          color: "hsl(var(--destructive))",
        },
      }) satisfies ChartConfig,
    [t]
  );

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("30d");
    }
  }, [isMobile]);

  const filteredData = React.useMemo(
    () =>
      summary
        ? buildCashFlowChartData(
            summary.incomeEntries,
            summary.expensePayments,
            timeRange,
            primaryCurrency
          )
        : [],
    [summary, timeRange, primaryCurrency]
  );

  const rangeTotal = React.useMemo(
    () =>
      filteredData.reduce(
        (sum, point) => sum + point.received + point.paid,
        0
      ),
    [filteredData]
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
              ? t("chart.description.withData", {
                  amount: formatMoney(rangeTotal, currencySymbol),
                  timeRange: timeRangeLabel,
                })
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
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id={fillReceivedId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-received)" stopOpacity={1.0} />
                <stop offset="95%" stopColor="var(--color-received)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id={fillPaidId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-paid)" stopOpacity={0.6} />
                <stop offset="95%" stopColor="var(--color-paid)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }
                  formatter={(value, name) => (
                    <span className="tabular-nums">
                      {formatMoney(Number(value), currencySymbol)}{" "}
                      <span className="text-muted-foreground capitalize">
                        {String(name)}
                      </span>
                    </span>
                  )}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="paid"
              type="natural"
              fill={`url(#${fillPaidId})`}
              stroke="var(--color-paid)"
              stackId="a"
            />
            <Area
              dataKey="received"
              type="natural"
              fill={`url(#${fillReceivedId})`}
              stroke="var(--color-received)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
