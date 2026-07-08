"use client";

import { useEffect, useMemo, useState } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMutationApi } from "@/src/api/useMutation";
import API_ROUTES from "@/src/api/urls";
import useQueryApi from "@/src/api/useQuery";
import { useQueryClient } from "@tanstack/react-query";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useCanvasPermissions } from "@/src/hooks/useCanvasPermissions";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmDeleteDialog } from "@/src/components/ConfirmDeleteDialog";
import { formatCurrency } from "@/src/i18n/formatters";
import { BudgetFormModal } from "./components/BudgetFormModal";
import { BudgetProgressBar } from "./components/BudgetProgressBar";
import { BudgetSectionEmpty } from "./components/BudgetSectionEmpty";
import { GoalCard } from "./components/GoalCard";
import { GoalFormModal } from "./components/GoalFormModal";
import { GoalsSectionEmpty } from "./components/GoalsSectionEmpty";
import { SystemCurrencySelect } from "./components/SystemCurrencySelect";
import type { BudgetListItem, SavingsGoalListItem, SavingsGoalStatus } from "@/src/types/budget-planning";

const MONTHLY_PERIOD = "monthly" as const;

export default function BudgetPlanningPage() {
  const { t } = useTranslation("budget-planning");
  const { t: tc } = useTranslation("common");
  const { canvas } = useCanvas();
  const { canEdit } = useCanvasPermissions();
  const queryClient = useQueryClient();

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

  const { data: currenciesRes } = useQueryApi<{
    currencies?: { id: number; code: string }[];
  }>(API_ROUTES.CURRENCIES_METADATA, {
    queryKey: ["currencies"],
    hasToken: true,
  });

  const { data: goalsRes, isLoading: goalsLoading } = useQueryApi<{
    goals?: SavingsGoalListItem[];
  }>(canvas ? API_ROUTES.CANVAS_SAVINGS_GOALS_LIST(canvas) : "", {
    queryKey: ["savings-goals", canvas],
    enabled: !!canvas,
  });

  const budgets = data?.budgets ?? [];
  const monthlyBudgets = useMemo(
    () => budgets.filter((b) => b.budget?.periodType === MONTHLY_PERIOD),
    [budgets]
  );
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

  const currencies = currenciesRes?.currencies ?? [];
  const selectedCurrencyIdNum = selectedCurrencyId
    ? parseInt(selectedCurrencyId, 10)
    : null;

  const selectedCurrencyCode = useMemo(() => {
    if (selectedCurrencyIdNum == null) return undefined;
    return currencies.find((c) => c.id === selectedCurrencyIdNum)?.code;
  }, [currencies, selectedCurrencyIdNum]);

  useEffect(() => {
    if (selectedCurrencyId) return;
    const firstBudget = monthlyBudgets[0];
    if (firstBudget) {
      setSelectedCurrencyId(String(firstBudget.budget.currencyId));
    } else if (currencies[0]) {
      setSelectedCurrencyId(String(currencies[0].id));
    }
  }, [monthlyBudgets, currencies, selectedCurrencyId]);

  const activeBudget = useMemo(() => {
    if (selectedCurrencyIdNum == null) return undefined;
    return monthlyBudgets.find((b) => b.budget.currencyId === selectedCurrencyIdNum);
  }, [monthlyBudgets, selectedCurrencyIdNum]);

  const progress = activeBudget?.progress;
  const hasAnyMonthlyBudget = monthlyBudgets.length > 0;

  const deleteMutation = useMutationApi(
    (budgetId: number) => API_ROUTES.CANVAS_BUDGETS_DELETE(canvas!, budgetId),
    {
      method: "delete",
      invalidateQueries: false,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["budgets", canvas] });
        queryClient.invalidateQueries({ queryKey: ["budget-summary", canvas] });
        setDeleteBudgetId(null);
      },
    }
  );

  const updateGoalStatusMutation = useMutationApi(
    ({ goalId }: { goalId: number; status: SavingsGoalStatus }) =>
      API_ROUTES.CANVAS_SAVINGS_GOALS_UPDATE(canvas!, goalId),
    {
      method: "patch",
      mapPayload: ({ status }: { goalId: number; status: SavingsGoalStatus }) => ({ status }),
      invalidateQueries: false,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["savings-goals", canvas] });
        queryClient.invalidateQueries({ queryKey: ["calendar"] });
      },
    }
  );

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
        <Stack direction="row" justify="between" align="start" className="gap-4">
          <Stack gap={2} className="min-w-0">
            <Typography variant="display">{t("title")}</Typography>
            <Typography variant="muted">{t("subtitle")}</Typography>
          </Stack>
          <div className="w-44 shrink-0 sm:w-52">
            <SystemCurrencySelect
              value={selectedCurrencyId}
              onValueChange={setSelectedCurrencyId}
              className="h-11"
            />
          </div>
        </Stack>

        {/* Budgets section */}
        <Stack gap={4}>
          <Stack gap={1} className="sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Stack gap={1} className="sm:flex-row sm:items-center">
                <Typography variant="heading">{t("sections.budgets")}</Typography>
                {hasAnyMonthlyBudget && (
                  <Badge variant="secondary">{monthlyBudgets.length}</Badge>
                )}
              </Stack>
              <Typography variant="muted-sm">{t("sections.budgetsDescription")}</Typography>
            </div>
            {canEdit && hasAnyMonthlyBudget && (
              <Button size="sm" onClick={openCreateBudget}>
                {t("empty.createBudget")}
              </Button>
            )}
          </Stack>

          {!hasAnyMonthlyBudget ? (
            <BudgetSectionEmpty onCreate={openCreateBudget} canEdit={canEdit} />
          ) : !activeBudget ? (
            <BudgetSectionEmpty
              onCreate={openCreateBudget}
              canEdit={canEdit}
              currencyCode={selectedCurrencyCode}
            />
          ) : (
            <Stack gap={4}>
              <Card className="rounded-xl shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                  <CardTitle className="text-base">
                    {activeBudget.budget.name ??
                      `${t(`period.${MONTHLY_PERIOD}`)} · ${progress?.currencyCode}`}
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

              {progress && (
                <Stack gap={3}>
                  {progress.lines.length > 0 && (
                    <Typography variant="label">{t("labels.categoryBudgets")}</Typography>
                  )}
                  {progress.lines.length === 0 ? (
                    <div className="rounded-xl border bg-card p-6 text-center shadow-sm">
                      <Typography variant="muted-sm" className="mb-3">
                        {t("actions.addCategoryLimit")}
                      </Typography>
                      {canEdit && (
                        <Button size="sm" onClick={openEditBudget}>
                          {t("actions.addCategoryLimit")}
                        </Button>
                      )}
                    </div>
                  ) : (
                    progress.lines.map((line) => (
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
                    ))
                  )}
                </Stack>
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
              <Button size="sm" onClick={openCreateGoal}>
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
        existingBudgets={monthlyBudgets}
        defaultCurrencyId={selectedCurrencyIdNum ?? undefined}
        canEdit={canEdit}
      />

      <GoalFormModal
        open={goalModalOpen}
        onOpenChange={handleGoalModalOpenChange}
        canvasId={canvas}
        defaultCurrencyId={selectedCurrencyIdNum ?? undefined}
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
