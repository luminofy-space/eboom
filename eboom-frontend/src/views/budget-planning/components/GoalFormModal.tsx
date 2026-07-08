"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutationApi } from "@/src/api/useMutation";
import API_ROUTES from "@/src/api/urls";
import useQueryApi from "@/src/api/useQuery";
import { useQueryClient } from "@tanstack/react-query";
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
import { fileToDataUrl, getApiErrorMessage, validateOptionalImage } from "@/src/utils/formUtils";
import { SystemCurrencySelect } from "./SystemCurrencySelect";
import type { SavingsGoalListItem, SavingsGoalStatus } from "@/src/types/budget-planning";

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
  const { t: tv } = useTranslation("validation");
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [currencyId, setCurrencyId] = useState("");
  const [status, setStatus] = useState<SavingsGoalStatus>("active");
  const [photo, setPhoto] = useState<File | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
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
      setPhotoError(null);
      setPhoto(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
      setExistingPhotoUrl(
        resolvedGoal.goal.photoUrl ?? resolvedGoal.progress?.photoUrl ?? null
      );
      setPhoto(null);
    } else {
      setName("");
      setTargetAmount("");
      setTargetDate("");
      setCurrencyId(defaultCurrencyId ? String(defaultCurrencyId) : "");
      setStatus("active");
      setExistingPhotoUrl(null);
      setPhoto(null);
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

  const saveMutation = useMutationApi<{ photoUrl?: string | null }>(
    () =>
      isEdit && resolvedGoal
        ? API_ROUTES.CANVAS_SAVINGS_GOALS_UPDATE(canvasId, resolvedGoal.goal.id)
        : API_ROUTES.CANVAS_SAVINGS_GOALS_CREATE(canvasId),
    {
      method: () => (isEdit && resolvedGoal ? "patch" : "post"),
      mapPayload: ({ photoUrl }) => ({
        name: name.trim(),
        targetAmount,
        targetDate: targetDate || null,
        currencyId: parseInt(currencyId, 10),
        ...(photoUrl !== undefined ? { photoUrl } : {}),
        ...(isEdit ? { status } : {}),
      }),
      invalidateQueries: false,
      onSuccess: () => {
        invalidateQueries();
        onOpenChange(false);
      },
      onError: (err: unknown) => {
        setSubmitError(getApiErrorMessage(err, t("saveError")));
      },
    }
  );

  const handlePhotoChange = (file: File | null) => {
    if (!file) {
      setPhoto(null);
      setPhotoError(null);
      return;
    }

    const validationError = validateOptionalImage(file, {
      invalidType: tv("imageInvalidType"),
      tooLarge: tv("imageTooLarge"),
    });

    if (validationError !== true) {
      setPhoto(null);
      setPhotoError(validationError);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setPhoto(file);
    setPhotoError(null);
  };

  const handleSave = async () => {
    setSubmitError(null);

    let photoUrl: string | null | undefined;
    if (photo) {
      photoUrl = await fileToDataUrl(photo);
    } else if (!isEdit) {
      photoUrl = null;
    }

    saveMutation.mutate({ photoUrl });
  };

  const photoPreviewUrl = photo ? URL.createObjectURL(photo) : existingPhotoUrl;
  const canSubmit = canEdit && name.trim() && targetAmount && currencyId && !photoError;
  const isPending = saveMutation.isPending;

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
              <Field data-invalid={!!photoError}>
                <FieldLabel htmlFor="goal-photo">{t("goals.photo")}</FieldLabel>
                <Input
                  ref={fileInputRef}
                  id="goal-photo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
                />
                {photoError && <FieldError>{photoError}</FieldError>}
                {photoPreviewUrl && (
                  <div className="mt-2 overflow-hidden rounded-lg border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoPreviewUrl}
                      alt=""
                      className="aspect-video w-full object-cover"
                    />
                  </div>
                )}
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

            <DialogFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t("actions.cancel")}
              </Button>
              <Button
                disabled={!canSubmit || isPending}
                onClick={handleSave}
              >
                {isPending ? <Spinner className="size-4" /> : t("actions.save")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
