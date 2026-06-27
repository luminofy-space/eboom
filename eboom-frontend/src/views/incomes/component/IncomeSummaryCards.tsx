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
import { Typography, typographyVariants } from "@/components/ui/typography";
import { useMemo } from "react";
import type { IncomeEntry } from "./IncomeEntriesTable";
import { computeIncomeStats, formatMoney } from "../utils/incomeEntriesStats";
import { useTranslation } from "react-i18next";

interface IncomeSummaryCardsProps {
  entries: IncomeEntry[];
  currencySymbol?: string;
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
      <Icon />
      {isUp ? "+" : ""}
      {change.toFixed(1)}%
    </Badge>
  );
}

export function IncomeSummaryCards({
  entries,
  currencySymbol,
  isLoading,
}: IncomeSummaryCardsProps) {
  const { t } = useTranslation("incomes");
  const { t: tc } = useTranslation("common");
  const stats = useMemo(() => computeIncomeStats(entries), [entries]);

  if (isLoading) {
    return (
      <Container>
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
      </Container>
    );
  }

  const momChange = stats.monthOverMonthChange;
  const momIsUp = momChange !== null && momChange >= 0;
  const entryUnit = stats.receivedCount === 1 ? tc("plurals.entry") : tc("plurals.entries");

  return (
    <Container>
      <Grid variant="stats" gap={4}>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{t("summaryCards.totalReceived.label")}</CardDescription>
          <CardTitle className={typographyVariants({ variant: "stat" })}>
            {formatMoney(stats.totalReceived, currencySymbol)}
          </CardTitle>
          <CardAction>
            <TrendBadge change={momChange} />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <Typography variant="label" className="line-clamp-1 flex gap-2">
            {momChange === null
              ? tc("trends.noMonthOverMonth")
              : momIsUp
                ? tc("trends.upFromLastMonth")
                : tc("trends.downFromLastMonth")}
            {momChange !== null &&
              (momIsUp ? (
                <IconTrendingUp className="size-4" />
              ) : (
                <IconTrendingDown className="size-4" />
              ))}
          </Typography>
          <Typography variant="muted">
            {t("summaryCards.totalReceived.footerCount", {
              count: stats.receivedCount,
              unit: entryUnit,
            })}
          </Typography>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{t("summaryCards.pending.label")}</CardDescription>
          <CardTitle className={typographyVariants({ variant: "stat" })}>
            {formatMoney(stats.totalPending, currencySymbol)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">{t("summaryCards.pending.badge", { count: stats.pendingCount })}</Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <Typography variant="label" className="line-clamp-1 flex gap-2">
            {t("summaryCards.pending.footerTitle")}
          </Typography>
          <Typography variant="muted">
            {t("summaryCards.pending.footerDescription")}
          </Typography>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{t("summaryCards.totalEntries.label")}</CardDescription>
          <CardTitle className={typographyVariants({ variant: "stat" })}>
            {stats.entryCount}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {t("summaryCards.totalEntries.badge", {
                receivedCount: stats.receivedCount,
                totalCount: stats.entryCount,
              })}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <Typography variant="label" className="line-clamp-1 flex gap-2">
            {t("summaryCards.totalEntries.footerTitle")}
          </Typography>
          <Typography variant="muted">
            {t("summaryCards.totalEntries.footerDescription")}
          </Typography>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{t("summaryCards.averagePayment.label")}</CardDescription>
          <CardTitle className={typographyVariants({ variant: "stat" })}>
            {formatMoney(stats.averageReceived, currencySymbol)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">{t("summaryCards.averagePayment.badge")}</Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <Typography variant="label" className="line-clamp-1 flex gap-2">
            {t("summaryCards.averagePayment.footerTitle", {
              count: stats.receivedCount,
              unit: entryUnit,
            })}
          </Typography>
          <Typography variant="muted">
            {t("summaryCards.averagePayment.footerDescription")}
          </Typography>
        </CardFooter>
      </Card>
      </Grid>
    </Container>
  );
}
