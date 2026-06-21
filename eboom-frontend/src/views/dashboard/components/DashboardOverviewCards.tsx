"use client";

import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "@/components/ui/container";
import { Grid } from "@/components/ui/grid";
import { Stack } from "@/components/ui/stack";
import { Typography, typographyVariants } from "@/components/ui/typography";
import { useMemo } from "react";
import { formatMoney } from "@/src/i18n/formatters";
import type { CanvasSummary } from "../types";
import { computeDashboardStatsByCurrency } from "../utils/dashboardStats";
import { useTranslation } from "react-i18next";

interface DashboardOverviewCardsProps {
  summary?: CanvasSummary;
  currencyCode?: string;
  isLoading?: boolean;
}

function TrendBadge({ change }: { change: number | null }) {
  const { t: tc } = useTranslation("common");

  if (change === null) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        {tc("trends.noPriorData")}
      </Badge>
    );
  }

  const isUp = change >= 0;
  const Icon = isUp ? IconTrendingUp : IconTrendingDown;

  return (
    <Badge variant="outline">
      <Icon className="size-3" />
      {isUp ? "+" : ""}
      {change.toFixed(1)}%
    </Badge>
  );
}

export function DashboardOverviewCards({
  summary,
  currencyCode,
  isLoading,
}: DashboardOverviewCardsProps) {
  const { t } = useTranslation("dashboard");
  const { t: tc } = useTranslation("common");

  const currencyStats = useMemo(() => {
    if (!summary) return null;
    const all = computeDashboardStatsByCurrency(summary);
    if (!currencyCode) return all[0] ?? null;
    return all.find((item) => item.currencyCode === currencyCode) ?? all[0] ?? null;
  }, [summary, currencyCode]);

  if (isLoading) {
    return (
      <Container>
        <Stack gap={4}>
          <Skeleton className="h-6 w-40" />
          <Grid variant="stats" gap={4}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="@container/card">
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-32" />
                </CardHeader>
              </Card>
            ))}
          </Grid>
        </Stack>
      </Container>
    );
  }

  if (!currencyStats) {
    return (
      <Container>
        <Typography variant="muted-sm">{t("overview.noData")}</Typography>
      </Container>
    );
  }

  const { currencySymbol } = currencyStats;
  const momIncome = currencyStats.incomeStats.monthOverMonthChange;
  const momExpense = currencyStats.expenseStats.monthOverMonthChange;
  const netPositive = currencyStats.netCashFlowThisMonth >= 0;

  return (
    <Container>
      <Stack gap={4}>
        <Stack gap={1}>
          <Typography variant="title">{t("aggregations.title")}</Typography>
          <Typography variant="muted-sm">
            {t("aggregations.description", { currency: currencyStats.currencyCode })}
          </Typography>
        </Stack>

        <Grid variant="stats" gap={4}>
          <Card className="@container/card">
            <CardHeader>
              <CardDescription>{t("overview.totalBalance")}</CardDescription>
              <CardTitle className={typographyVariants({ variant: "stat" })}>
                {formatMoney(currencyStats.totalBalance, currencySymbol)}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  {t("overview.walletCount", { count: currencyStats.topWallets.length })}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <Typography variant="label">{t("overview.totalBalanceFooter")}</Typography>
              <Typography variant="muted">{t("overview.acrossWallets")}</Typography>
            </CardFooter>
          </Card>

          <Card className="@container/card">
            <CardHeader>
              <CardDescription>{t("overview.incomeReceived")}</CardDescription>
              <CardTitle className={typographyVariants({ variant: "stat" })}>
                {formatMoney(currencyStats.incomeStats.totalReceived, currencySymbol)}
              </CardTitle>
              <CardAction>
                <TrendBadge change={momIncome} />
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <Typography variant="label">
                {momIncome === null
                  ? tc("trends.noMonthOverMonth")
                  : momIncome >= 0
                    ? tc("trends.upFromLastMonth")
                    : tc("trends.downFromLastMonth")}
              </Typography>
              <Typography variant="muted">
                {t("overview.pendingIncome", {
                  amount: formatMoney(currencyStats.incomeStats.totalPending, currencySymbol),
                })}
              </Typography>
            </CardFooter>
          </Card>

          <Card className="@container/card">
            <CardHeader>
              <CardDescription>{t("overview.expensesPaid")}</CardDescription>
              <CardTitle className={typographyVariants({ variant: "stat" })}>
                {formatMoney(currencyStats.expenseStats.totalPaid, currencySymbol)}
              </CardTitle>
              <CardAction>
                <TrendBadge change={momExpense} />
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <Typography variant="label">
                {momExpense === null
                  ? tc("trends.noMonthOverMonth")
                  : momExpense >= 0
                    ? tc("trends.upFromLastMonth")
                    : tc("trends.downFromLastMonth")}
              </Typography>
              <Typography variant="muted">
                {t("overview.unpaidExpenses", {
                  amount: formatMoney(currencyStats.expenseStats.totalUnpaid, currencySymbol),
                })}
              </Typography>
            </CardFooter>
          </Card>

          <Card className="@container/card">
            <CardHeader>
              <CardDescription>{t("overview.netCashFlow")}</CardDescription>
              <CardTitle className={typographyVariants({ variant: "stat" })}>
                {formatMoney(currencyStats.netCashFlowThisMonth, currencySymbol)}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">{t("overview.thisMonth")}</Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <Typography variant="label" className="flex items-center gap-2">
                {netPositive ? (
                  <IconTrendingUp className="size-4" />
                ) : (
                  <IconTrendingDown className="size-4" />
                )}
                {netPositive ? t("overview.netPositive") : t("overview.netNegative")}
              </Typography>
              <Typography variant="muted">{t("overview.netCashFlowFooter")}</Typography>
            </CardFooter>
          </Card>
        </Grid>
      </Stack>
    </Container>
  );
}
