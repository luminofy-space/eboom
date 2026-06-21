"use client";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useDashboardSummary } from "./hooks/useDashboardSummary";
import { DashboardBreakdownCards } from "./components/DashboardBreakdownCards";
import { DashboardCashFlowChart } from "./components/DashboardCashFlowChart";
import { DashboardEmptyState } from "./components/DashboardEmptyState";
import { DashboardHeader } from "./components/DashboardHeader";
import { DashboardOverviewCards } from "./components/DashboardOverviewCards";
import { DashboardRecentActivity } from "./components/DashboardRecentActivity";
import { computeDashboardStatsByCurrency } from "./utils/dashboardStats";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export default function DashboardPage() {
  const { t } = useTranslation("dashboard");
  const { canvas, activeCanvas } = useCanvas();
  const { data: summary, isLoading, isError, refetch } = useDashboardSummary(canvas);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("");

  const statsByCurrency = useMemo(
    () => (summary ? computeDashboardStatsByCurrency(summary) : []),
    [summary]
  );

  const currencyCodes = useMemo(
    () => statsByCurrency.map((item) => item.currencyCode),
    [statsByCurrency]
  );

  useEffect(() => {
    if (currencyCodes.length === 0) return;
    if (!selectedCurrency || !currencyCodes.includes(selectedCurrency)) {
      setSelectedCurrency(currencyCodes[0]);
    }
  }, [currencyCodes, selectedCurrency]);

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
      <DashboardHeader
        canvas={activeCanvas}
        currencies={currencyCodes}
        selectedCurrency={selectedCurrency}
        onCurrencyChange={setSelectedCurrency}
      />

      <DashboardBreakdownCards
        summary={summary}
        currencyCode={selectedCurrency}
        isLoading={isLoading}
      />

      <Container>
        <DashboardCashFlowChart
          summary={summary}
          currencyCode={selectedCurrency}
          isLoading={isLoading}
        />
      </Container>

      <DashboardOverviewCards
        summary={summary}
        currencyCode={selectedCurrency}
        isLoading={isLoading}
      />

      <DashboardRecentActivity
        activities={summary?.recentActivity}
        isLoading={isLoading}
      />
    </Stack>
  );
}
