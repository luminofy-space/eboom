"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import API_ROUTES from "@/src/api/urls";
import useQueryApi from "@/src/api/useQuery";
import { useAuthContext } from "@/src/components/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import { env } from "@/utils/env";
import { getApiErrorMessage } from "@/src/utils/formUtils";
import { SystemCurrencySelect } from "./SystemCurrencySelect";
import type { SavingsGoalListItem, SavingsGoalStatus } from "../types";

interface GoalFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canvasId: number;
  defaultCurrencyId?: number;
  editGoal?: SavingsGoalListItem | null;
  goalId?: number | null;
  canEdit?: boolean;
  extraInvalidateKeys?: string[][];
}

function toDateInputValue(date: string | null | undefined): string {
  if (!date) return "";
  return date.slice(0, 10);
}

function getSessionKey(editGoal?: SavingsGoalListItem | null, goalId?: number | null): number | "new" {
  return editGoal?.goal.id ?? goalId ?? "new";
}

export function GoalFormModal({
  open,
  onOpenChange,
  canvasId,
  defaultCurrencyId,
  editGoal,
  goalId,
  canEdit = true,
  extraInvalidateKeys = [],
}: GoalFormModalProps) {
  const { t } = useTranslation("budget-planning");
  const { accessToken } = useAuthContext();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [currencyId, setCurrencyId] = useState("");
  const [status, setStatus] = useState<SavingsGoalStatus>("active");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const initializedSession = useRef<number | "new" | null>(null);

  const { data: goalsRes, isLoading: goalsLoading } = useQueryApi<{
    goals?: SavingsGoalListItem[];
  }>(API_ROUTES.CANVAS_SAVINGS_GOALS_LIST(canvasId), {
    queryKey: ["savings-goals", canvasId],
    enabled: open && !!goalId && !editGoal,
  });

  const resolvedGoal =
    editGoal ?? goalsRes?.goals?.find((item) => item.goal.id === goalId) ?? null;
  const isEdit = !!resolvedGoal;

  useEffect(() => {
    if (open && !canEdit) onOpenChange(false);
  }, [open, canEdit, onOpenChange]);

  const { data: currenciesRes } = useQueryApi<{
    currencies?: { id: number }[];
  }>(API_ROUTES.CURRENCIES_METADATA, {
    queryKey: ["currencies"],
    hasToken: true,
    enabled: open,
  });

  const allCurrencies = currenciesRes?.currencies ?? [];

  useEffect(() => {
    if (!open) {
      initializedSession.current = null;
      setSubmitError(null);
      return;
    }

    if (goalId && !editGoal && goalsLoading) return;

    const sessionKey = getSessionKey(resolvedGoal, goalId);
    if (initializedSession.current === sessionKey) return;
    initializedSession.current = sessionKey;

    if (resolvedGoal) {
      setName(resolvedGoal.goal.name);
      setTargetAmount(String(resolvedGoal.goal.targetAmount));
      setTargetDate(toDateInputValue(resolvedGoal.goal.targetDate));
      setCurrencyId(String(resolvedGoal.goal.currencyId));
      setStatus(resolvedGoal.goal.status ?? resolvedGoal.progress?.status ?? "active");
    } else {
      setName("");
      setTargetAmount("");
      setTargetDate("");
      setCurrencyId(defaultCurrencyId ? String(defaultCurrencyId) : "");
      setStatus("active");
    }
  }, [open, resolvedGoal, goalId, editGoal, goalsLoading, defaultCurrencyId]);

  useEffect(() => {
    if (!open || isEdit || currencyId || allCurrencies.length === 0) return;
    const defaultId = defaultCurrencyId ?? allCurrencies[0]?.id;
    if (defaultId) setCurrencyId(String(defaultId));
  }, [open, isEdit, currencyId, allCurrencies, defaultCurrencyId]);

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["savings-goals", canvasId] });
    for (const key of extraInvalidateKeys) {
      queryClient.invalidateQueries({ queryKey: key });
    }
    queryClient.invalidateQueries({ queryKey: ["calendar"] });
  };

  const saveMutation = useMutation({
    mutationFn: async (nextStatus?: SavingsGoalStatus) => {
      if (!canEdit) throw new Error("Insufficient permissions");

      const payload = {
        name: name.trim(),
        targetAmount,
        targetDate: targetDate || null,
        currencyId: parseInt(currencyId, 10),
        ...(isEdit ? { status: nextStatus ?? status } : {}),
      };

      if (isEdit && resolvedGoal) {
        await axios.patch(
          `${env("NEXT_PUBLIC_BASE_URL")}${API_ROUTES.CANVAS_SAVINGS_GOALS_UPDATE(canvasId, resolvedGoal.goal.id)}`,
          payload,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
      } else {
        await axios.post(
          `${env("NEXT_PUBLIC_BASE_URL")}${API_ROUTES.CANVAS_SAVINGS_GOALS_CREATE(canvasId)}`,
          payload,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
      }
    },
    onSuccess: () => {
      invalidateQueries();
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      setSubmitError(getApiErrorMessage(err, t("saveError")));
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (nextStatus: SavingsGoalStatus) => {
      if (!canEdit || !resolvedGoal) throw new Error("Insufficient permissions");
      await axios.patch(
        `${env("NEXT_PUBLIC_BASE_URL")}${API_ROUTES.CANVAS_SAVINGS_GOALS_UPDATE(canvasId, resolvedGoal.goal.id)}`,
        { status: nextStatus },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
    },
    onSuccess: () => {
      invalidateQueries();
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      setSubmitError(getApiErrorMessage(err, t("saveError")));
    },
  });

  const canSubmit = canEdit && name.trim() && targetAmount && currencyId;
  const isPending = saveMutation.isPending || statusMutation.isPending;

  if (!canEdit) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("goals.editTitle") : t("goals.modalTitle")}</DialogTitle>
          <DialogDescription>{t("goals.shadowDisclaimer")}</DialogDescription>
        </DialogHeader>

        {goalId && !editGoal && goalsLoading ? (
          <Stack align="center" className="py-8">
            <Spinner />
          </Stack>
        ) : (
          <>
            <div className="space-y-4 py-2">
              <Field>
                <FieldLabel>{t("goals.name")}</FieldLabel>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="New laptop"
                />
              </Field>
              <Field>
                <FieldLabel>{t("goals.targetAmount")}</FieldLabel>
                <NumberInput
                  min={0}
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>{t("goals.currency")}</FieldLabel>
                <SystemCurrencySelect
                  value={currencyId}
                  onValueChange={setCurrencyId}
                  disabled={isEdit}
                />
              </Field>
              <Field>
                <FieldLabel>{t("goals.targetDate")}</FieldLabel>
                <Input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </Field>
              {isEdit && (
                <Field>
                  <FieldLabel>{t("goals.statusLabel")}</FieldLabel>
                  <Select
                    value={status}
                    onValueChange={(value) => setStatus(value as SavingsGoalStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t("goals.status.active")}</SelectItem>
                      <SelectItem value="achieved">{t("goals.status.achieved")}</SelectItem>
                      <SelectItem value="dropped">{t("goals.status.dropped")}</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}

              {submitError && (
                <Typography variant="muted-sm" className="text-destructive">
                  {submitError}
                </Typography>
              )}
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-col sm:items-stretch">
              {isEdit && (
                <div className="flex flex-wrap gap-2">
                  {status !== "achieved" && (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={isPending}
                      onClick={() => statusMutation.mutate("achieved")}
                    >
                      {t("goals.actions.markAchieved")}
                    </Button>
                  )}
                  {status !== "dropped" && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => statusMutation.mutate("dropped")}
                    >
                      {t("goals.actions.drop")}
                    </Button>
                  )}
                  {status !== "active" && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => statusMutation.mutate("active")}
                    >
                      {t("goals.actions.reactivate")}
                    </Button>
                  )}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  {t("actions.cancel")}
                </Button>
                <Button
                  disabled={!canSubmit || isPending}
                  onClick={() => {
                    setSubmitError(null);
                    saveMutation.mutate(undefined);
                  }}
                >
                  {isPending ? <Spinner className="size-4" /> : t("actions.save")}
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
