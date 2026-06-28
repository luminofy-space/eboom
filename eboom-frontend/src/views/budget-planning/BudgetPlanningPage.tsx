"use client";

import { useEffect, useMemo, useState } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import API_ROUTES from "@/src/api/urls";
import useQueryApi from "@/src/api/useQuery";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useCanvasPermissions } from "@/src/hooks/useCanvasPermissions";
import { useAuthContext } from "@/src/components/AuthProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Grid } from "@/components/ui/grid";
import { Stack } from "@/components/ui/stack";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmDeleteDialog } from "@/src/components/ConfirmDeleteDialog";
import { formatCurrency } from "@/src/i18n/formatters";
import { env } from "@/utils/env";
import { BudgetFormModal } from "./components/BudgetFormModal";
import { BudgetPeriodTabs } from "./components/BudgetPeriodTabs";
import { BudgetProgressBar } from "./components/BudgetProgressBar";
import { BudgetSectionEmpty } from "./components/BudgetSectionEmpty";
import { ForecastChart } from "./components/ForecastChart";
import { GoalCard } from "./components/GoalCard";
import { GoalFormModal } from "./components/GoalFormModal";
import { GoalsSectionEmpty } from "./components/GoalsSectionEmpty";
import { SystemCurrencySelect } from "./components/SystemCurrencySelect";
import type { BudgetListItem, BudgetPeriodType, SavingsGoalListItem, SavingsGoalProgress, SavingsGoalStatus } from "./types";

