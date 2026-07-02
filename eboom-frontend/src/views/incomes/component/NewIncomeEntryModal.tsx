"use client";

import { Button } from "@/components/ui/button";
import { Combobox, ComboboxCollection, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem } from "@/components/ui/combobox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Stack } from "@/components/ui/stack";
import { Textarea } from "@/components/ui/textarea";
import { FormSubmitError } from "@/src/components/FormSubmitError";
import API_ROUTES from "@/src/api/urls";
import useQueryApi from "@/src/api/useQuery";
import { useCanvas } from "@/src/hooks/useCanvas";
import { translateSubmitError, validateDateNotBefore } from "@/src/utils/formUtils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

interface EntryFormData {
  incomeId: number | null;
  amount?: number;
  destinationWalletId: number | null;
  expectedDate: string;
  receivedDate: string;
  notes: string;
}

const defaultValues: EntryFormData = {
  incomeId: null,
  amount: undefined,
  destinationWalletId: null,
  expectedDate: "",
  receivedDate: "",
  notes: "",
};

const hasWindow = typeof window !== "undefined";

function toDateInputValue(date: string | null | undefined): string {
  if (!date) return "";
  return date.slice(0, 10);
}

interface NewIncomeEntryModalProps {
  incomeId?: number;
  entryId?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultWalletId?: number | null;
  fixedDestinationWalletId?: number;
  incomeName?: string;
  walletName?: string;
  defaultExpectedDate?: string;
  defaultReceivedDate?: string;
  defaultAmount?: number;
  defaultNotes?: string;
  extraInvalidateKeys?: unknown[][];
}

