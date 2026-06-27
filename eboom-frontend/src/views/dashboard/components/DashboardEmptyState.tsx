"use client";

import { Container } from "@/components/ui/container";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import { useTranslation } from "react-i18next";

export function DashboardEmptyState() {
  const { t } = useTranslation("dashboard");

  return (
    <Container>
      <Stack className="h-96" align="center" justify="center">
        <Typography variant="title">{t("empty.noCanvasTitle")}</Typography>
        <Typography variant="muted-sm">{t("empty.noCanvasDescription")}</Typography>
      </Stack>
    </Container>
  );
}
