"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useTranslation } from "react-i18next";
import {
  Card,
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
import { formatCurrency, formatDate } from "@/src/i18n/formatters";
import type { CashFlowForecast } from "../types";

interface ForecastChartProps {
  forecast?: CashFlowForecast;
  isLoading?: boolean;
}

export function ForecastChart({ forecast, isLoading }: ForecastChartProps) {
  const { t } = useTranslation("budget-planning");
  const { t: tc } = useTranslation("common");
  const emDash = tc("empty.emDash");

  const chartData = useMemo(
    () =>
      (forecast?.points ?? []).map((p) => ({
        date: p.date,
        expectedIn: parseFloat(p.expectedIn) || 0,
        expectedOut: parseFloat(p.expectedOut) || 0,
      })),
    [forecast]
  );

  const chartConfig = {
    expectedIn: { label: t("labels.expectedIn"), color: "hsl(var(--chart-1))" },
    expectedOut: { label: t("labels.expectedOut"), color: "hsl(var(--chart-2))" },
  } satisfies ChartConfig;

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!forecast) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("tabs.forecast")}</CardTitle>
        <CardDescription>{t("labels.forecastDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatDate(v, { preset: "monthDay", fallback: emDash })}
            />
            <YAxis tickLine={false} axisLine={false} width={48} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(v) =>
                    formatDate(String(v), { preset: "short", fallback: emDash })
                  }
                />
              }
            />
            <Bar dataKey="expectedIn" fill="var(--color-expectedIn)" radius={2} />
            <Bar dataKey="expectedOut" fill="var(--color-expectedOut)" radius={2} />
          </BarChart>
        </ChartContainer>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Typography variant="muted-sm">{t("labels.currentBalance")}</Typography>
            <Typography variant="stat">
              {formatCurrency(forecast.currentBalance, forecast.currencySymbol, {
                preset: "compact",
              })}
            </Typography>
          </div>
          <div>
            <Typography variant="muted-sm">{t("labels.expectedIn")}</Typography>
            <Typography variant="stat" className="text-emerald-600 dark:text-emerald-400">
              +{formatCurrency(forecast.totalExpectedIn, undefined, { preset: "compact" })}
            </Typography>
          </div>
          <div>
            <Typography variant="muted-sm">{t("labels.expectedOut")}</Typography>
            <Typography variant="stat" className="text-destructive">
              -{formatCurrency(forecast.totalExpectedOut, undefined, { preset: "compact" })}
            </Typography>
          </div>
        </div>

        <Typography variant="muted-sm">{t("labels.forecastHint")}</Typography>
      </CardContent>
    </Card>
  );
}
