"use client";

import Link from "next/link";
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
import type {
  BudgetCurrencyDashboardCard,
  BudgetDashboardSummary,
  BudgetPeriodDashboardSummary,
  BudgetPeriodType,
} from "@/src/types/budget-planning";
import { StatusChip } from "./StatusChip";

interface DashboardBudgetSectionProps {
  canvasId?: number | null;
}

const PERIOD_ORDER: BudgetPeriodType[] = ["weekly", "monthly", "yearly"];

type PercentTone = "danger" | "warning" | "success" | "muted";

function percentTone(data: BudgetPeriodDashboardSummary | null): PercentTone {
  if (!data) return "muted";
  if (data.isOverLimit) return "danger";
  if (data.isOverThreshold) return "warning";
  return "success";
}

const TONE_CLASS: Record<PercentTone, string | undefined> = {
  danger: "text-red-600 dark:text-red-400",
  warning: "text-amber-600 dark:text-amber-400",
  success: "text-emerald-600 dark:text-emerald-400",
  muted: "text-muted-foreground",
};

interface CategoryStatProps {
  count: number;
  label: string;
  tone: "danger" | "warning" | "success";
}

function CategoryStat({ count, label, tone }: CategoryStatProps) {
  return (
    <Badge variant="outline" className={cn(
      "tabular-nums",
      tone === "danger" && "text-red-600 dark:text-red-400",
      tone === "warning" && "text-amber-600 dark:text-amber-400",
      tone === "success" && "text-emerald-600 dark:text-emerald-400"
    )}>
      {count} {label}
    </Badge>
  );
}

interface BudgetPeriodColumnProps {
  period: BudgetPeriodType;
  data: BudgetPeriodDashboardSummary | null;
}

function BudgetPeriodColumn({ period, data }: BudgetPeriodColumnProps) {
  const { t } = useTranslation("dashboard");
  const { t: tb } = useTranslation("budget-planning");
  const tone = percentTone(data);

  return (
    <Stack
      gap={2}
      className="min-w-0 rounded-lg border border-border/60 bg-muted/20 p-3 sm:border-0 sm:bg-transparent sm:p-0"
    >
      <Typography variant="muted-sm" className="font-medium">
        {tb(`period.${period}`)}
      </Typography>

      {data ? (
        <>
          <Typography className={cn(typographyVariants({ variant: "stat" }), "text-lg", TONE_CLASS[tone])}>
            {t("budget.cards.percentUsed", { percent: Math.round(data.totalPercent) })}
          </Typography>
          <Stack gap={1}>
            <CategoryStat
              count={data.categoryOverLimit}
              label={t("budget.categories.overLimit")}
              tone="danger"
            />
            <CategoryStat
              count={data.categoryOverThreshold}
              label={t("budget.categories.warnings")}
              tone="warning"
            />
            <CategoryStat
              count={data.categoryOnTrack}
              label={t("budget.categories.onTrack")}
              tone="success"
            />
          </Stack>
        </>
      ) : (
        <Typography variant="muted-sm">{t("budget.noBudget")}</Typography>
      )}
    </Stack>
  );
}

interface BudgetCurrencyCardProps {
  currency: BudgetCurrencyDashboardCard;
}

function BudgetCurrencyCard({ currency }: BudgetCurrencyCardProps) {
  return (
    <Link
      href="/budget-planning"
      className="block w-full rounded-xl border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Stack gap={4}>
        <Badge variant="outline" className="w-fit">
          {currency.currencyCode}
        </Badge>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {PERIOD_ORDER.map((period) => (
            <BudgetPeriodColumn
              key={period}
              period={period}
              data={currency.periods[period]}
            />
          ))}
        </div>
      </Stack>
    </Link>
  );
}

function BudgetSectionHeader({ showViewAll }: { showViewAll: boolean }) {
  const { t } = useTranslation("dashboard");

  return (
    <Stack direction="row" align="center" justify="between" gap={4}>
      <Typography variant="title">{t("budget.title")}</Typography>
      {showViewAll && (
        <Button variant="outline" size="sm" asChild>
          <Link href="/budget-planning">{t("budget.viewAll")}</Link>
        </Button>
      )}
    </Stack>
  );
}

export function DashboardBudgetSection({ canvasId }: DashboardBudgetSectionProps) {
  const { t } = useTranslation("dashboard");
  const { t: tb } = useTranslation("budget-planning");
  const { canEdit } = useCanvasPermissions();

  const { data, isLoading } = useQueryApi<BudgetDashboardSummary>(
    canvasId ? API_ROUTES.CANVAS_BUDGETS_SUMMARY(canvasId) : "",
    {
      queryKey: ["budget-summary", canvasId],
      enabled: !!canvasId,
      staleTime: 60_000,
    }
  );

  if (!canvasId) return null;

  if (isLoading) {
    return (
      <Container>
        <Stack gap={4}>
          <Skeleton className="h-6 w-24" />
          <Grid className="grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" gap={4}>
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </Grid>
        </Stack>
      </Container>
    );
  }

  const currencies = data?.currencies ?? [];

  if (currencies.length === 0) {
    return (
      <Container>
        <Stack gap={4}>
          <BudgetSectionHeader showViewAll={false} />
          <Stack
            direction="row"
            align="center"
            justify="between"
            gap={4}
            className="flex-wrap rounded-xl border bg-card px-4 py-4 shadow-sm"
          >
            <Typography variant="muted-sm">{t("budget.empty")}</Typography>
            {canEdit && (
              <Button asChild size="sm" variant="outline">
                <Link href="/budget-planning">{tb("empty.createBudget")}</Link>
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
        <BudgetSectionHeader showViewAll />
        <Grid className="grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" gap={4}>
          {currencies.map((currency) => (
            <BudgetCurrencyCard key={currency.currencyId} currency={currency} />
          ))}
        </Grid>
      </Stack>
    </Container>
  );
}
