"use client";

import * as React from "react";
import Link from "next/link";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Grid } from "@/components/ui/grid";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Stack } from "@/components/ui/stack";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Typography, typographyVariants } from "@/components/ui/typography";
import { formatMoney } from "@/src/i18n/formatters";
import type { CanvasSummary } from "@/src/types/dashboard";
import {
  computeDashboardStatsByCurrency,
  type CurrencyDashboardStats,
} from "../utils/dashboardStats";
import { CurrencyAssetDetail } from "./CurrencyAssetDetail";
import { useTranslation } from "react-i18next";

const PAGE_SIZE = 4;

interface DashboardAssetsSectionProps {
  summary?: CanvasSummary;
  isLoading?: boolean;
}

function AssetCard({ stats }: { stats: CurrencyDashboardStats }) {
  const { t } = useTranslation("dashboard");
  const netPositive = stats.netCashFlowThisMonth >= 0;

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="w-full rounded-xl border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Stack gap={3}>
                <Badge variant="outline" className="w-fit">
                  {stats.currencyCode}
                </Badge>
                <Stack gap={1}>
                  <Typography variant="muted-sm">{t("walletsBalance.totalBalance")}</Typography>
                  <Typography className={typographyVariants({ variant: "stat" })}>
                    {formatMoney(stats.totalBalance, stats.currencySymbol)}
                  </Typography>
                  {stats.walletCountWithCurrency > 0 ? (
                    <Typography variant="muted-sm">
                      {t("walletsBalance.inWallets", { count: stats.walletCountWithCurrency })}
                    </Typography>
                  ) : null}
                </Stack>
                <Typography
                  variant="muted-sm"
                  className={netPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}
                >
                  {formatMoney(stats.netCashFlowThisMonth, stats.currencySymbol)}{" "}
                  {t("walletsBalance.netThisMonth")}
                </Typography>
              </Stack>
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs !bg-popover !text-popover-foreground border p-3 shadow-md [&_[class*='rotate-45']]:!bg-popover [&_[class*='rotate-45']]:!fill-popover"
        >
          <CurrencyAssetDetail stats={stats} compact />
        </TooltipContent>
      </Tooltip>
      <PopoverContent align="start" className="w-auto">
        <CurrencyAssetDetail stats={stats} />
      </PopoverContent>
    </Popover>
  );
}

export function DashboardAssetsSection({
  summary,
  isLoading,
}: DashboardAssetsSectionProps) {
  const { t } = useTranslation("dashboard");
  const [page, setPage] = React.useState(0);
  const [showAll, setShowAll] = React.useState(false);

  const statsByCurrency = React.useMemo(
    () => (summary ? computeDashboardStatsByCurrency(summary) : []),
    [summary]
  );

  const totalPages = Math.max(1, Math.ceil(statsByCurrency.length / PAGE_SIZE));

  React.useEffect(() => {
    setPage(0);
    setShowAll(false);
  }, [summary]);

  React.useEffect(() => {
    if (page >= totalPages) {
      setPage(Math.max(0, totalPages - 1));
    }
  }, [page, totalPages]);

  const visibleStats = showAll
    ? statsByCurrency
    : statsByCurrency.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  if (isLoading) {
    return (
      <Container>
        <Stack gap={4}>
          <Skeleton className="h-6 w-40" />
          <Grid className="grid-cols-1 sm:grid-cols-2 xl:grid-cols-4" gap={4}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </Grid>
        </Stack>
      </Container>
    );
  }

  if (statsByCurrency.length === 0) {
    return (
      <Container>
        <Typography variant="muted-sm">{t("walletsBalance.empty")}</Typography>
      </Container>
    );
  }

  return (
    <Container>
      <TooltipProvider>
        <Stack gap={4}>
          <Stack
            direction="row"
            align="center"
            justify="between"
            gap={4}
            className="flex-wrap"
          >
            <Typography variant="title">{t("walletsBalance.title")}</Typography>
            <Stack direction="row" align="center" gap={2}>
              <Button variant="outline" size="sm" asChild>
                <Link href="/wallets">{t("walletsBalance.viewAll")}</Link>
              </Button>
              {!showAll && statsByCurrency.length > PAGE_SIZE && (
                <>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    aria-label={t("walletsBalance.previousPage")}
                  >
                    <IconChevronLeft className="size-4" />
                  </Button>
                  <Typography variant="muted-sm">
                    {t("walletsBalance.pageIndicator", {
                      current: page + 1,
                      total: totalPages,
                    })}
                  </Typography>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    aria-label={t("walletsBalance.nextPage")}
                  >
                    <IconChevronRight className="size-4" />
                  </Button>
                </>
              )}
              {statsByCurrency.length > PAGE_SIZE && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAll((value) => !value);
                    setPage(0);
                  }}
                >
                  {showAll ? t("walletsBalance.showLess") : t("walletsBalance.loadAll")}
                </Button>
              )}
            </Stack>
          </Stack>

          <Grid className="grid-cols-1 sm:grid-cols-2 xl:grid-cols-4" gap={4}>
            {visibleStats.map((stats) => (
              <AssetCard key={stats.currencyCode} stats={stats} />
            ))}
          </Grid>
        </Stack>
      </TooltipProvider>
    </Container>
  );
}
