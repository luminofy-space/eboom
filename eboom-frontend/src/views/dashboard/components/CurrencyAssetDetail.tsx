"use client";

import { Badge } from "@/components/ui/badge";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import { formatMoney } from "@/src/i18n/formatters";
import type { CurrencyDashboardStats } from "../utils/dashboardStats";
import { useTranslation } from "react-i18next";

interface CurrencyAssetDetailProps {
  stats: CurrencyDashboardStats;
  compact?: boolean;
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Stack direction="row" justify="between" gap={4} className="text-sm">
      <Typography variant="muted-sm">{label}</Typography>
      <Typography variant="label" className="tabular-nums">
        {value}
      </Typography>
    </Stack>
  );
}

export function CurrencyAssetDetail({ stats, compact }: CurrencyAssetDetailProps) {
  const { t } = useTranslation("dashboard");
  const { currencySymbol } = stats;

  return (
    <Stack gap={compact ? 2 : 3} className="min-w-[220px]">
      <Stack direction="row" align="center" gap={2}>
        <Badge variant="outline">{stats.currencyCode}</Badge>
        {!compact && (
          <Typography variant="label">
            {formatMoney(stats.totalBalance, currencySymbol)}
          </Typography>
        )}
      </Stack>

      <DetailRow
        label={t("assets.tooltip.wallets")}
        value={String(stats.entityCounts.wallets)}
      />
      <DetailRow
        label={t("assets.tooltip.incomes")}
        value={String(stats.entityCounts.incomes)}
      />
      <DetailRow
        label={t("assets.tooltip.expenses")}
        value={String(stats.entityCounts.expenses)}
      />
      <DetailRow
        label={t("assets.tooltip.received")}
        value={formatMoney(stats.incomeStats.totalReceived, currencySymbol)}
      />
      <DetailRow
        label={t("assets.tooltip.pending")}
        value={formatMoney(stats.incomeStats.totalPending, currencySymbol)}
      />
      <DetailRow
        label={t("assets.tooltip.paid")}
        value={formatMoney(stats.expenseStats.totalPaid, currencySymbol)}
      />
      <DetailRow
        label={t("assets.tooltip.unpaid")}
        value={formatMoney(stats.expenseStats.totalUnpaid, currencySymbol)}
      />
      <DetailRow
        label={t("assets.tooltip.netCashFlow")}
        value={formatMoney(stats.netCashFlowThisMonth, currencySymbol)}
      />
    </Stack>
  );
}
