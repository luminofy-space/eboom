"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMutationApi } from "@/src/api/useMutation";
import API_ROUTES from "@/src/api/urls";
import useQueryApi from "@/src/api/useQuery";
import { useQueryClient } from "@tanstack/react-query";
import { useCanvas } from "@/src/hooks/useCanvas";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { NumberInput } from "@/components/ui/number-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import { formatCurrency } from "@/src/i18n/formatters";
import { getApiErrorMessage } from "@/src/utils/formUtils";
import { SystemCurrencySelect } from "./SystemCurrencySelect";
import type {
  BudgetListItem,
  BudgetSuggestions,
} from "@/src/types/budget-planning";

interface ExpenseCategory {
  id: number;
  name: string;
}

interface CategoryLineDraft {
  key: string;
  categoryId: number | null;
  amount: string;
}

interface BudgetFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editBudget?: BudgetListItem | null;
  existingBudgets?: BudgetListItem[];
  defaultCurrencyId?: number;
  canEdit?: boolean;
}

const MONTHLY_PERIOD = "monthly" as const;

function getSessionKey(editBudget?: BudgetListItem | null): number | "new" {
  return editBudget?.budget.id ?? "new";
}

export function BudgetFormModal({
  open,
  onOpenChange,
  editBudget,
  existingBudgets = [],
  defaultCurrencyId,
  canEdit = true,
}: BudgetFormModalProps) {
  const { t } = useTranslation("budget-planning");
  const { canvas } = useCanvas();
  const queryClient = useQueryClient();
  const isEdit = !!editBudget;

  const [currencyId, setCurrencyId] = useState("");
  const [totalLimit, setTotalLimit] = useState("");
  const [alertThreshold, setAlertThreshold] = useState(80);
  const [lines, setLines] = useState<CategoryLineDraft[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const initializedSession = useRef<number | "new" | null>(null);

  useEffect(() => {
    if (open && !canEdit) onOpenChange(false);
  }, [open, canEdit, onOpenChange]);

  const { data: currenciesRes } = useQueryApi<{
    currencies?: { id: number; code: string }[];
  }>(API_ROUTES.CURRENCIES_METADATA, {
    queryKey: ["currencies"],
    hasToken: true,
    enabled: open,
  });

  const parsedCurrencyId = currencyId ? parseInt(currencyId, 10) : null;

  const suggestionsUrl =
    canvas && parsedCurrencyId
      ? `${API_ROUTES.CANVAS_BUDGETS_SUGGESTIONS(canvas)}?currencyId=${parsedCurrencyId}&periodType=${MONTHLY_PERIOD}`
      : "";

  const { data: suggestionsRes } = useQueryApi<{ suggestions?: BudgetSuggestions }>(
    suggestionsUrl,
    {
      queryKey: ["budget-suggestions", canvas, parsedCurrencyId, MONTHLY_PERIOD],
      enabled: !!canvas && parsedCurrencyId != null && open,
    }
  );

  const { data: categoriesRes } = useQueryApi<{ categories?: ExpenseCategory[] }>(
    API_ROUTES.EXPENSE_CATEGORIES,
    { queryKey: ["expense-categories"], enabled: open }
  );

  const allCategories = categoriesRes?.categories ?? [];
  const suggestions = suggestionsRes?.suggestions;

  const suggestionByCategoryId = useMemo(() => {
    const map = new Map<number, { rawAmount: string; categoryName: string }>();
    for (const c of suggestions?.categories ?? []) {
      map.set(c.categoryId, { rawAmount: c.rawAmount, categoryName: c.categoryName });
    }
    return map;
  }, [suggestions]);

  useEffect(() => {
    if (!open) {
      initializedSession.current = null;
      setSubmitError(null);
      return;
    }

    const sessionKey = getSessionKey(editBudget);
    if (initializedSession.current === sessionKey) return;
    initializedSession.current = sessionKey;

    if (editBudget) {
      setCurrencyId(String(editBudget.budget.currencyId));
      setTotalLimit(String(editBudget.budget.totalLimit));
      setAlertThreshold(editBudget.budget.alertThresholdPercent);
      setLines(
        editBudget.lines.map((line) => ({
          key: `line-${line.id}`,
          categoryId: line.expenseCategoryId,
          amount: String(line.amountLimit),
        }))
      );
    } else {
      setTotalLimit("");
      setAlertThreshold(80);
      setLines([]);
      setCurrencyId(defaultCurrencyId ? String(defaultCurrencyId) : "");
    }
  }, [open, editBudget, defaultCurrencyId]);

  const allCurrencies = currenciesRes?.currencies ?? [];

  useEffect(() => {
    if (!open || isEdit || currencyId || allCurrencies.length === 0) return;
    setCurrencyId(String(allCurrencies[0].id));
  }, [open, isEdit, currencyId, allCurrencies]);

  const usedCategoryIds = new Set(lines.map((l) => l.categoryId).filter(Boolean));
  const linesTotal = lines.reduce((sum, line) => sum + (parseFloat(line.amount) || 0), 0);
  const overAllocated = linesTotal > (parseFloat(totalLimit) || 0) && linesTotal > 0;

  const duplicateBudgetError = useMemo(() => {
    if (isEdit || parsedCurrencyId == null) return null;
    const exists = existingBudgets.some(
      (b) =>
        b.budget.periodType === MONTHLY_PERIOD && b.budget.currencyId === parsedCurrencyId
    );
    if (!exists) return null;
    return t("form.duplicateBudget");
  }, [isEdit, parsedCurrencyId, existingBudgets, t]);

  const addLine = () => {
    setLines((prev) => [...prev, { key: `new-${Date.now()}`, categoryId: null, amount: "" }]);
  };

  const removeLine = (key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
  };

  const updateLine = (key: string, patch: Partial<CategoryLineDraft>) => {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  };

  const fillTotalFromHistory = () => {
    if (suggestions?.suggestedTotal) {
      setTotalLimit(suggestions.suggestedTotal);
    }
  };

  const saveMutation = useMutationApi<void>(
    () =>
      isEdit && editBudget
        ? API_ROUTES.CANVAS_BUDGETS_UPDATE(canvas!, editBudget.budget.id)
        : API_ROUTES.CANVAS_BUDGETS_CREATE(canvas!),
    {
      method: () => (isEdit && editBudget ? "patch" : "post"),
      mapPayload: () => {
        if (!canvas || parsedCurrencyId == null) throw new Error("Missing canvas");
        return {
          currencyId: parsedCurrencyId,
          periodType: MONTHLY_PERIOD,
          totalLimit,
          alertThresholdPercent: alertThreshold,
          lines: lines
            .filter((l) => l.categoryId != null && parseFloat(l.amount) > 0)
            .map((l) => ({
              expenseCategoryId: l.categoryId,
              amountLimit: l.amount,
            })),
        };
      },
      invalidateQueries: false,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["budgets", canvas] });
        queryClient.invalidateQueries({ queryKey: ["budget-summary", canvas] });
        onOpenChange(false);
      },
      onError: (err: unknown) => {
        setSubmitError(getApiErrorMessage(err, t("saveError")));
      },
    }
  );

  if (!canEdit) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("form.editBudget") : t("form.createBudget")}</DialogTitle>
          <DialogDescription>{t("sections.budgetsDescription")}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto py-2">
          <Field data-invalid={!!duplicateBudgetError}>
            <FieldLabel>{t("form.currency")}</FieldLabel>
            <div className="w-44 sm:w-52">
              <SystemCurrencySelect
                value={currencyId}
                onValueChange={setCurrencyId}
                disabled={isEdit}
                className="h-11"
              />
            </div>
            {duplicateBudgetError && <FieldError>{duplicateBudgetError}</FieldError>}
          </Field>

          <Field>
            <div className="flex items-center justify-between gap-2">
              <FieldLabel>{t("labels.totalLimit")}</FieldLabel>
              {suggestions?.suggestedTotal && !isEdit && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={fillTotalFromHistory}
                >
                  {t("actions.fillFromHistory")}
                </Button>
              )}
            </div>
            <NumberInput
              min={0}
              value={totalLimit}
              onChange={(e) => setTotalLimit(e.target.value)}
            />
          </Field>

          <Field>
            <div className="flex items-center justify-between gap-2">
              <FieldLabel>{t("labels.alertThreshold")}</FieldLabel>
              <Typography variant="muted-sm">{alertThreshold}%</Typography>
            </div>
            <Slider
              min={1}
              max={100}
              step={1}
              value={alertThreshold}
              onValueChange={setAlertThreshold}
            />
          </Field>

          <div className="space-y-3">
            <FieldLabel>{t("labels.categoryLimit")}</FieldLabel>
            {lines.length === 0 && (
              <Typography variant="muted-sm">{t("actions.addCategoryLimit")}</Typography>
            )}
            {lines.map((line) => {
              const hint = line.categoryId
                ? suggestionByCategoryId.get(line.categoryId)
                : undefined;
              return (
                <div
                  key={line.key}
                  className="grid gap-2 rounded-lg border bg-muted/20 p-3 sm:grid-cols-[1fr_120px_auto]"
                >
                  <Select
                    value={line.categoryId != null ? String(line.categoryId) : ""}
                    onValueChange={(val) =>
                      updateLine(line.key, { categoryId: parseInt(val, 10) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("form.selectCategory")} />
                    </SelectTrigger>
                    <SelectContent>
                      {allCategories
                        .filter(
                          (c) =>
                            c.id === line.categoryId || !usedCategoryIds.has(c.id)
                        )
                        .map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <NumberInput
                    min={0}
                    placeholder="0"
                    value={line.amount}
                    onChange={(e) => updateLine(line.key, { amount: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLine(line.key)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                  {hint && (
                    <Typography variant="caption" className="col-span-full">
                      {t("labels.lastMonthHint", {
                        amount: formatCurrency(hint.rawAmount, undefined, { preset: "compact" }),
                      })}
                    </Typography>
                  )}
                </div>
              );
            })}
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              <Plus className="mr-1 size-4" />
              {t("actions.addCategoryLimit")}
            </Button>
            {overAllocated && (
              <Typography variant="muted-sm" className="text-amber-600 dark:text-amber-400">
                {t("form.overAllocatedWarning")}
              </Typography>
            )}
          </div>

          {submitError && (
            <Typography variant="muted-sm" className="text-destructive">
              {submitError}
            </Typography>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("actions.cancel")}
          </Button>
          <Button
            disabled={
              !totalLimit || saveMutation.isPending || !currencyId || !!duplicateBudgetError
            }
            onClick={() => {
              setSubmitError(null);
              saveMutation.mutate();
            }}
          >
            {saveMutation.isPending ? <Spinner className="size-4" /> : t("actions.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
