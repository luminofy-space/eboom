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
          <CardDescription>Total Received</CardDescription>
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
            {stats.receivedCount} received{" "}
            {stats.receivedCount === 1 ? "entry" : "entries"}
          </Typography>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Pending</CardDescription>
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
          <CardDescription>Total Entries</CardDescription>
          <CardTitle className={typographyVariants({ variant: "stat" })}>
            {stats.entryCount}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {stats.receivedCount} / {stats.entryCount} received
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <Typography variant="label" className="line-clamp-1 flex gap-2">
            All recorded payments
          </Typography>
          <Typography variant="muted">
            Includes received and pending
          </Typography>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Average Payment</CardDescription>
          <CardTitle className={typographyVariants({ variant: "stat" })}>
            {formatMoney(stats.averageReceived, currencySymbol)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">Per received entry</Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <Typography variant="label" className="line-clamp-1 flex gap-2">
            Based on {stats.receivedCount}{" "}
            {stats.receivedCount === 1 ? "payment" : "payments"}
          </Typography>
          <Typography variant="muted">
            Mean amount across received entries
          </Typography>
        </CardFooter>
      </Card>
      </Grid>
    </Container>
  );
}
