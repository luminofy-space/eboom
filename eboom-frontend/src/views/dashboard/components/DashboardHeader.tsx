"use client";

import { Container } from "@/components/ui/container";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import type { Canvas } from "@/src/types/common";
import type { CanvasSummaryTotalBalance } from "@/src/types/dashboard";
import { useTranslation } from "react-i18next";
import { DashboardTotalBalance } from "./DashboardTotalBalance";

interface DashboardHeaderProps {
  canvas: Canvas | null;
  totalBalance?: CanvasSummaryTotalBalance;
  isLoading?: boolean;
}

export function DashboardHeader({ canvas, totalBalance, isLoading = false }: DashboardHeaderProps) {
  const { t } = useTranslation("dashboard");

  return (
    <Container>
      <Stack
        direction="row"
        gap={4}
        align="start"
        justify="between"
        className="flex-wrap"
      >
        <Stack gap={2} className="min-w-0">
          <Typography variant="display">
            {canvas?.name ?? t("title")}
          </Typography>
          {canvas?.description && (
            <Typography variant="muted">{canvas.description}</Typography>
          )}
        </Stack>

        <DashboardTotalBalance totalBalance={totalBalance} isLoading={isLoading} />
      </Stack>
    </Container>
  );
}
