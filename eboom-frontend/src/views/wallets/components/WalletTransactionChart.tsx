"use client";

import * as React from "react";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
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
import { getCurrencyColorMap } from "@/src/views/dashboard/utils/assignCurrencyChartColors";
import { useWalletDetail } from "../hooks/useWalletDetail";
import {
  assignWalletCurrencyChartColors,
  buildMultiCurrencyWalletChartData,
  buildWalletMultiCurrencySeriesKeys,
  getWalletCurrencyFromSeriesKey,
} from "../utils/currencyFilter";
import { WalletChartLegend } from "./WalletChartLegend";
import { useTranslation } from "react-i18next";

interface WalletTransactionChartProps {
  walletId: number;
}

function isOutgoingSeriesKey(seriesKey: string): boolean {
  return seriesKey.endsWith("_outgoing") || seriesKey.endsWith("_transferOut");
}

export function WalletTransactionChart({ walletId }: WalletTransactionChartProps) {
  const { t } = useTranslation("wallets");
  const { t: tc } = useTranslation("common");
  const emDash = tc("empty.emDash");
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("90d");
  const [scaleMode, setScaleMode] = React.useState<ChartScaleMode>("loglike");

  const { entries, payments, transfers, currencyOptions, isLoading } =
    useWalletDetail(walletId);

  const currencyCodes = React.useMemo(
    () => currencyOptions.map((o) => o.code),
    [currencyOptions]
  );

  const symbolByCurrency = React.useMemo(
    () => Object.fromEntries(currencyOptions.map((o) => [o.code, o.symbol])),
    [currencyOptions]
  );

  const colorByCurrency = React.useMemo(
    () => getCurrencyColorMap(currencyCodes),
    [currencyCodes]
  );

  const seriesKeys = React.useMemo(
    () => buildWalletMultiCurrencySeriesKeys(currencyCodes),
    [currencyCodes]
  );

  const colorMap = React.useMemo(
    () => assignWalletCurrencyChartColors(currencyCodes),
    [currencyCodes]
  );

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {};
    for (const key of seriesKeys) {
      const currency = getWalletCurrencyFromSeriesKey(key);
      const suffix = key.replace(`${currency}_`, "");
      const labelKey =
        suffix === "incoming"
          ? "chart.legend.incoming"
          : suffix === "outgoing"
            ? "chart.legend.outgoing"
            : suffix === "transferIn"
              ? "chart.legend.transferIn"
              : "chart.legend.transferOut";
      config[key] = {
        label: `${currency} ${t(labelKey)}`,
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
      buildMultiCurrencyWalletChartData(
        entries,
        payments,
        transfers,
        walletId,
        timeRange,
        currencyCodes
      ),
    [entries, payments, transfers, walletId, timeRange, currencyCodes]
  );

  const displayChartData = React.useMemo(
    () => transformSeriesForScaleMode(rawChartData, seriesKeys, scaleMode),
    [rawChartData, seriesKeys, scaleMode]
  );

  const rawChartByDate = React.useMemo(
    () => new Map(rawChartData.map((point) => [String(point.date), point])),
    [rawChartData]
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
            {currencyCodes.length > 0
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
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {currencyCodes.length === 0 ? (
          <Typography variant="muted-sm" className="py-8 text-center">
            {t("detail.noBalancesYet")}
          </Typography>
        ) : (
          <>
            <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
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
                      Array<{ label: string; amount: number; symbol: string }>
                    >();

                    for (const item of payload) {
                      const key = String(item.dataKey);
                      const raw = getRawSeriesValue(rawPoint, key);
                      if (raw <= 0) continue;

                      const currency = getWalletCurrencyFromSeriesKey(key);
                      const suffix = key.replace(`${currency}_`, "");
                      const seriesLabel =
                        suffix === "incoming"
                          ? t("chart.legend.incoming")
                          : suffix === "outgoing"
                            ? t("chart.legend.outgoing")
                            : suffix === "transferIn"
                              ? t("chart.legend.transferIn")
                              : t("chart.legend.transferOut");

                      const rows = byCurrency.get(currency) ?? [];
                      rows.push({
                        label: seriesLabel,
                        amount: raw,
                        symbol: symbolByCurrency[currency] ?? currency,
                      });
                      byCurrency.set(currency, rows);
                    }

                    const groups = Array.from(byCurrency.entries()).map(
                      ([currency, rows]) => ({
                        currency,
                        color: colorByCurrency[currency] ?? "",
                        rows,
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
                    strokeDasharray={isOutgoingSeriesKey(key) ? "4 4" : undefined}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ChartContainer>
            <WalletChartLegend currencyCodes={currencyCodes} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
