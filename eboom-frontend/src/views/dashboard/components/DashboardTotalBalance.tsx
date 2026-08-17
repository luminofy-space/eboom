"use client";

import { IconAlertTriangle } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
import type { CanvasSummaryTotalBalance } from "@/src/types/dashboard";
import { useTranslation } from "react-i18next";

interface DashboardTotalBalanceProps {
  totalBalance: CanvasSummaryTotalBalance | undefined;
  isLoading: boolean;
}

export function DashboardTotalBalance({
  totalBalance,
  isLoading,
}: DashboardTotalBalanceProps) {
  const { t } = useTranslation("dashboard");

  if (isLoading) {
    return (
      <Card className="w-full gap-2 px-5 py-4 sm:w-72">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-40" />
      </Card>
    );
  }

  if (!totalBalance?.currencyCode || totalBalance.amount === null) {
    return (
      <Card className="w-full gap-1 px-5 py-4 sm:w-72">
        <Typography variant="muted-sm">{t("totalBalance.title")}</Typography>
        <Typography variant="muted-sm">{t("totalBalance.noBaseCurrency")}</Typography>
      </Card>
    );
  }

  const hasUnconverted = totalBalance.unconvertedCurrencyCodes.length > 0;

  return (
    <TooltipProvider>
      <Card className="w-full gap-1 px-5 py-4 sm:w-72">
        <Stack direction="row" align="center" justify="between" gap={2}>
          <Typography variant="muted-sm">{t("totalBalance.title")}</Typography>
          <Badge variant="outline">{totalBalance.currencyCode}</Badge>
        </Stack>

        <Stack direction="row" align="center" gap={2}>
          <Typography className={typographyVariants({ variant: "stat" })}>
            {formatMoney(totalBalance.amount, totalBalance.currencySymbol ?? undefined)}
          </Typography>

          {hasUnconverted && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-amber-600 dark:text-amber-400" aria-hidden="false">
                  <IconAlertTriangle className="size-4" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <Typography variant="caption" className="text-inherit">
                  {t("totalBalance.missingRates", {
                    currencies: totalBalance.unconvertedCurrencyCodes.join(", "),
                  })}
                </Typography>
              </TooltipContent>
            </Tooltip>
          )}
        </Stack>
      </Card>
    </TooltipProvider>
  );
}
