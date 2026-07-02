"use client";

import { PiggyBank } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";

interface BudgetSectionEmptyProps {
  onCreate: () => void;
  canEdit: boolean;
}

export function BudgetSectionEmpty({ onCreate, canEdit }: BudgetSectionEmptyProps) {
  const { t } = useTranslation("budget-planning");

  return (
    <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
      <Stack gap={4} align="center" className="mx-auto max-w-md">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <PiggyBank className="size-6 text-muted-foreground" />
        </div>
        <Stack gap={1} align="center">
          <Typography variant="heading">{t("empty.budgetTitle")}</Typography>
          <Typography variant="muted-sm">{t("empty.budgetDescription")}</Typography>
        </Stack>
        {canEdit && (
          <Button onClick={onCreate}>{t("empty.createBudget")}</Button>
        )}
      </Stack>
    </div>
  );
}
