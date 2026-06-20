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
import { computeWalletStats, formatMoney, WalletEntry, WalletPayment } from "../utils/utils";
import { useTranslation } from "react-i18next";

interface WalletSummaryCardsProps {
  entries: WalletEntry[];
  payments: WalletPayment[];
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
      <Icon className="size-3" />
      {isUp ? "+" : ""}
      {change.toFixed(1)}%
    </Badge>
  );
}

export function WalletSummaryCards({
  entries,
  payments,
  currencySymbol,
  isLoading,
}: WalletSummaryCardsProps) {
  const { t } = useTranslation("wallets");
  const { t: tc } = useTranslation("common");
  const stats = useMemo(() => computeWalletStats(entries, payments), [entries, payments]);

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

  const entryChange = stats.monthOverMonthEntryChange;
  const entryIsUp = entryChange !== null && entryChange >= 0;
  const paymentChange = stats.monthOverMonthPaymentChange;
  const paymentIsUp = paymentChange !== null && paymentChange >= 0;
  const entryUnit = stats.receivedCount === 1 ? tc("plurals.entry") : tc("plurals.entries");
  const paymentUnit = stats.paidCount === 1 ? tc("plurals.payment") : tc("plurals.payments");

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
            <TrendBadge change={entryChange} />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <Typography variant="label" className="line-clamp-1 flex gap-2">
            {entryChange === null
              ? tc("trends.noMonthOverMonth")
              : entryIsUp
                ? tc("trends.upFromLastMonth")
                : tc("trends.downFromLastMonth")}
            {entryChange !== null &&
              (entryIsUp ? (
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
          <CardDescription>{t("summaryCards.pendingIncoming.label")}</CardDescription>
          <CardTitle className={typographyVariants({ variant: "stat" })}>
            {formatMoney(stats.totalPending, currencySymbol)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">{t("summaryCards.pendingIncoming.badge", { count: stats.pendingCount })}</Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <Typography variant="label" className="line-clamp-1 flex gap-2">
            {t("summaryCards.pendingIncoming.footerTitle")}
          </Typography>
          <Typography variant="muted">
            {t("summaryCards.pendingIncoming.footerDescription")}
          </Typography>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{t("summaryCards.totalPaid.label")}</CardDescription>
          <CardTitle className={typographyVariants({ variant: "stat" })}>
            {formatMoney(stats.totalPaid, currencySymbol)}
          </CardTitle>
          <CardAction>
            <TrendBadge change={paymentChange} />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <Typography variant="label" className="line-clamp-1 flex gap-2">
            {paymentChange === null
              ? tc("trends.noMonthOverMonth")
              : paymentIsUp
                ? tc("trends.upFromLastMonth")
                : tc("trends.downFromLastMonth")}
            {paymentChange !== null &&
              (paymentIsUp ? (
                <IconTrendingUp className="size-4" />
              ) : (
                <IconTrendingDown className="size-4" />
              ))}
          </Typography>
          <Typography variant="muted">
            {t("summaryCards.totalPaid.footerCount", {
              count: stats.paidCount,
              unit: paymentUnit,
            })}
          </Typography>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{t("summaryCards.dueOutgoing.label")}</CardDescription>
          <CardTitle className={typographyVariants({ variant: "stat" })}>
            {formatMoney(stats.totalDue, currencySymbol)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">{t("summaryCards.dueOutgoing.badge", { count: stats.dueCount })}</Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <Typography variant="label" className="line-clamp-1 flex gap-2">
            {t("summaryCards.dueOutgoing.footerTitle")}
          </Typography>
          <Typography variant="muted">
            {t("summaryCards.dueOutgoing.footerDescription")}
          </Typography>
        </CardFooter>
      </Card>
      </Grid>
    </Container>
  );
}
