"use client";

import { Target } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";

interface GoalsSectionEmptyProps {
  onCreate: () => void;
  canEdit: boolean;
}

export function GoalsSectionEmpty({ onCreate, canEdit }: GoalsSectionEmptyProps) {
  const { t } = useTranslation("budget-planning");

  return (
    <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
      <Stack gap={4} align="center" className="mx-auto max-w-md">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Target className="size-6 text-muted-foreground" />
        </div>
        <Stack gap={1} align="center">
          <Typography variant="heading">{t("empty.goalsTitle")}</Typography>
          <Typography variant="muted-sm">{t("empty.goalsDescription")}</Typography>
        </Stack>
        {canEdit && <Button onClick={onCreate}>{t("empty.addGoal")}</Button>}
      </Stack>
    </div>
  );
}
