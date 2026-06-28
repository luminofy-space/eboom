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
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import { env } from "@/utils/env";
import { getApiErrorMessage } from "@/src/utils/formUtils";
import { SystemCurrencySelect } from "./SystemCurrencySelect";
import type { SavingsGoalListItem } from "../types";

interface GoalFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canvasId: number;
  defaultCurrencyId?: number;
  editGoal?: SavingsGoalListItem | null;
  canEdit?: boolean;
}

function toDateInputValue(date: string | null | undefined): string {
  if (!date) return "";
  return date.slice(0, 10);
}

function getSessionKey(editGoal?: SavingsGoalListItem | null): number | "new" {
  return editGoal?.goal.id ?? "new";
}

export function GoalFormModal({
  open,
  onOpenChange,
  canvasId,
  defaultCurrencyId,
  editGoal,
  canEdit = true,
}: GoalFormModalProps) {
  const { t } = useTranslation("budget-planning");
  const { accessToken } = useAuthContext();
  const queryClient = useQueryClient();
  const isEdit = !!editGoal;

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [currencyId, setCurrencyId] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const initializedSession = useRef<number | "new" | null>(null);

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

    const sessionKey = getSessionKey(editGoal);
    if (initializedSession.current === sessionKey) return;
    initializedSession.current = sessionKey;

    if (editGoal) {
      setName(editGoal.goal.name);
      setTargetAmount(String(editGoal.goal.targetAmount));
      setTargetDate(toDateInputValue(editGoal.goal.targetDate));
      setCurrencyId(String(editGoal.goal.currencyId));
    } else {
      setName("");
      setTargetAmount("");
      setTargetDate("");
      setCurrencyId(defaultCurrencyId ? String(defaultCurrencyId) : "");
    }
  }, [open, editGoal, defaultCurrencyId]);

  useEffect(() => {
    if (!open || isEdit || currencyId || allCurrencies.length === 0) return;
    const defaultId = defaultCurrencyId ?? allCurrencies[0]?.id;
    if (defaultId) setCurrencyId(String(defaultId));
  }, [open, isEdit, currencyId, allCurrencies, defaultCurrencyId]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!canEdit) throw new Error("Insufficient permissions");

      const payload = {
        name: name.trim(),
        targetAmount,
        targetDate: targetDate || null,
        currencyId: parseInt(currencyId, 10),
      };

      if (isEdit && editGoal) {
        await axios.patch(
          `${env("NEXT_PUBLIC_BASE_URL")}${API_ROUTES.CANVAS_SAVINGS_GOALS_UPDATE(canvasId, editGoal.goal.id)}`,
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
      queryClient.invalidateQueries({ queryKey: ["savings-goals", canvasId] });
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      setSubmitError(getApiErrorMessage(err, t("saveError")));
    },
  });

  const canSubmit = canEdit && name.trim() && targetAmount && currencyId;

  if (!canEdit) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("goals.editTitle") : t("goals.modalTitle")}</DialogTitle>
          <DialogDescription>{t("goals.shadowDisclaimer")}</DialogDescription>
        </DialogHeader>

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
            <Input
              type="number"
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
            <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </Field>

          {submitError && (
            <Typography variant="muted-sm" className="text-destructive">
              {submitError}
            </Typography>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("actions.cancel")}
          </Button>
          <Button
            disabled={!canSubmit || saveMutation.isPending}
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