function addDaysIso(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function BudgetPlanningPage() {
  const { t } = useTranslation("budget-planning");
  const { t: tc } = useTranslation("common");
  const { canvas } = useCanvas();
  const { canEdit } = useCanvasPermissions();
  const { accessToken } = useAuthContext();
  const queryClient = useQueryClient();

  const [selectedPeriod, setSelectedPeriod] = useState<BudgetPeriodType>("monthly");
  const [selectedCurrencyId, setSelectedCurrencyId] = useState("");
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [editBudget, setEditBudget] = useState<BudgetListItem | null>(null);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<SavingsGoalListItem | null>(null);
  const [deleteBudgetId, setDeleteBudgetId] = useState<number | null>(null);
  const [goalStatusTab, setGoalStatusTab] = useState<SavingsGoalStatus>("active");

  const { data, isLoading, isError, refetch } = useQueryApi<{ budgets?: BudgetListItem[] }>(
    canvas ? API_ROUTES.CANVAS_BUDGETS_LIST(canvas) : "",
    { queryKey: ["budgets", canvas], enabled: !!canvas }
  );

  const { data: goalsRes, isLoading: goalsLoading } = useQueryApi<{
    goals?: SavingsGoalListItem[];
  }>(canvas ? API_ROUTES.CANVAS_SAVINGS_GOALS_LIST(canvas) : "", {
    queryKey: ["savings-goals", canvas],
    enabled: !!canvas,
  });

  const budgets = data?.budgets ?? [];
  const goals = goalsRes?.goals ?? [];
  const goalsByStatus = useMemo(
    () => ({
      active: goals.filter((item) => (item.goal.status ?? "active") === "active"),
      achieved: goals.filter((item) => (item.goal.status ?? "active") === "achieved"),
      dropped: goals.filter((item) => (item.goal.status ?? "active") === "dropped"),
    }),
    [goals]
  );
  const visibleGoals = goalsByStatus[goalStatusTab];

  const selectedCurrencyIdNum = selectedCurrencyId
    ? parseInt(selectedCurrencyId, 10)
    : null;

  useEffect(() => {
    if (budgets.length === 0 || selectedCurrencyId) return;
    const forPeriod = budgets.filter((b) => b.budget?.periodType === selectedPeriod);
    const pick = forPeriod[0] ?? budgets[0];
    if (pick) setSelectedCurrencyId(String(pick.budget.currencyId));
  }, [budgets, selectedPeriod, selectedCurrencyId]);

  const activeBudget = useMemo(() => {
    if (selectedCurrencyIdNum == null) return undefined;
    return budgets.find(
      (b) =>
        b.budget?.periodType === selectedPeriod &&
        b.budget.currencyId === selectedCurrencyIdNum
    );
  }, [budgets, selectedPeriod, selectedCurrencyIdNum]);

  const progress = activeBudget?.progress;
  const forecastCurrencyId = activeBudget?.budget?.currencyId;

  const forecastUrl =
    canvas && forecastCurrencyId
      ? `${API_ROUTES.CANVAS_BUDGETS_FORECAST(canvas)}?currencyId=${forecastCurrencyId}&startDate=${addDaysIso(0)}&endDate=${addDaysIso(30)}`
      : "";

  const { data: forecastRes, isLoading: forecastLoading } = useQueryApi<{
    forecast?: import("./types").CashFlowForecast;
  }>(forecastUrl, {
    queryKey: ["forecast", canvas, forecastCurrencyId],
    enabled: !!canvas && !!forecastCurrencyId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (budgetId: number) => {
      if (!canvas) return;
      await axios.delete(
        `${env("NEXT_PUBLIC_BASE_URL")}${API_ROUTES.CANVAS_BUDGETS_DELETE(canvas, budgetId)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets", canvas] });
      queryClient.invalidateQueries({ queryKey: ["budget-summary", canvas] });
      setDeleteBudgetId(null);
    },
  });

  const updateGoalStatusMutation = useMutation({
    mutationFn: async ({ goalId, status }: { goalId: number; status: SavingsGoalStatus }) => {
      if (!canvas) return;
      await axios.patch(
        `${env("NEXT_PUBLIC_BASE_URL")}${API_ROUTES.CANVAS_SAVINGS_GOALS_UPDATE(canvas, goalId)}`,
        { status },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings-goals", canvas] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
    },
  });

  const handleBudgetModalOpenChange = (open: boolean) => {
    setBudgetModalOpen(open);
    if (!open) setEditBudget(null);
  };

  const openCreateBudget = () => {
    setEditBudget(null);
    setBudgetModalOpen(true);
  };

  const openEditBudget = () => {
    if (activeBudget) {
      setEditBudget(activeBudget);
      setBudgetModalOpen(true);
    }
  };

  const openCreateGoal = () => {
    setEditGoal(null);
    setGoalModalOpen(true);
  };

  const handleGoalModalOpenChange = (open: boolean) => {
    setGoalModalOpen(open);
    if (!open) setEditGoal(null);
  };

  const openEditGoal = (item: SavingsGoalListItem) => {
    setEditGoal(item);
    setGoalModalOpen(true);
  };

  if (!canvas) return null;

  if (isError) {
    return (
      <Container>
        <Stack align="center" justify="center" className="h-96" gap={4}>
          <Typography variant="muted-sm">{t("loadError")}</Typography>
          <Button variant="outline" onClick={() => refetch()}>
            {t("retry")}
          </Button>
        </Stack>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container>
        <Stack align="center" justify="center" className="h-96">
          <Spinner />
        </Stack>
      </Container>
    );
  }

  return (
    <Container>
      <Stack gap={8} className="pb-10">
        <Stack gap={2}>
          <Typography variant="display">{t("title")}</Typography>
          <Typography variant="muted">{t("subtitle")}</Typography>
        </Stack>

        {/* Budgets section */}
        <Stack gap={4}>
          <Stack gap={1} className="sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Stack gap={1} className="sm:flex-row sm:items-center">
                <Typography variant="heading">{t("sections.budgets")}</Typography>
                {budgets.length > 0 && (
                  <Badge variant="secondary">{budgets.length}</Badge>
                )}
              </Stack>
              <Typography variant="muted-sm">{t("sections.budgetsDescription")}</Typography>
            </div>
            {canEdit && budgets.length > 0 && (
              <Button variant="outline" size="sm" onClick={openCreateBudget}>
                {t("empty.createBudget")}
              </Button>
            )}
          </Stack>

          {budgets.length === 0 ? (
            <BudgetSectionEmpty onCreate={openCreateBudget} canEdit={canEdit} />
          ) : (
            <Stack gap={4}>
              <div className="flex items-stretch gap-3">
                <div className="w-44 shrink-0 sm:w-52">
                  <SystemCurrencySelect
                    value={selectedCurrencyId}
                    onValueChange={setSelectedCurrencyId}
                    className="h-11"
                  />
                </div>
                <BudgetPeriodTabs
                  value={selectedPeriod}
                  onValueChange={setSelectedPeriod}
                />
              </div>

              {!activeBudget ? (
                <div className="rounded-xl border bg-card p-6 text-center shadow-sm">
                  <Typography variant="muted-sm" className="mb-3">
                    {t("empty.budgetDescription")}
                  </Typography>
                  {canEdit && (
                    <Button size="sm" onClick={openCreateBudget}>
                      {t("empty.createBudget")}
                    </Button>
                  )}
                </div>
              ) : (
                <Tabs defaultValue="overview">
                  <TabsList>
                    <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
                    <TabsTrigger value="categories">{t("tabs.categories")}</TabsTrigger>
                    <TabsTrigger value="forecast">{t("tabs.forecast")}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-4">
                    <Card className="rounded-xl shadow-sm">
                      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                        <CardTitle className="text-base">
                          {activeBudget.budget.name ??
                            `${t(`period.${activeBudget.budget.periodType}`)} · ${progress?.currencyCode}`}
                        </CardTitle>
                        {canEdit && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 shrink-0 text-muted-foreground"
                              >
                                <MoreVertical className="size-4" />
                                <span className="sr-only">{tc("actions.openMenu")}</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={openEditBudget}>
                                <Pencil className="size-4" />
                                {t("actions.editLimits")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setDeleteBudgetId(activeBudget.budget.id)}
                              >
                                <Trash2 className="size-4" />
                                {t("actions.deleteBudget")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-6">
                          {progress && (
                            <>
                              <BudgetProgressBar
                                percent={progress.totalPercent}
                                threshold={progress.alertThresholdPercent}
                                label={t("labels.limit")}
                              />
                              <div className="grid gap-4 sm:grid-cols-3">
                                <div>
                                  <Typography variant="muted-sm">{t("labels.spent")}</Typography>
                                  <Typography variant="stat" className="text-lg">
                                    {formatCurrency(
                                      progress.totalSpent,
                                      progress.currencySymbol,
                                      { preset: "compact" }
                                    )}
                                  </Typography>
                                </div>
                                <div>
                                  <Typography variant="muted-sm">{t("labels.left")}</Typography>
                                  <Typography variant="stat" className="text-lg">
                                    {formatCurrency(
                                      progress.totalRemaining,
                                      progress.currencySymbol,
                                      { preset: "compact" }
                                    )}
                                  </Typography>
                                </div>
                                <div>
                                  <Typography variant="muted-sm">{t("labels.limit")}</Typography>
                                  <Typography variant="stat" className="text-lg">
                                    {formatCurrency(
                                      progress.totalLimit,
                                      progress.currencySymbol,
                                      { preset: "compact" }
                                    )}
                                  </Typography>
                                </div>
                              </div>
                              <Typography variant="muted-sm">{t("labels.paidDateHint")}</Typography>
                              {progress.unscheduledPaymentCount > 0 && (
                                <Typography variant="muted-sm">
                                  {t("labels.scheduledNotCounted", {
                                    count: progress.unscheduledPaymentCount,
                                  })}
                                </Typography>
                              )}
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="categories" className="mt-4">
                      {progress?.lines.length === 0 ? (
                        <div className="rounded-xl border bg-card p-6 text-center shadow-sm">
                          <Typography variant="muted-sm" className="mb-3">
                            {t("actions.addCategoryLimit")}
                          </Typography>
                          {canEdit && (
                            <Button size="sm" variant="outline" onClick={openEditBudget}>
                              {t("actions.editLimits")}
                            </Button>
                          )}
                        </div>
                      ) : (
                        <Stack gap={3}>
                          {progress?.lines.map((line) => (
                            <div
                              key={line.lineId}
                              className="rounded-xl border bg-card p-4 shadow-sm"
                            >
                              <Stack gap={3}>
                                <Typography variant="label">{line.categoryName}</Typography>
                                <BudgetProgressBar
                                  percent={line.percent}
                                  threshold={line.alertThresholdPercent}
                                />
                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                  <span>
                                    {t("labels.spent")}:{" "}
                                    {formatCurrency(line.spent, undefined, { preset: "compact" })}
                                  </span>
                                  <span>
                                    {t("labels.left")}:{" "}
                                    {formatCurrency(line.remaining, undefined, {
                                      preset: "compact",
                                    })}
                                  </span>
                                  <span>
                                    {t("labels.limit")}:{" "}
                                    {formatCurrency(line.limit, undefined, { preset: "compact" })}
                                  </span>
                                </div>
                              </Stack>
                            </div>
                          ))}
                        </Stack>
                      )}
                    </TabsContent>

                    <TabsContent value="forecast" className="mt-4">
                      <ForecastChart
                        forecast={forecastRes?.forecast}
                        isLoading={forecastLoading}
                      />
                    </TabsContent>
                  </Tabs>
              )}
            </Stack>
          )}
        </Stack>

        {/* Goals section */}
        <Stack gap={4}>
          <Stack gap={1} className="sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Stack gap={1} className="sm:flex-row sm:items-center">
                <Typography variant="heading">{t("sections.goals")}</Typography>
                {goalsByStatus.active.length > 0 && (
                  <Badge variant="secondary">{goalsByStatus.active.length}</Badge>
                )}
              </Stack>
              <Typography variant="muted-sm">{t("sections.goalsDescription")}</Typography>
            </div>
            {canEdit && goalsByStatus.active.length > 0 && (
              <Button variant="outline" size="sm" onClick={openCreateGoal}>
                {t("empty.addGoal")}
              </Button>
            )}
          </Stack>

          {goalsLoading ? (
            <Spinner className="mx-auto" />
          ) : goals.length === 0 ? (
            <GoalsSectionEmpty onCreate={openCreateGoal} canEdit={canEdit} />
          ) : (
            <Stack gap={4}>
              <Tabs
                value={goalStatusTab}
                onValueChange={(value) => setGoalStatusTab(value as SavingsGoalStatus)}
              >
                <TabsList>
                  <TabsTrigger value="active">
                    {t("goals.tabs.active")}
                    {goalsByStatus.active.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {goalsByStatus.active.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="achieved">
                    {t("goals.tabs.achieved")}
                    {goalsByStatus.achieved.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {goalsByStatus.achieved.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="dropped">
                    {t("goals.tabs.dropped")}
                    {goalsByStatus.dropped.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {goalsByStatus.dropped.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {visibleGoals.length === 0 ? (
                <GoalsSectionEmpty
                  canEdit={canEdit && goalStatusTab === "active"}
                  onCreate={goalStatusTab === "active" ? openCreateGoal : undefined}
                  title={t(`goals.empty.${goalStatusTab}Title`)}
                  message={t(`goals.empty.${goalStatusTab}Description`)}
                />
              ) : (
                <Grid variant="cards" gap={4}>
                  {visibleGoals.map((item) =>
                    item.progress ? (
                      <GoalCard
                        key={item.goal.id}
                        progress={item.progress}
                        canEdit={canEdit}
                        onEdit={() => openEditGoal(item)}
                        onStatusChange={(status) =>
                          updateGoalStatusMutation.mutate({ goalId: item.goal.id, status })
                        }
                      />
                    ) : null
                  )}
                </Grid>
              )}
            </Stack>
          )}
        </Stack>
      </Stack>

      <BudgetFormModal
        open={budgetModalOpen}
        onOpenChange={handleBudgetModalOpenChange}
        editBudget={editBudget}
        existingBudgets={budgets}
        defaultPeriodType={selectedPeriod}
        defaultCurrencyId={selectedCurrencyIdNum ?? undefined}
        canEdit={canEdit}
      />

      <GoalFormModal
        open={goalModalOpen}
        onOpenChange={handleGoalModalOpenChange}
        canvasId={canvas}
        defaultCurrencyId={forecastCurrencyId}
        editGoal={editGoal}
        canEdit={canEdit}
      />

      <ConfirmDeleteDialog
        open={deleteBudgetId != null}
        onOpenChange={(open) => !open && setDeleteBudgetId(null)}
        onConfirm={() => deleteBudgetId != null && deleteMutation.mutate(deleteBudgetId)}
        isDeleting={deleteMutation.isPending}
        title={t("deleteConfirm.budgetTitle")}
        description={t("deleteConfirm.budgetDescription")}
      />
    </Container>
  );
}
