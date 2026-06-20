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
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Stack } from "@/components/ui/stack";
import { Textarea } from "@/components/ui/textarea";
import API_ROUTES from "@/src/api/urls";
import useQueryApi from "@/src/api/useQuery";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

interface EntryFormData {
  incomeId: number | null;
  amount: number;
  destinationWalletId: number | null;
  expectedDate: string;
  receivedDate: string;
  notes: string;
}

const defaultValues: EntryFormData = {
  incomeId: null,
  amount: 0,
  destinationWalletId: null,
  expectedDate: "",
  receivedDate: "",
  notes: "",
};

const hasWindow = typeof window !== "undefined";

interface NewIncomeEntryModalProps {
  incomeId?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultWalletId?: number | null;
  fixedDestinationWalletId?: number;
  incomeName?: string;
  walletName?: string;
  extraInvalidateKeys?: unknown[][];
}

export function NewIncomeEntryModal({
  incomeId,
  open,
  onOpenChange,
  defaultWalletId,
  fixedDestinationWalletId,
  incomeName,
  walletName,
  extraInvalidateKeys = [],
}: NewIncomeEntryModalProps) {
  const { t } = useTranslation("incomes");
  const { t: tc } = useTranslation("common");
  const queryClient = useQueryClient();
  const { canvas } = useCanvas();
  const showIncomePicker = incomeId === undefined;
  const showWalletPicker = fixedDestinationWalletId === undefined;

  const { register, handleSubmit, control, reset, watch } = useForm<EntryFormData>({
    defaultValues,
  });

  const amount = watch("amount");
  const selectedIncomeId = watch("incomeId");
  const destinationWalletId = watch("destinationWalletId");

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

  const { mutateAsync: createEntry, isPending } = useMutation({
    mutationFn: async (formData: EntryFormData) => {
      const resolvedIncomeId = incomeId ?? formData.incomeId;
      const resolvedWalletId = fixedDestinationWalletId ?? formData.destinationWalletId;

      if (!resolvedIncomeId || !resolvedWalletId) {
        throw new Error(t("entryModal.error.required"));
      }

      const url = `${process.env.NEXT_PUBLIC_BASE_URL}${API_ROUTES.INCOME_ENTRIES_CREATE(resolvedIncomeId)}`;
      const token = hasWindow ? window.localStorage.getItem("accessToken") : null;

      await axios.post(
        url,
        {
          destinationWalletId: resolvedWalletId,
          amount: Number(formData.amount),
          expectedDate: formData.expectedDate || null,
          receivedDate: formData.receivedDate || null,
          notes: formData.notes.trim() || null,
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
    },
    onSuccess: async () => {
      const resolvedIncomeId = incomeId ?? selectedIncomeId;
      if (resolvedIncomeId) {
        await queryClient.invalidateQueries({ queryKey: ["income-entries", resolvedIncomeId] });
      }
      for (const key of extraInvalidateKeys) {
        await queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        ...defaultValues,
        incomeId: incomeId ?? null,
        destinationWalletId: fixedDestinationWalletId ?? defaultWalletId ?? null,
        receivedDate: new Date().toISOString().slice(0, 10),
      });
    }
  }, [open, incomeId, defaultWalletId, fixedDestinationWalletId, reset]);

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset(defaultValues);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (formData: EntryFormData) => {
    try {
      await createEntry(formData);
      reset(defaultValues);
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating income entry:", error);
    }
  };

  const effectiveIncomeId = incomeId ?? selectedIncomeId;
  const effectiveWalletId = fixedDestinationWalletId ?? destinationWalletId;
  const isValid = amount > 0 && !!effectiveIncomeId && !!effectiveWalletId;

  const description = incomeName
    ? t("entryModal.description.forIncome", { incomeName })
    : walletName
      ? t("entryModal.description.toWallet", { walletName })
      : t("entryModal.description.default");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup className="gap-4">
          <DialogHeader>
            <DialogTitle>{t("entryModal.title")}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

            {showIncomePicker && (
              <Field>
                <FieldLabel htmlFor="entry-income">{t("entryModal.fields.income.label")}</FieldLabel>
                <Controller
                  name="incomeId"
                  control={control}
                  rules={{ required: true }}
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
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor="entry-amount">{t("entryModal.fields.amount.label")}</FieldLabel>
              <Input
                id="entry-amount"
                type="number"
                step="any"
                min="0"
                placeholder={tc("placeholders.amount")}
                {...register("amount", { required: true, valueAsNumber: true, min: 0.01 })}
              />
            </Field>

            {showWalletPicker ? (
              <Field>
                <FieldLabel htmlFor="entry-wallet">{t("entryModal.fields.destinationWallet.label")}</FieldLabel>
                <Controller
                  name="destinationWalletId"
                  control={control}
                  rules={{ required: true }}
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
                  {...register("receivedDate")}
                />
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
              <Button type="button" variant="outline" disabled={isPending}>
                {tc("actions.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending || !isValid}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isPending ? tc("actions.creating") : t("entryModal.submit")}
            </Button>
          </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
