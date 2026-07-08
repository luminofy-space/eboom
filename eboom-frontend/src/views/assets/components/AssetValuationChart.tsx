"use client";

import * as React from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatDate, formatMoney } from "@/src/i18n/formatters";
import type { AssetValuationSeriesPoint } from "../hooks/useAssetDetail";
import { useTranslation } from "react-i18next";

interface AssetValuationChartProps {
  series: AssetValuationSeriesPoint[];
  currencySymbol?: string;
  isLoading?: boolean;
}

function daysAgo(days: number): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d.getTime();
}

export function AssetValuationChart({
  series,
  currencySymbol,
  isLoading,
}: AssetValuationChartProps) {
  const { t } = useTranslation("assets");
  const { t: tc } = useTranslation("common");
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("90d");

  React.useEffect(() => {
    if (isMobile) setTimeRange("30d");
  }, [isMobile]);

  const chartConfig = React.useMemo(
    () =>
      ({
        unrealizedPnL: {
          label: t("chart.legend.unrealizedPnL"),
          color: "hsl(142 76% 36%)",
        },
        holdingValue: {
          label: t("chart.legend.holdingValue"),
          color: "hsl(221 83% 53%)",
        },
      }) satisfies ChartConfig,
    [t]
  );

  const chartData = React.useMemo(() => {
    const cutoff =
      timeRange === "7d"
        ? daysAgo(7)
        : timeRange === "30d"
          ? daysAgo(30)
          : timeRange === "90d"
            ? daysAgo(90)
            : Number.NEGATIVE_INFINITY;

    return series
      .filter((point) => new Date(point.recordedAt).getTime() >= cutoff)
      .map((point) => ({
        date: point.recordedAt.slice(0, 10),
        recordedAt: point.recordedAt,
        unrealizedPnL: Number(point.unrealizedPnL) || 0,
        holdingValue: Number(point.holdingValue) || 0,
        unitPrice: Number(point.unitPrice) || 0,
      }));
  }, [series, timeRange]);

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
        <CardDescription>{t("chart.description")}</CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(value) => value && setTimeRange(value)}
            variant="outline"
            className="*:data-[slot=toggle-group-item]:!px-3"
          >
            <ToggleGroupItem value="7d">{t("chart.timeRange.7d")}</ToggleGroupItem>
            <ToggleGroupItem value="30d">{t("chart.timeRange.30d")}</ToggleGroupItem>
            <ToggleGroupItem value="90d">{t("chart.timeRange.90d")}</ToggleGroupItem>
            <ToggleGroupItem value="all">{t("chart.timeRange.all")}</ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <Typography variant="muted-sm" className="py-12 text-center">
            {t("chart.empty")}
          </Typography>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <LineChart data={chartData} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => formatDate(String(value), { fallback: "" })}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => formatMoney(String(value), currencySymbol)}
              />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => formatDate(String(value), { fallback: tc("empty.emDash") })}
                    formatter={(value, name) => (
                      <span className="font-medium tabular-nums">
                        {formatMoney(String(value), currencySymbol)}{" "}
                        <span className="text-muted-foreground">
                          {chartConfig[name as keyof typeof chartConfig]?.label ?? name}
                        </span>
                      </span>
                    )}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="unrealizedPnL"
                stroke="var(--color-unrealizedPnL)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="holdingValue"
                stroke="var(--color-holdingValue)"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
