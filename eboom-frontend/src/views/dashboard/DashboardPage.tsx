"use client";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useDashboardSummary } from "./hooks/useDashboardSummary";
import { DashboardAssetsSection } from "./components/DashboardAssetsSection";
import { DashboardCashFlowChart } from "./components/DashboardCashFlowChart";
import { DashboardEmptyState } from "./components/DashboardEmptyState";
import { DashboardHeader } from "./components/DashboardHeader";
import { DashboardRecentActivity } from "./components/DashboardRecentActivity";
import { DashboardYearlyHeatmap } from "./components/DashboardYearlyHeatmap";
import { useTranslation } from "react-i18next";

export default function DashboardPage() {
  const { t } = useTranslation("dashboard");
  const { canvas, activeCanvas } = useCanvas();
  const { data: summary, isLoading, isError, refetch } = useDashboardSummary(canvas);

  if (!canvas) {
    return <DashboardEmptyState />;
  }

  if (isError) {
    return (
      <Container>
        <Stack className="h-96" align="center" justify="center" gap={4}>
          <Typography variant="muted-sm">{t("loadError")}</Typography>
          <Button variant="outline" onClick={() => refetch()}>
            {t("retry")}
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Stack gap={6} className="pb-8">
      <DashboardHeader canvas={activeCanvas} />

      <DashboardAssetsSection summary={summary} isLoading={isLoading} />

      <Container>
        <DashboardCashFlowChart summary={summary} isLoading={isLoading} />
      </Container>

      <Container>
        <DashboardYearlyHeatmap summary={summary} isLoading={isLoading} />
      </Container>

      <DashboardRecentActivity
        activities={summary?.recentActivity}
        isLoading={isLoading}
      />
    </Stack>
  );
}
