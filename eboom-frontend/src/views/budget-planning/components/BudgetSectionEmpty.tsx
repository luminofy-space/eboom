"use client";

import { PiggyBank } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";

interface BudgetSectionEmptyProps {
  onCreate: () => void;
  canEdit: boolean;
  currencyCode?: string;
}

export function BudgetSectionEmpty({ onCreate, canEdit, currencyCode }: BudgetSectionEmptyProps) {
  const { t } = useTranslation("budget-planning");

  const title = currencyCode ? t("empty.budgetForCurrency", { currency: currencyCode }) : t("empty.budgetTitle");
  const description = currencyCode ? undefined : t("empty.budgetDescription");
  const ctaLabel = currencyCode
    ? t("empty.createBudgetForCurrency", { currency: currencyCode })
    : t("empty.createBudget");

  return (
    <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
      <Stack gap={4} align="center" className="mx-auto max-w-md">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <PiggyBank className="size-6 text-muted-foreground" />
        </div>
        <Stack gap={1} align="center">
          <Typography variant="heading">{title}</Typography>
          {description && (
            <Typography variant="muted-sm">{description}</Typography>
          )}
        </Stack>
        {canEdit && (
          <Button onClick={onCreate}>{ctaLabel}</Button>
        )}
      </Stack>
    </div>
  );
}
