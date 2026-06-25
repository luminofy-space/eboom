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
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

interface PaymentFormData {
  expenseId: number | null;
  amount: number;
  sourceWalletId: number | null;
  dueDate: string;
  paidDate: string;
  notes: string;
}

const defaultValues: PaymentFormData = {
  expenseId: null,
  amount: 0,
  sourceWalletId: null,
  dueDate: "",
  paidDate: "",
  notes: "",
};

const hasWindow = typeof window !== "undefined";

interface NewExpensePaymentModalProps {
  expenseId?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultWalletId?: number | null;
  fixedSourceWalletId?: number;
  expenseName?: string;
  walletName?: string;
  defaultDueDate?: string;
  defaultAmount?: number;
  extraInvalidateKeys?: unknown[][];
}

export function NewExpensePaymentModal({
  expenseId,
  open,
  onOpenChange,
  defaultWalletId,
  fixedSourceWalletId,
  expenseName,
  walletName,
  defaultDueDate,
  defaultAmount,
  extraInvalidateKeys = [],
}: NewExpensePaymentModalProps) {
  const { t } = useTranslation("expenses");
  const { t: tc } = useTranslation("common");
  const { t: tv } = useTranslation("validation");
  const queryClient = useQueryClient();
  const { canvas } = useCanvas();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const showExpensePicker = expenseId === undefined;
  const showWalletPicker = fixedSourceWalletId === undefined;

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormData>({
    defaultValues,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const dueDate = watch("dueDate");

  const { data: expensesRes, isLoading: isLoadingExpenses } = useQueryApi<{
    expenses?: { id: number; name: string; category?: { name: string } | null }[];
  }>(canvas ? `${API_ROUTES.CANVASES_EXPENSES_LIST(canvas)}?limit=100` : "", {
    queryKey: ["expenses", canvas, "all"],
    hasToken: true,
    enabled: open && !!canvas && showExpensePicker,
  });

  const { data: walletsRes, isLoading: isLoadingWallets } = useQueryApi<{
    wallets?: { id: number; name: string; category?: { name: string } | null }[];
  }>(canvas ? `${API_ROUTES.CANVASES_WALLETS_LIST(canvas)}?limit=100` : "", {
    queryKey: ["wallets", canvas, "all"],
    hasToken: true,
    enabled: open && !!canvas && showWalletPicker,
  });

  const expenses = expensesRes?.expenses ?? [];
  const expenseLabels = expenses.map((expense) => {
    const categorySuffix = expense.category?.name ? ` (${expense.category.name})` : "";
    return `${expense.name}${categorySuffix} – #${expense.id}`;
  });
  const expenseLabelToId = (label: string) => {
    const idMatch = label.match(/#(\d+)$/);
    return idMatch ? Number(idMatch[1]) : null;
  };
  const expenseIdToLabel = (id: number | null) => {
    if (id === null) return "";
    const expense = expenses.find((item) => item.id === id);
    if (!expense) return "";
    const categorySuffix = expense.category?.name ? ` (${expense.category.name})` : "";
    return `${expense.name}${categorySuffix} – #${expense.id}`;
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

  const { mutateAsync: createPayment, isPending } = useMutation({
    mutationFn: async (formData: PaymentFormData) => {
      const resolvedExpenseId = expenseId ?? formData.expenseId;
      const resolvedWalletId = fixedSourceWalletId ?? formData.sourceWalletId;

      const url = `${process.env.NEXT_PUBLIC_BASE_URL}${API_ROUTES.EXPENSE_PAYMENTS_CREATE(resolvedExpenseId!)}`;
      const token = hasWindow ? window.localStorage.getItem("accessToken") : null;

      await axios.post(
        url,
        {
          sourceWalletId: resolvedWalletId,
          amount: Number(formData.amount),
          dueDate: formData.dueDate || null,
          paidDate: formData.paidDate || null,
          notes: formData.notes.trim() || null,
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
    },
    onSuccess: async (_, formData) => {
      const resolvedExpenseId = expenseId ?? formData.expenseId;
      if (resolvedExpenseId) {
        await queryClient.invalidateQueries({ queryKey: ["expense-payments", resolvedExpenseId] });
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
        expenseId: expenseId ?? null,
        sourceWalletId: fixedSourceWalletId ?? defaultWalletId ?? null,
        dueDate: defaultDueDate ?? "",
        amount: defaultAmount ?? 0,
        paidDate: new Date().toISOString().slice(0, 10),
      });
      setSubmitError(null);
    }
  }, [
    open,
    expenseId,
    defaultWalletId,
    fixedSourceWalletId,
    defaultDueDate,
    defaultAmount,
    reset,
  ]);

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset(defaultValues);
      setSubmitError(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (formData: PaymentFormData) => {
    setSubmitError(null);

    if (!canvas) {
      setSubmitError(tv("noCanvas"));
      return;
    }

    try {
      await createPayment(formData);
      reset(defaultValues);
      setSubmitError(null);
      onOpenChange(false);
    } catch (error) {
      setSubmitError(translateSubmitError(error, tv("paymentSaveFailed"), tv));
    }
  };

  const isSaving = isPending || isSubmitting;

  const description = expenseName
    ? t("paymentModal.description.forExpense", { expenseName })
    : walletName
      ? t("paymentModal.description.fromWallet", { walletName })
      : t("paymentModal.description.default");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup className="gap-4">
          <DialogHeader>
            <DialogTitle>{t("paymentModal.title")}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

            <FormSubmitError message={submitError} />

            {showExpensePicker && (
              <Field>
                <FieldLabel htmlFor="payment-expense">{t("paymentModal.fields.expense.label")}</FieldLabel>
                <Controller
                  name="expenseId"
                  control={control}
                  rules={{
                    validate: (value) => value !== null || tv("expenseRequired"),
                  }}
                  render={({ field }) => (
                    <Combobox
                      id="payment-expense"
                      items={expenseLabels}
                      value={expenseIdToLabel(field.value)}
                      disabled={isLoadingExpenses}
                      onValueChange={(val) =>
                        field.onChange(val ? expenseLabelToId(val) : null)
                      }
                    >
                      <ComboboxInput placeholder={isLoadingExpenses ? t("paymentModal.fields.expense.loading") : t("paymentModal.fields.expense.placeholder")} />
                      <ComboboxContent className="z-[80]">
                        <ComboboxEmpty>{t("paymentModal.empty.noExpenses")}</ComboboxEmpty>
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
                <FieldError errors={[errors.expenseId]} />
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor="payment-amount">{t("paymentModal.fields.amount.label")}</FieldLabel>
              <Input
                id="payment-amount"
                type="number"
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
                    (!Number.isNaN(value) && value > 0) || tv("amountPositive"),
                })}
              />
              <FieldError errors={[errors.amount]} />
            </Field>

            {showWalletPicker ? (
              <Field>
                <FieldLabel htmlFor="payment-wallet">{t("paymentModal.fields.sourceWallet.label")}</FieldLabel>
                <Controller
                  name="sourceWalletId"
                  control={control}
                  rules={{
                    validate: (value) => value !== null || tv("walletRequired"),
                  }}
                  render={({ field }) => (
                    <Combobox
                      id="payment-wallet"
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
                <FieldError errors={[errors.sourceWalletId]} />
              </Field>
            ) : (
              <Field>
                <FieldLabel>{t("paymentModal.fields.sourceWallet.label")}</FieldLabel>
                <Input value={walletName ?? tc("wallet.thisWallet")} disabled />
              </Field>
            )}

            <Stack direction="row" gap={4}>
              <Field className="flex-1">
                <FieldLabel htmlFor="payment-due-date">{t("paymentModal.fields.dueDate.label")}</FieldLabel>
                <Input
                  id="payment-due-date"
                  type="date"
                  {...register("dueDate")}
                />
              </Field>
              <Field className="flex-1">
                <FieldLabel htmlFor="payment-paid-date">{t("paymentModal.fields.paidDate.label")}</FieldLabel>
                <Input
                  id="payment-paid-date"
                  type="date"
                  aria-invalid={!!errors.paidDate}
                  {...register("paidDate", {
                    validate: (value) =>
                      validateDateNotBefore(value, dueDate, tv("paidBeforeDue")),
                  })}
                />
                <FieldError errors={[errors.paidDate]} />
              </Field>
            </Stack>

            <Field>
              <FieldLabel htmlFor="payment-notes">{t("paymentModal.fields.notes.label")}</FieldLabel>
              <Textarea
                id="payment-notes"
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
              {isSaving ? tc("actions.creating") : t("paymentModal.submit")}
            </Button>
          </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