export function NewIncomeEntryModal({
  incomeId,
  entryId,
  open,
  onOpenChange,
  defaultWalletId,
  fixedDestinationWalletId,
  incomeName,
  walletName,
  defaultExpectedDate,
  defaultReceivedDate,
  defaultAmount,
  defaultNotes,
  extraInvalidateKeys = [],
}: NewIncomeEntryModalProps) {
  const { t } = useTranslation("incomes");
  const { t: tc } = useTranslation("common");
  const { t: tv } = useTranslation("validation");
  const queryClient = useQueryClient();
  const { canvas } = useCanvas();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isEditMode = entryId != null;
  const showIncomePicker = incomeId === undefined;
  const showWalletPicker = fixedDestinationWalletId === undefined;

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EntryFormData>({
    defaultValues,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const expectedDate = watch("expectedDate");

  const { data: incomesRes, isLoading: isLoadingIncomes } = useQueryApi<{
    incomes?: { id: number; name: string; category?: { name: string } | null }[];
  }>(canvas ? `${API_ROUTES.CANVASES_INCOMES_LIST(canvas)}?limit=100` : "", {
    queryKey: ["incomes", canvas, "all"],
    hasToken: true,
    enabled: open && !!canvas && showIncomePicker,
  });

  const { data: walletsRes, isLoading: isLoadingWallets } = useQueryApi<{
    wallets?: { id: number; name: string; category?: { name: string } | null }[];
  }>(canvas ? `${API_ROUTES.CANVASES_WALLETS_LIST(canvas)}?limit=100` : "", {
    queryKey: ["wallets", canvas, "all"],
    hasToken: true,
    enabled: open && !!canvas && showWalletPicker,
  });

  const resolvedIncomeIdForFetch = incomeId;
  const { data: entriesRes, isLoading: isLoadingEntry } = useQueryApi<{
    entries?: {
      id: number;
      incomeId: number;
      destinationWalletId: number;
      amount: string;
      expectedDate: string | null;
      receivedDate: string | null;
      notes: string | null;
    }[];
  }>(
    resolvedIncomeIdForFetch ? API_ROUTES.INCOME_ENTRIES_LIST(resolvedIncomeIdForFetch) : "",
    {
      queryKey: ["income-entries", resolvedIncomeIdForFetch],
      hasToken: true,
      enabled: open && isEditMode && !!resolvedIncomeIdForFetch,
    }
  );

  const editingEntry = useMemo(
    () => entriesRes?.entries?.find((entry) => entry.id === entryId),
    [entriesRes?.entries, entryId]
  );

  const incomes = incomesRes?.incomes ?? [];
  const incomeLabels = incomes.map((income) => {
    const categorySuffix = income.category?.name ? ` (${income.category.name})` : "";
    return `${income.name}${categorySuffix} – #${income.id}`;
  });
  const incomeLabelToId = (label: string) => {
    const idMatch = label.match(/#(\d+)$/);
    return idMatch ? Number(idMatch[1]) : null;
  };
  const incomeIdToLabel = (id: number | null) => {
    if (id === null) return "";
    const income = incomes.find((item) => item.id === id);
    if (!income) return "";
    const categorySuffix = income.category?.name ? ` (${income.category.name})` : "";
    return `${income.name}${categorySuffix} – #${income.id}`;
  };

  const wallets = walletsRes?.wallets ?? [];
  const walletLabels = wallets.map((wallet) => {
    const categorySuffix = wallet.category?.name ? ` (${wallet.category.name})` : "";
    return `${wallet.name}${categorySuffix} – #${wallet.id}`;
  });
  const walletLabelToId = (label: string) => {
    const idMatch = label.match(/#(\d+)$/);
    return idMatch ? Number(idMatch[1]) : null;
  };
  const walletIdToLabel = (id: number | null) => {
    if (id === null) return "";
    const wallet = wallets.find((item) => item.id === id);
    if (!wallet) return "";
    const categorySuffix = wallet.category?.name ? ` (${wallet.category.name})` : "";
    return `${wallet.name}${categorySuffix} – #${wallet.id}`;
  };

  const { mutateAsync: saveEntry, isPending } = useMutation({
    mutationFn: async (formData: EntryFormData) => {
      const resolvedIncomeId = incomeId ?? formData.incomeId;
      const resolvedWalletId = fixedDestinationWalletId ?? formData.destinationWalletId;
      const payload = {
        destinationWalletId: resolvedWalletId,
        amount: Number(formData.amount),
        expectedDate: formData.expectedDate || null,
        receivedDate: formData.receivedDate || null,
        notes: formData.notes.trim() || null,
      };
      const token = hasWindow ? window.localStorage.getItem("accessToken") : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      if (isEditMode && entryId) {
        const url = `${process.env.NEXT_PUBLIC_BASE_URL}${API_ROUTES.INCOME_ENTRIES_UPDATE(entryId)}`;
        await axios.put(url, payload, { headers });
        return;
      }

      const url = `${process.env.NEXT_PUBLIC_BASE_URL}${API_ROUTES.INCOME_ENTRIES_CREATE(resolvedIncomeId!)}`;
      await axios.post(url, payload, { headers });
    },
    onSuccess: async (_, formData) => {
      const resolvedIncomeId = incomeId ?? formData.incomeId;
      if (resolvedIncomeId) {
        await queryClient.invalidateQueries({ queryKey: ["income-entries", resolvedIncomeId] });
      }
      for (const key of extraInvalidateKeys) {
        await queryClient.invalidateQueries({ queryKey: key });
      }
      await queryClient.invalidateQueries({ queryKey: ["notifications", "overdue"] });
    },
  });

  useEffect(() => {
    if (!open) return;

    if (isEditMode) {
      if (!editingEntry) return;
      reset({
        incomeId: incomeId ?? editingEntry.incomeId,
        destinationWalletId: fixedDestinationWalletId ?? editingEntry.destinationWalletId,
        amount: Number(editingEntry.amount),
        expectedDate: toDateInputValue(editingEntry.expectedDate),
        receivedDate:
          toDateInputValue(editingEntry.receivedDate) ||
          new Date().toISOString().slice(0, 10),
        notes: editingEntry.notes ?? "",
      });
      setSubmitError(null);
      return;
    }

    reset({
      ...defaultValues,
      incomeId: incomeId ?? null,
      destinationWalletId: fixedDestinationWalletId ?? defaultWalletId ?? null,
      expectedDate: defaultExpectedDate ?? "",
      amount: defaultAmount,
      receivedDate: defaultReceivedDate ?? new Date().toISOString().slice(0, 10),
      notes: defaultNotes ?? "",
    });
    setSubmitError(null);
  }, [
    open,
    isEditMode,
    editingEntry,
    incomeId,
    entryId,
    defaultWalletId,
    fixedDestinationWalletId,
    defaultExpectedDate,
    defaultReceivedDate,
    defaultAmount,
    defaultNotes,
    reset,
  ]);

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset(defaultValues);
      setSubmitError(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (formData: EntryFormData) => {
    setSubmitError(null);

    if (!canvas) {
      setSubmitError(tv("noCanvas"));
      return;
    }

    try {
      await saveEntry(formData);
      reset(defaultValues);
      setSubmitError(null);
      onOpenChange(false);
    } catch (error) {
      setSubmitError(translateSubmitError(error, tv("entrySaveFailed"), tv));
    }
  };

  const isSaving = isPending || isSubmitting || (isEditMode && isLoadingEntry);

  const description = incomeName
    ? t("entryModal.description.forIncome", { incomeName })
    : walletName
      ? t("entryModal.description.toWallet", { walletName })
      : t("entryModal.description.default");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup className="gap-4">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? t("entryModal.editTitle") : t("entryModal.title")}
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

            <FormSubmitError message={submitError} />

            {showIncomePicker && (
              <Field>
                <FieldLabel htmlFor="entry-income">{t("entryModal.fields.income.label")}</FieldLabel>
                <Controller
                  name="incomeId"
                  control={control}
                  rules={{
                    validate: (value) => value !== null || tv("incomeRequired"),
                  }}
                  render={({ field }) => (
                    <Combobox
                      id="entry-income"
                      items={incomeLabels}
                      value={incomeIdToLabel(field.value)}
                      disabled={isLoadingIncomes}
                      onValueChange={(val) =>
                        field.onChange(val ? incomeLabelToId(val) : null)
                      }
                    >
                      <ComboboxInput placeholder={isLoadingIncomes ? t("entryModal.fields.income.loading") : t("entryModal.fields.income.placeholder")} />
                      <ComboboxContent className="z-[80]">
                        <ComboboxEmpty>{t("entryModal.empty.noIncomes")}</ComboboxEmpty>
                        <ComboboxCollection>
                          {(label) => (
                            <ComboboxItem key={label} value={label}>
                              {label}
                            </ComboboxItem>
                          )}
                        </ComboboxCollection>
                      </ComboboxContent>
                    </Combobox>
                  )}
                />
                <FieldError errors={[errors.incomeId]} />
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor="entry-amount">{t("entryModal.fields.amount.label")}</FieldLabel>
              <NumberInput
                id="entry-amount"
                step="any"
                min="0"
                aria-invalid={!!errors.amount}
                placeholder={tc("placeholders.amount")}
                {...register("amount", {
                  required: tv("amountRequired"),
                  valueAsNumber: true,
                  min: {
                    value: 0.01,
                    message: tv("amountPositive"),
                  },
                  validate: (value) =>
                    (value != null && !Number.isNaN(value) && value > 0) ||
                    tv("amountPositive"),
                })}
              />
              <FieldError errors={[errors.amount]} />
            </Field>

            {showWalletPicker ? (
              <Field>
                <FieldLabel htmlFor="entry-wallet">{t("entryModal.fields.destinationWallet.label")}</FieldLabel>
                <Controller
                  name="destinationWalletId"
                  control={control}
                  rules={{
                    validate: (value) => value !== null || tv("walletRequired"),
                  }}
                  render={({ field }) => (
                    <Combobox
                      id="entry-wallet"
                      items={walletLabels}
                      value={walletIdToLabel(field.value)}
                      disabled={isLoadingWallets}
                      onValueChange={(val) =>
                        field.onChange(val ? walletLabelToId(val) : null)
                      }
                    >
                      <ComboboxInput placeholder={tc("placeholders.selectWallet")} />
                      <ComboboxContent className="z-[80]">
                        <ComboboxEmpty>{tc("empty.noWalletsFound")}</ComboboxEmpty>
                        <ComboboxCollection>
                          {(label) => (
                            <ComboboxItem key={label} value={label}>
                              {label}
                            </ComboboxItem>
                          )}
                        </ComboboxCollection>
                      </ComboboxContent>
                    </Combobox>
                  )}
                />
                <FieldError errors={[errors.destinationWalletId]} />
              </Field>
            ) : (
              <Field>
                <FieldLabel>{t("entryModal.fields.destinationWallet.label")}</FieldLabel>
                <Input value={walletName ?? tc("wallet.thisWallet")} disabled />
              </Field>
            )}

            <Stack direction="row" gap={4}>
              <Field className="flex-1">
                <FieldLabel htmlFor="entry-expected-date">{t("entryModal.fields.expectedDate.label")}</FieldLabel>
                <Input
                  id="entry-expected-date"
                  type="date"
                  {...register("expectedDate")}
                />
              </Field>
              <Field className="flex-1">
                <FieldLabel htmlFor="entry-received-date">{t("entryModal.fields.receivedDate.label")}</FieldLabel>
                <Input
                  id="entry-received-date"
                  type="date"
                  aria-invalid={!!errors.receivedDate}
                  {...register("receivedDate", {
                    validate: (value) =>
                      validateDateNotBefore(value, expectedDate, tv("receivedBeforeExpected")),
                  })}
                />
                <FieldError errors={[errors.receivedDate]} />
              </Field>
            </Stack>

            <Field>
              <FieldLabel htmlFor="entry-notes">{t("entryModal.fields.notes.label")}</FieldLabel>
              <Textarea
                id="entry-notes"
                placeholder={tc("placeholders.optionalNotesPayment")}
                rows={3}
                {...register("notes")}
              />
            </Field>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSaving}>
                {tc("actions.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="size-4 animate-spin" />}
              {isSaving
                ? isEditMode
                  ? tc("actions.saving")
                  : tc("actions.creating")
                : isEditMode
                  ? tc("actions.saveChanges")
                  : t("entryModal.submit")}
            </Button>
          </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
