"use client";

import { Container } from "@/components/ui/container";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import type { Canvas } from "@/src/types/common";
import { useTranslation } from "react-i18next";

interface DashboardHeaderProps {
  canvas: Canvas | null;
}

export function DashboardHeader({ canvas }: DashboardHeaderProps) {
  const { t } = useTranslation("dashboard");

  return (
    <Container>
      <Stack gap={2} className="min-w-0">
        <Typography variant="display">
          {canvas?.name ?? t("title")}
        </Typography>
        {canvas?.description && (
          <Typography variant="muted">{canvas.description}</Typography>
        )}
      </Stack>
    </Container>
  );
}
