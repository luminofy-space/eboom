"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import API_ROUTES from "@/src/api/urls";
import useQueryApi from "@/src/api/useQuery";
import { useCanvasPermissions } from "@/src/hooks/useCanvasPermissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/src/i18n/formatters";
import { BudgetProgressBar } from "@/src/views/budget-planning/components/BudgetProgressBar";
import type { BudgetSummaryItem } from "@/src/views/budget-planning/types";

interface DashboardBudgetSectionProps {
  canvasId?: number | null;
}

export function DashboardBudgetSection({ canvasId }: DashboardBudgetSectionProps) {
  const { t } = useTranslation("budget-planning");
  const { canEdit } = useCanvasPermissions();

  const { data, isLoading } = useQueryApi<{ summary?: BudgetSummaryItem[] }>(
    canvasId ? API_ROUTES.CANVAS_BUDGETS_SUMMARY(canvasId) : "",
    {
      queryKey: ["budget-summary", canvasId],
      enabled: !!canvasId,
      staleTime: 60_000,
    }
  );

  const summaries = (data?.summary ?? []).filter((s) => s.periodType === "monthly");
  const primary = summaries[0];

  if (!canvasId) return null;

  if (isLoading) {
    return (
      <Container>
        <Skeleton className="h-40 w-full rounded-xl" />
      </Container>
    );
  }

  if (!primary) {
    return (
      <Container>
        <Card>
          <CardContent className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
            <Typography variant="muted-sm">{t("dashboard.prompt")}</Typography>
            {canEdit && (
              <Button asChild size="sm" variant="outline">
                <Link href="/budget-planning">{t("empty.createBudget")}</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">{t("dashboard.title")}</CardTitle>
          <Button asChild size="sm" variant="ghost">
            <Link href="/budget-planning">{t("actions.viewBudget")}</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <Typography variant="muted-sm">
              {primary.currencyCode} · {t("period.monthly")}
            </Typography>
            {primary.isOverThreshold && (
              <Typography variant="muted-sm" className="text-amber-600 dark:text-amber-400">
                {t("dashboard.almostAtLimit")}
              </Typography>
            )}
          </div>

          <BudgetProgressBar
            percent={primary.totalPercent}
            threshold={primary.alertThresholdPercent}
          />

          <div className="grid gap-2 sm:grid-cols-3 text-sm">
            <div>
              <Typography variant="muted-sm">{t("labels.spent")}</Typography>
              <Typography className="tabular-nums">
                {formatCurrency(primary.totalSpent, primary.currencySymbol, { preset: "compact" })}
              </Typography>
            </div>
            <div>
              <Typography variant="muted-sm">{t("labels.left")}</Typography>
              <Typography className="tabular-nums">
                {formatCurrency(primary.totalRemaining, primary.currencySymbol, {
                  preset: "compact",
                })}
              </Typography>
            </div>
            <div>
              <Typography variant="muted-sm">{t("labels.limit")}</Typography>
              <Typography className="tabular-nums">
                {formatCurrency(primary.totalLimit, primary.currencySymbol, { preset: "compact" })}
              </Typography>
            </div>
          </div>

          {primary.topCategories.length > 0 && (
            <Stack gap={2}>
              {primary.topCategories.map((cat) => (
                <BudgetProgressBar
                  key={cat.categoryName}
                  label={cat.categoryName}
                  percent={cat.percent}
                  threshold={primary.alertThresholdPercent}
                />
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
