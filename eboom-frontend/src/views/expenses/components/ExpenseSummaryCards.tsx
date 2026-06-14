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
import type { ExpensePayment } from "./ExpensePaymentsTable";
import { computeExpenseStats, formatMoney } from "../utils/expensePaymentsStats";
import { useTranslation } from "react-i18next";

interface ExpenseSummaryCardsProps {
  payments: ExpensePayment[];
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

export function ExpenseSummaryCards({
  payments,
  currencySymbol,
  isLoading,
}: ExpenseSummaryCardsProps) {
  const { t } = useTranslation("expenses");
  const { t: tc } = useTranslation("common");
  const stats = useMemo(() => computeExpenseStats(payments), [payments]);

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
  const paymentUnit = stats.paidCount === 1 ? tc("plurals.payment") : tc("plurals.payments");

  return (
    <Container>
      <Grid variant="stats" gap={4}>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{t("summaryCards.totalPaid.label")}</CardDescription>
          <CardTitle className={typographyVariants({ variant: "stat" })}>
            {formatMoney(stats.totalPaid, currencySymbol)}
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
            {t("summaryCards.totalPaid.footerCount", {
              count: stats.paidCount,
              unit: paymentUnit,
            })}
          </Typography>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{t("summaryCards.unpaid.label")}</CardDescription>
          <CardTitle className={typographyVariants({ variant: "stat" })}>
            {formatMoney(stats.totalUnpaid, currencySymbol)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">{t("summaryCards.unpaid.badge", { count: stats.unpaidCount })}</Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <Typography variant="label" className="line-clamp-1 flex gap-2">
            {t("summaryCards.unpaid.footerTitle")}
          </Typography>
          <Typography variant="muted">
            {t("summaryCards.unpaid.footerDescription")}
          </Typography>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{t("summaryCards.totalPayments.label")}</CardDescription>
          <CardTitle className={typographyVariants({ variant: "stat" })}>
            {stats.paymentCount}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {t("summaryCards.totalPayments.badge", {
                paidCount: stats.paidCount,
                totalCount: stats.paymentCount,
              })}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <Typography variant="label" className="line-clamp-1 flex gap-2">
            {t("summaryCards.totalPayments.footerTitle")}
          </Typography>
          <Typography variant="muted">
            {t("summaryCards.totalPayments.footerDescription")}
          </Typography>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{t("summaryCards.averagePayment.label")}</CardDescription>
          <CardTitle className={typographyVariants({ variant: "stat" })}>
            {formatMoney(stats.averagePaid, currencySymbol)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">{t("summaryCards.averagePayment.badge")}</Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <Typography variant="label" className="line-clamp-1 flex gap-2">
            {t("summaryCards.averagePayment.footerTitle", {
              count: stats.paidCount,
              unit: paymentUnit,
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
