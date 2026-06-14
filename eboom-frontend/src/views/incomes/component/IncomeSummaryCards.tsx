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
import type { IncomeEntry } from "./IncomeEntriesTable";
import { computeIncomeStats, formatMoney } from "../utils/incomeEntriesStats";

interface IncomeSummaryCardsProps {
  entries: IncomeEntry[];
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

export function IncomeSummaryCards({
  entries,
  currencySymbol,
  isLoading,
}: IncomeSummaryCardsProps) {
  const stats = useMemo(() => computeIncomeStats(entries), [entries]);

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

  const momChange = stats.monthOverMonthChange;
  const momIsUp = momChange !== null && momChange >= 0;

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Received</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatMoney(stats.totalReceived, currencySymbol)}
          </CardTitle>
          <CardAction>
            <TrendBadge change={momChange} />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
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
          </div>
          <div className="text-muted-foreground">
            {stats.receivedCount} received{" "}
            {stats.receivedCount === 1 ? "entry" : "entries"}
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Pending</CardDescription>
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
          <CardDescription>Total Entries</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.entryCount}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {stats.receivedCount} / {stats.entryCount} received
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            All recorded payments
          </div>
          <div className="text-muted-foreground">
            Includes received and pending
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Average Payment</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatMoney(stats.averageReceived, currencySymbol)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">Per received entry</Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Based on {stats.receivedCount}{" "}
            {stats.receivedCount === 1 ? "payment" : "payments"}
          </div>
          <div className="text-muted-foreground">
            Mean amount across received entries
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
