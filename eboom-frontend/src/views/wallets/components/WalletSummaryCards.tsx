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
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="@container/card">
            <CardHeader>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  const entryChange = stats.monthOverMonthEntryChange;
  const entryIsUp = entryChange !== null && entryChange >= 0;
  const paymentChange = stats.monthOverMonthPaymentChange;
  const paymentIsUp = paymentChange !== null && paymentChange >= 0;

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Received</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatMoney(stats.totalReceived, currencySymbol)}
          </CardTitle>
          <CardAction>
            <TrendBadge change={entryChange} />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
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
          </div>
          <div className="text-muted-foreground">
            {stats.receivedCount} received {stats.receivedCount === 1 ? "entry" : "entries"}
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Pending Incoming</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatMoney(stats.totalPending, currencySymbol)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">{stats.pendingCount} open</Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Awaiting receipt
          </div>
          <div className="text-muted-foreground">
            Entries without a received date
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Paid</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatMoney(stats.totalPaid, currencySymbol)}
          </CardTitle>
          <CardAction>
            <TrendBadge change={paymentChange} />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
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
          </div>
          <div className="text-muted-foreground">
            {stats.paidCount} paid {stats.paidCount === 1 ? "payment" : "payments"}
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Due Outgoing</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatMoney(stats.totalDue, currencySymbol)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">{stats.dueCount} overdue</Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Awaiting payment
          </div>
          <div className="text-muted-foreground">
            Payments without a paid date
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}