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

interface WalletSummaryCardsProps {
  entries: WalletEntry[];
  payments: WalletPayment[];
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

  return (
    <Container>
      <Grid variant="stats" gap={4}>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Received</CardDescription>
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
              ? "No month-over-month comparison yet"
              : entryIsUp
                ? "Up from last month"
                : "Down from last month"}
            {entryChange !== null &&
              (entryIsUp ? (
                <IconTrendingUp className="size-4" />
              ) : (
                <IconTrendingDown className="size-4" />
              ))}
          </Typography>
          <Typography variant="muted">
            {stats.receivedCount} received {stats.receivedCount === 1 ? "entry" : "entries"}
          </Typography>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Pending Incoming</CardDescription>
          <CardTitle className={typographyVariants({ variant: "stat" })}>
            {formatMoney(stats.totalPending, currencySymbol)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">{stats.pendingCount} open</Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <Typography variant="label" className="line-clamp-1 flex gap-2">
            Awaiting receipt
          </Typography>
          <Typography variant="muted">
            Entries without a received date
          </Typography>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Paid</CardDescription>
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
              ? "No month-over-month comparison yet"
              : paymentIsUp
                ? "Up from last month"
                : "Down from last month"}
            {paymentChange !== null &&
              (paymentIsUp ? (
                <IconTrendingUp className="size-4" />
              ) : (
                <IconTrendingDown className="size-4" />
              ))}
          </Typography>
          <Typography variant="muted">
            {stats.paidCount} paid {stats.paidCount === 1 ? "payment" : "payments"}
          </Typography>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Due Outgoing</CardDescription>
          <CardTitle className={typographyVariants({ variant: "stat" })}>
            {formatMoney(stats.totalDue, currencySymbol)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">{stats.dueCount} overdue</Badge>
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
      </Grid>
    </Container>
  );
}