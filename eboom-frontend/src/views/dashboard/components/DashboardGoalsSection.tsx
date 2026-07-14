"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import API_ROUTES from "@/src/api/urls";
import useQueryApi from "@/src/api/useQuery";
import { useCanvasPermissions } from "@/src/hooks/useCanvasPermissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Grid } from "@/components/ui/grid";
import { Stack } from "@/components/ui/stack";
import { Typography, typographyVariants } from "@/components/ui/typography";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/src/i18n/formatters";
import type { SavingsGoalListItem } from "@/src/types/budget-planning";

interface DashboardGoalsSectionProps {
  canvasId?: number | null;
}

export interface GoalsCurrencySummary {
  currencyId: number;
  currencyCode: string;
  currencySymbol: string;
  availableBalance: number;
  totalTarget: number;
  coverPercent: number;
  activeGoalCount: number;
}

export function aggregateActiveGoalsByCurrency(
  goals: SavingsGoalListItem[]
): GoalsCurrencySummary[] {
  const byCurrency = new Map<number, GoalsCurrencySummary>();

  for (const item of goals) {
    if ((item.goal.status ?? "active") !== "active" || !item.progress) continue;

    const { progress, goal } = item;
    const existing = byCurrency.get(goal.currencyId);

    if (existing) {
      existing.totalTarget += Number(goal.targetAmount) || 0;
      existing.activeGoalCount += 1;
      continue;
    }

    byCurrency.set(goal.currencyId, {
      currencyId: goal.currencyId,
      currencyCode: progress.currencyCode,
      currencySymbol: progress.currencySymbol,
      availableBalance: Number(progress.availableBalance) || 0,
      totalTarget: Number(goal.targetAmount) || 0,
      coverPercent: 0,
      activeGoalCount: 1,
    });
  }

  return Array.from(byCurrency.values())
    .map((row) => ({
      ...row,
      coverPercent:
        row.totalTarget > 0
          ? Math.round((row.availableBalance / row.totalTarget) * 100)
          : 0,
    }))
    .sort((a, b) => a.currencyCode.localeCompare(b.currencyCode));
}

function coverPercentTone(percent: number): string | undefined {
  if (percent >= 100) return "text-emerald-600 dark:text-emerald-400";
  if (percent >= 80) return "text-amber-600 dark:text-amber-400";
  return undefined;
}

interface GoalsCurrencyCardProps {
  summary: GoalsCurrencySummary;
}

function GoalsCurrencyCard({ summary }: GoalsCurrencyCardProps) {
  const { t } = useTranslation("dashboard");

  return (
    <Link
      href="/budget-planning"
      className="block w-full rounded-xl border bg-card p-4 text-start shadow-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Stack gap={3}>
        <Badge variant="outline" className="w-fit">
          {summary.currencyCode}
        </Badge>
        <Stack gap={1}>
          <Typography className={typographyVariants({ variant: "stat" })}>
            {t("goals.targetForGoals", {
              amount: formatMoney(summary.totalTarget, summary.currencySymbol, {
                preset: "compact",
              }),
              count: summary.activeGoalCount,
            })}
          </Typography>
          <Typography
            variant="muted-sm"
            className={cn(coverPercentTone(summary.coverPercent))}
          >
            {t("goals.coversGoals", { percent: summary.coverPercent })}
          </Typography>
        </Stack>
      </Stack>
    </Link>
  );
}

function GoalsSectionHeader({ showViewAll }: { showViewAll: boolean }) {
  const { t } = useTranslation("dashboard");

  return (
    <Stack direction="row" align="center" justify="between" gap={4}>
      <Typography variant="title">{t("goals.title")}</Typography>
      {showViewAll && (
        <Button variant="outline" size="sm" asChild>
          <Link href="/budget-planning">{t("goals.viewAll")}</Link>
        </Button>
      )}
    </Stack>
  );
}

export function DashboardGoalsSection({ canvasId }: DashboardGoalsSectionProps) {
  const { t } = useTranslation("dashboard");
  const { t: tb } = useTranslation("budget-planning");
  const { canEdit } = useCanvasPermissions();

  const { data, isLoading } = useQueryApi<{ goals?: SavingsGoalListItem[] }>(
    canvasId ? API_ROUTES.CANVAS_SAVINGS_GOALS_LIST(canvasId) : "",
    {
      queryKey: ["savings-goals", canvasId],
      enabled: !!canvasId,
      staleTime: 60_000,
    }
  );

  const summaries = useMemo(
    () => aggregateActiveGoalsByCurrency(data?.goals ?? []),
    [data?.goals]
  );

  if (!canvasId) return null;

  if (isLoading) {
    return (
      <Container>
        <Stack gap={4}>
          <Skeleton className="h-6 w-40" />
          <Grid className="grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" gap={4}>
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </Grid>
        </Stack>
      </Container>
    );
  }

  if (summaries.length === 0) {
    return (
      <Container>
        <Stack gap={4}>
          <GoalsSectionHeader showViewAll={false} />
          <Stack
            direction="row"
            align="center"
            justify="between"
            gap={4}
            className="flex-wrap rounded-xl border bg-card px-4 py-4 shadow-sm"
          >
            <Typography variant="muted-sm">{t("goals.empty")}</Typography>
            {canEdit && (
              <Button asChild size="sm" variant="outline">
                <Link href="/budget-planning">{tb("empty.addGoal")}</Link>
              </Button>
            )}
          </Stack>
        </Stack>
      </Container>
    );
  }

  return (
    <Container>
      <Stack gap={4}>
        <GoalsSectionHeader showViewAll />
        <Grid className="grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" gap={4}>
          {summaries.map((summary) => (
            <GoalsCurrencyCard key={summary.currencyId} summary={summary} />
          ))}
        </Grid>
      </Stack>
    </Container>
  );
}
