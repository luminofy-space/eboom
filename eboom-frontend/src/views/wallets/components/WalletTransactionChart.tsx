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
import { Skeleton } from "@/components/ui/skeleton";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  buildChartData,
  formatMoney,
} from "../utils/utils";
import { formatDate } from "@/src/i18n/formatters";
import { useWalletDetail } from "../hooks/useWalletDetail";
import { useTranslation } from "react-i18next";

interface WalletTransactionChartProps {
  walletId: number
}

export function WalletTransactionChart({
  walletId
}: WalletTransactionChartProps) {
  const { t } = useTranslation("wallets");
  const { t: tc } = useTranslation("common");
  const emDash = tc("empty.emDash");
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("90d");
  const fillEntriesId = React.useId();
  const fillPaymentsId = React.useId();
  const fillTransferInId = React.useId();
  const fillTransferOutId = React.useId();

  const chartConfig = React.useMemo(
    () =>
      ({
        entries: {
          label: t("chart.series.incoming"),
          color: "var(--primary)",
        },
        payments: {
          label: t("chart.series.outgoing"),
          color: "hsl(var(--destructive))",
        },
        transferIn: {
          label: t("chart.series.transferIn"),
          color: "hsl(142 76% 36%)",
        },
        transferOut: {
          label: t("chart.series.transferOut"),
          color: "hsl(38 92% 50%)",
        },
      }) satisfies ChartConfig,
    [t]
  );

  const { entries, payments, transfers, currencySymbol, isLoading } = useWalletDetail(walletId);

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("30d");
    }
  }, [isMobile]);

  const filteredData = React.useMemo(
    () => buildChartData(entries, payments, transfers, walletId, timeRange),
    [entries, payments, transfers, walletId, timeRange]
  );

  const rangeTotal = React.useMemo(
    () =>
      filteredData.reduce(
        (sum, point) => sum + point.entries + point.payments + point.transferIn + point.transferOut,
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
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
              <defs>
                <linearGradient id={fillEntriesId} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-entries)"
                    stopOpacity={1.0}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-entries)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id={fillTransferOutId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-transferOut)" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="var(--color-transferOut)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id={fillTransferInId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-transferIn)" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="var(--color-transferIn)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id={fillPaymentsId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-payments)" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="var(--color-payments)" stopOpacity={0.05} />
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
                dataKey="transferOut"
                type="natural"
                fill={`url(#${fillTransferOutId})`}
                stroke="var(--color-transferOut)"
                stackId="a"
              />
              <Area
                dataKey="transferIn"
                type="natural"
                fill={`url(#${fillTransferInId})`}
                stroke="var(--color-transferIn)"
                stackId="a"
              />
              <Area
                dataKey="payments"
                type="natural"
                fill={`url(#${fillPaymentsId})`}
                stroke="var(--color-payments)"
                stackId="a"
              />
              <Area
                dataKey="entries"
                type="natural"
                fill={`url(#${fillEntriesId})`}
                stroke="var(--color-entries)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
      </CardContent>
    </Card>
  );
}
