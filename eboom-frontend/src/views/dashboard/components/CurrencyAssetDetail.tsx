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
        label={t("walletsBalance.tooltip.wallets")}
        value={t("walletsBalance.inWallets", { count: stats.walletCountWithCurrency })}
      />
      <DetailRow
        label={t("walletsBalance.tooltip.incomes")}
        value={String(stats.entityCounts.incomes)}
      />
      <DetailRow
        label={t("walletsBalance.tooltip.expenses")}
        value={String(stats.entityCounts.expenses)}
      />
      {stats.entityCounts.assets > 0 && (
        <>
          <DetailRow
            label={t("walletsBalance.tooltip.assets")}
            value={String(stats.entityCounts.assets)}
          />
          <DetailRow
            label={t("walletsBalance.tooltip.assetsValue")}
            value={formatMoney(stats.totalAssetValue, currencySymbol)}
          />
        </>
      )}
      <DetailRow
        label={t("walletsBalance.tooltip.received")}
        value={formatMoney(stats.incomeStats.totalReceived, currencySymbol)}
      />
      <DetailRow
        label={t("walletsBalance.tooltip.pending")}
        value={formatMoney(stats.incomeStats.totalPending, currencySymbol)}
      />
      <DetailRow
        label={t("walletsBalance.tooltip.paid")}
        value={formatMoney(stats.expenseStats.totalPaid, currencySymbol)}
      />
      <DetailRow
        label={t("walletsBalance.tooltip.unpaid")}
        value={formatMoney(stats.expenseStats.totalUnpaid, currencySymbol)}
      />
      <DetailRow
        label={t("walletsBalance.tooltip.netCashFlow")}
        value={formatMoney(stats.netCashFlowThisMonth, currencySymbol)}
      />
    </Stack>
  );
}
