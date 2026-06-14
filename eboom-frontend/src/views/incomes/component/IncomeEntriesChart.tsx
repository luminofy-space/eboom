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
import type { IncomeEntry } from "./IncomeEntriesTable";
import {
  buildChartData,
  formatMoney,
} from "../utils/incomeEntriesStats";

const chartConfig = {
  received: {
    label: "Received",
    color: "var(--primary)",
  },
  expected: {
    label: "Expected",
    color: "hsl(var(--muted-foreground))",
  },
} satisfies ChartConfig;

interface IncomeEntriesChartProps {
  entries: IncomeEntry[];
  currencySymbol?: string;
  isLoading?: boolean;
}

export function IncomeEntriesChart({
  entries,
  currencySymbol,
  isLoading,
}: IncomeEntriesChartProps) {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("90d");
  const fillReceivedId = React.useId();
  const fillExpectedId = React.useId();

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("30d");
    }
  }, [isMobile]);

  const filteredData = React.useMemo(
    () => buildChartData(entries, timeRange),
    [entries, timeRange]
  );

  const rangeTotal = React.useMemo(
    () =>
      filteredData.reduce(
        (sum, point) => sum + point.received + point.expected,
        0
      ),
    [filteredData]
  );

  const timeRangeLabel =
    timeRange === "7d"
      ? "last 7 days"
      : timeRange === "30d"
        ? "last 30 days"
        : "last 3 months";

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
        <CardTitle>Income Over Time</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            {rangeTotal > 0
              ? `${formatMoney(rangeTotal, currencySymbol)} received & expected for the ${timeRangeLabel}`
              : `No entries in the ${timeRangeLabel}`}
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
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select time range"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
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
                  <stop
                    offset="5%"
                    stopColor="var(--color-received)"
                    stopOpacity={1.0}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-received)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id={fillExpectedId} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-expected)"
                    stopOpacity={0.6}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-expected)"
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
                dataKey="expected"
                type="natural"
                fill={`url(#${fillExpectedId})`}
                stroke="var(--color-expected)"
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
