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

interface ExpenseSummaryCardsProps {
  payments: ExpensePayment[];
  currencySymbol?: string;
  isLoading?: boolean;
}

function TrendBadge({ change }: { change: number | null }) {
  if (change === null) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        No prior data
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

  return (
    <Container>
      <Grid variant="stats" gap={4}>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Paid</CardDescription>
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
              ? "No month-over-month comparison yet"
              : momIsUp
                ? "Up from last month"
                : "Down from last month"}
            {momChange !== null &&
              (momIsUp ? (
                <IconTrendingUp className="size-4" />
              ) : (
                <IconTrendingDown className="size-4" />
              ))}
          </Typography>
          <Typography variant="muted">
            {stats.paidCount} paid{" "}
            {stats.paidCount === 1 ? "payment" : "payments"}
          </Typography>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Unpaid</CardDescription>
          <CardTitle className={typographyVariants({ variant: "stat" })}>
            {formatMoney(stats.totalUnpaid, currencySymbol)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">{stats.unpaidCount} open</Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <Typography variant="label" className="line-clamp-1 flex gap-2">
            Awaiting payment
          </Typography>
          <Typography variant="muted">
            Payments without a paid date
          </Typography>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Payments</CardDescription>
          <CardTitle className={typographyVariants({ variant: "stat" })}>
            {stats.paymentCount}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {stats.paidCount} / {stats.paymentCount} paid
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <Typography variant="label" className="line-clamp-1 flex gap-2">
            All recorded payments
          </Typography>
          <Typography variant="muted">
            Includes paid and unpaid
          </Typography>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Average Payment</CardDescription>
          <CardTitle className={typographyVariants({ variant: "stat" })}>
            {formatMoney(stats.averagePaid, currencySymbol)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">Per paid payment</Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <Typography variant="label" className="line-clamp-1 flex gap-2">
            Based on {stats.paidCount}{" "}
            {stats.paidCount === 1 ? "payment" : "payments"}
          </Typography>
          <Typography variant="muted">
            Mean amount across paid payments
          </Typography>
        </CardFooter>
      </Card>
      </Grid>
    </Container>
  );
}
