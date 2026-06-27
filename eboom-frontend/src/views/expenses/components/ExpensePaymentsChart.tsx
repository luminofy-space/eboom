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
import type { ExpensePayment } from "./ExpensePaymentsTable";
import {
  buildChartData,
  formatMoney,
} from "../utils/expensePaymentsStats";
import { formatDate } from "@/src/i18n/formatters";
import { useTranslation } from "react-i18next";

interface ExpensePaymentsChartProps {
  payments: ExpensePayment[];
  currencySymbol?: string;
  isLoading?: boolean;
}

export function ExpensePaymentsChart({
  payments,
  currencySymbol,
  isLoading,
}: ExpensePaymentsChartProps) {
  const { t } = useTranslation("expenses");
  const { t: tc } = useTranslation("common");
  const emDash = tc("empty.emDash");
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("90d");
  const fillPaidId = React.useId();
  const fillDueId = React.useId();

  const chartConfig = React.useMemo(
    () =>
      ({
        paid: {
          label: t("chart.series.paid"),
          color: "var(--primary)",
        },
        due: {
          label: t("chart.series.due"),
          color: "hsl(var(--muted-foreground))",
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
    () => buildChartData(payments, timeRange),
    [payments, timeRange]
  );

  const rangeTotal = React.useMemo(
    () =>
      filteredData.reduce((sum, point) => sum + point.paid + point.due, 0),
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
                <linearGradient id={fillPaidId} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-paid)"
                    stopOpacity={1.0}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-paid)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id={fillDueId} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-due)"
                    stopOpacity={0.6}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-due)"
                    stopOpacity={0.05}
                  />
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
                  formatDate(value, { preset: "monthDay", fallback: emDash })
                }
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) =>
                      formatDate(value, { preset: "short", fallback: emDash })
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
                dataKey="due"
                type="natural"
                fill={`url(#${fillDueId})`}
                stroke="var(--color-due)"
                stackId="a"
              />
              <Area
                dataKey="paid"
                type="natural"
                fill={`url(#${fillPaidId})`}
                stroke="var(--color-paid)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
      </CardContent>
    </Card>
  );
}
