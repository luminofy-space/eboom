"use client";

import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
} from "@/components/ui/combobox";
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
import { translateSubmitError } from "@/src/utils/formUtils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { WalletTransfer } from "../utils/utils";

interface TransferFormData {
  sourceWalletId: number | null;
  sourceCurrencyId: number | null;
  destinationWalletId: number | null;
  destinationCurrencyId: number | null;
  sourceAmount: number;
  destinationAmount: number;
  exchangeRate: number;
  transactionFee: number;
  transferDate: string;
  notes: string;
}

const defaultValues: TransferFormData = {
  sourceWalletId: null,
  sourceCurrencyId: null,
  destinationWalletId: null,
  destinationCurrencyId: null,
  sourceAmount: 0,
  destinationAmount: 0,
  exchangeRate: 1,
  transactionFee: 0,
  transferDate: "",
  notes: "",
};

const hasWindow = typeof window !== "undefined";

function toDateInputValue(date: string | null | undefined): string {
  if (!date) return "";
  return date.slice(0, 10);
}

interface WalletListItem {
  id: number;
  name: string;
  category?: { name: string } | null;
}

interface CurrencyOption {
  id: number;
  code: string;
  symbol: string;
  name?: string;
}

interface SubWalletOption {
  id: number;
  currencyId: number;
  amount: string;
  currency?: CurrencyOption | null;
}

interface NewTransferModalProps {
  transferId?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fixedSourceWalletId?: number;
  fixedDestinationWalletId?: number;
  sourceWalletName?: string;
  destinationWalletName?: string;
  extraInvalidateKeys?: unknown[][];
}

export function NewTransferModal({
  transferId,
  open,
  onOpenChange,
  fixedSourceWalletId,
  fixedDestinationWalletId,
  sourceWalletName,
  destinationWalletName,
  extraInvalidateKeys = [],
}: NewTransferModalProps) {
  const { t } = useTranslation("wallets");
  const { t: tc } = useTranslation("common");
  const { t: tv } = useTranslation("validation");
  const { canvas } = useCanvas();
  const queryClient = useQueryClient();
  const isEditMode = !!transferId;
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TransferFormData>({ defaultValues });

  const sourceWalletId = useWatch({ control, name: "sourceWalletId" });
  const destinationWalletId = useWatch({ control, name: "destinationWalletId" });
  const sourceCurrencyId = useWatch({ control, name: "sourceCurrencyId" });
  const destinationCurrencyId = useWatch({ control, name: "destinationCurrencyId" });
  const sourceAmount = useWatch({ control, name: "sourceAmount" });
  const exchangeRate = useWatch({ control, name: "exchangeRate" });
  const transactionFee = useWatch({ control, name: "transactionFee" });

  const { data: walletsRes, isLoading: isLoadingWallets } = useQueryApi<{
    wallets?: WalletListItem[];
  }>(API_ROUTES.CANVASES_WALLETS_LIST(canvas ?? 0), {
    queryKey: ["wallets", canvas],
    enabled: !!canvas && open,
  });

  const { data: currenciesRes } = useQueryApi<{ currencies?: CurrencyOption[] }>(
    API_ROUTES.CURRENCIES_METADATA,
    { queryKey: ["currencies"], enabled: open }
  );

  const { data: sourceWalletRes } = useQueryApi<{
    wallet: { subWallets?: SubWalletOption[] };
  }>(API_ROUTES.WALLETS_GET(sourceWalletId ?? 0), {
    queryKey: ["wallet", sourceWalletId],
    enabled: !!sourceWalletId && open,
  });

  const { data: destWalletRes } = useQueryApi<{
    wallet: { subWallets?: SubWalletOption[] };
  }>(API_ROUTES.WALLETS_GET(destinationWalletId ?? 0), {
    queryKey: ["wallet", destinationWalletId],
    enabled: !!destinationWalletId && open,
  });

  const { data: transferRes, isLoading: isLoadingTransfer } = useQueryApi<{
    transfer?: WalletTransfer;
  }>(API_ROUTES.TRANSFERS_GET(transferId ?? 0), {
    queryKey: ["transfer", transferId],
    enabled: isEditMode && open && !!transferId,
  });

  const editingTransfer = transferRes?.transfer ?? null;

  const wallets = walletsRes?.wallets ?? [];
  const allCurrencies = currenciesRes?.currencies ?? [];

  const sourceCurrencyOptions = useMemo(() => {
    const subWallets = sourceWalletRes?.wallet?.subWallets ?? [];
    if (subWallets.length > 0) {
      return subWallets.map((sw) => ({
        id: sw.currencyId,
        code: sw.currency?.code ?? String(sw.currencyId),
        symbol: sw.currency?.symbol ?? "",
        name: sw.currency?.name,
      }));
    }
    return allCurrencies;
  }, [sourceWalletRes?.wallet?.subWallets, allCurrencies]);

  const destinationCurrencyOptions = useMemo(() => {
    const subWallets = destWalletRes?.wallet?.subWallets ?? [];
    if (subWallets.length > 0) {
      return subWallets.map((sw) => ({
        id: sw.currencyId,
        code: sw.currency?.code ?? String(sw.currencyId),
        symbol: sw.currency?.symbol ?? "",
        name: sw.currency?.name,
      }));
    }
    return allCurrencies;
  }, [destWalletRes?.wallet?.subWallets, allCurrencies]);

  const isCrossCurrency =
    sourceCurrencyId != null &&
    destinationCurrencyId != null &&
    sourceCurrencyId !== destinationCurrencyId;

  const walletLabels = useMemo(
    () =>
      wallets.map(
        (w) => `${w.name}${w.category?.name ? ` (${w.category.name})` : ""} – #${w.id}`
      ),
    [wallets]
  );

  const walletIdToLabel = (id: number | null) => {
    if (!id) return "";
    const wallet = wallets.find((w) => w.id === id);
    if (!wallet) return "";
    return `${wallet.name}${wallet.category?.name ? ` (${wallet.category.name})` : ""} – #${wallet.id}`;
  };

  const walletLabelToId = (label: string) => {
    const match = label.match(/#(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
  };

  const currencyLabels = (options: CurrencyOption[]) =>
    options.map((c) => `${c.code} (${c.symbol})`);

  const currencyIdToLabel = (options: CurrencyOption[], id: number | null) => {
    if (!id) return "";
    const currency = options.find((c) => c.id === id);
    return currency ? `${currency.code} (${currency.symbol})` : "";
  };

  const currencyLabelToId = (options: CurrencyOption[], label: string) => {
    const currency = options.find((c) => `${c.code} (${c.symbol})` === label);
    return currency?.id ?? null;
  };

  useEffect(() => {
    const fee = Number(transactionFee) || 0;
    const source = Number(sourceAmount) || 0;
    const netSource = Math.max(0, source - fee);

    if (!isCrossCurrency) {
      setValue("destinationAmount", netSource);
      setValue("exchangeRate", 1);
    } else if (netSource > 0 && exchangeRate) {
      setValue("destinationAmount", Number((netSource * exchangeRate).toFixed(8)));
    }
  }, [isCrossCurrency, sourceAmount, exchangeRate, transactionFee, setValue]);

  const { mutateAsync: saveTransfer, isPending } = useMutation({
    mutationFn: async (formData: TransferFormData) => {
      const payload = {
        canvasId: canvas,
        sourceWalletId: formData.sourceWalletId,
        sourceCurrencyId: formData.sourceCurrencyId,
        destinationWalletId: formData.destinationWalletId,
        destinationCurrencyId: formData.destinationCurrencyId,
        sourceAmount: formData.sourceAmount,
        destinationAmount: formData.destinationAmount,
        exchangeRate:
          formData.sourceCurrencyId !== formData.destinationCurrencyId
            ? formData.exchangeRate
            : "1",
        transactionFee: formData.transactionFee || 0,
        transferDate: formData.transferDate,
        notes: formData.notes.trim() || null,
      };

      const token = hasWindow ? window.localStorage.getItem("accessToken") : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      if (isEditMode && transferId) {
        const url = `${process.env.NEXT_PUBLIC_BASE_URL}${API_ROUTES.TRANSFERS_UPDATE(transferId)}`;
        await axios.put(url, payload, { headers });
        return;
      }

      const url = `${process.env.NEXT_PUBLIC_BASE_URL}${API_ROUTES.TRANSFERS_CREATE}`;
      await axios.post(url, payload, { headers });
    },
    onSuccess: async () => {
      for (const key of extraInvalidateKeys) {
        await queryClient.invalidateQueries({ queryKey: key });
      }
      await queryClient.invalidateQueries({ queryKey: ["wallet-transfers"] });
      await queryClient.invalidateQueries({ queryKey: ["canvas-transfers"] });
      await queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });

  useEffect(() => {
    if (!open) return;

    if (isEditMode) {
      if (!editingTransfer) return;
      reset({
        sourceWalletId: editingTransfer.sourceWalletId,
        sourceCurrencyId: editingTransfer.sourceCurrencyId,
        destinationWalletId: editingTransfer.destinationWalletId,
        destinationCurrencyId: editingTransfer.destinationCurrencyId,
        sourceAmount: Number(editingTransfer.sourceAmount),
        destinationAmount: Number(editingTransfer.destinationAmount),
        exchangeRate: Number(editingTransfer.exchangeRate ?? 1),
        transactionFee: Number(editingTransfer.transactionFee ?? 0),
        transferDate: toDateInputValue(editingTransfer.transferDate),
        notes: editingTransfer.notes ?? "",
      });
      setSubmitError(null);
      return;
    }

    reset({
      ...defaultValues,
      sourceWalletId: fixedSourceWalletId ?? null,
      destinationWalletId: fixedDestinationWalletId ?? null,
      transferDate: new Date().toISOString().slice(0, 10),
    });
    setSubmitError(null);
  }, [
    open,
    isEditMode,
    editingTransfer,
    fixedSourceWalletId,
    fixedDestinationWalletId,
    reset,
  ]);

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset(defaultValues);
      setSubmitError(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (formData: TransferFormData) => {
    setSubmitError(null);

    if (!canvas) {
      setSubmitError(t("validation.noCanvas"));
      return;
    }

    try {
      await saveTransfer(formData);
      reset(defaultValues);
      setSubmitError(null);
      onOpenChange(false);
    } catch (error) {
      setSubmitError(translateSubmitError(error, t("transferModal.error.saveFailed"), tv));
    }
  };

  const isSaving = isPending || isSubmitting || (isEditMode && isLoadingTransfer);

  const showSourceWalletPicker = !fixedSourceWalletId;
  const showDestWalletPicker = !fixedDestinationWalletId;

  const description = sourceWalletName
    ? t("transferModal.description.fromWallet", { walletName: sourceWalletName })
    : destinationWalletName
      ? t("transferModal.description.toWallet", { walletName: destinationWalletName })
      : t("transferModal.description.default");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full sm:max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup className="gap-4">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? t("transferModal.editTitle") : t("transferModal.title")}
              </DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>

            <FormSubmitError message={submitError} />

            {showSourceWalletPicker ? (
              <Field>
                <FieldLabel htmlFor="transfer-source-wallet">
                  {t("transferModal.fields.sourceWallet.label")}
                </FieldLabel>
                <Controller
                  name="sourceWalletId"
                  control={control}
                  rules={{ validate: (value) => value !== null || tv("walletRequired") }}
                  render={({ field }) => (
                    <Combobox
                      id="transfer-source-wallet"
                      items={walletLabels}
                      value={walletIdToLabel(field.value)}
                      disabled={isLoadingWallets}
                      onValueChange={(val) => {
                        field.onChange(val ? walletLabelToId(val) : null);
                        setValue("sourceCurrencyId", null);
                      }}
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
                <FieldLabel>{t("transferModal.fields.sourceWallet.label")}</FieldLabel>
                <Input value={sourceWalletName ?? ""} disabled />
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor="transfer-source-currency">
                {t("transferModal.fields.sourceCurrency.label")}
              </FieldLabel>
              <Controller
                name="sourceCurrencyId"
                control={control}
                rules={{ validate: (value) => value !== null || t("validation.currencyRequired") }}
                render={({ field }) => (
                  <Combobox
                    id="transfer-source-currency"
                    items={currencyLabels(sourceCurrencyOptions)}
                    value={currencyIdToLabel(sourceCurrencyOptions, field.value)}
                    disabled={!sourceWalletId}
                    onValueChange={(val) =>
                      field.onChange(val ? currencyLabelToId(sourceCurrencyOptions, val) : null)
                    }
                  >
                    <ComboboxInput placeholder={t("transferModal.fields.sourceCurrency.placeholder")} />
                    <ComboboxContent className="z-[80]">
                      <ComboboxEmpty>{t("transferModal.empty.noCurrencies")}</ComboboxEmpty>
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
              <FieldError errors={[errors.sourceCurrencyId]} />
            </Field>

            {showDestWalletPicker ? (
              <Field>
                <FieldLabel htmlFor="transfer-dest-wallet">
                  {t("transferModal.fields.destinationWallet.label")}
                </FieldLabel>
                <Controller
                  name="destinationWalletId"
                  control={control}
                  rules={{ validate: (value) => value !== null || tv("walletRequired") }}
                  render={({ field }) => (
                    <Combobox
                      id="transfer-dest-wallet"
                      items={walletLabels}
                      value={walletIdToLabel(field.value)}
                      disabled={isLoadingWallets}
                      onValueChange={(val) => {
                        field.onChange(val ? walletLabelToId(val) : null);
                        setValue("destinationCurrencyId", null);
                      }}
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
                <FieldLabel>{t("transferModal.fields.destinationWallet.label")}</FieldLabel>
                <Input value={destinationWalletName ?? ""} disabled />
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor="transfer-dest-currency">
                {t("transferModal.fields.destinationCurrency.label")}
              </FieldLabel>
              <Controller
                name="destinationCurrencyId"
                control={control}
                rules={{ validate: (value) => value !== null || t("validation.currencyRequired") }}
                render={({ field }) => (
                  <Combobox
                    id="transfer-dest-currency"
                    items={currencyLabels(destinationCurrencyOptions)}
                    value={currencyIdToLabel(destinationCurrencyOptions, field.value)}
                    disabled={!destinationWalletId}
                    onValueChange={(val) =>
                      field.onChange(val ? currencyLabelToId(destinationCurrencyOptions, val) : null)
                    }
                  >
                    <ComboboxInput placeholder={t("transferModal.fields.destinationCurrency.placeholder")} />
                    <ComboboxContent className="z-[80]">
                      <ComboboxEmpty>{t("transferModal.empty.noCurrencies")}</ComboboxEmpty>
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
              <FieldError errors={[errors.destinationCurrencyId]} />
            </Field>

            <Stack direction="row" gap={3} className="flex-col sm:flex-row">
              <Field className="flex-1">
                <FieldLabel htmlFor="transfer-source-amount">
                  {t("transferModal.fields.sourceAmount.label")}
                </FieldLabel>
                <Input
                  id="transfer-source-amount"
                  type="number"
                  step="any"
                  min="0"
                  {...register("sourceAmount", {
                    required: tv("amountRequired"),
                    valueAsNumber: true,
                    min: { value: 0.01, message: tv("amountPositive") },
                  })}
                />
                <FieldError errors={[errors.sourceAmount]} />
              </Field>

              <Field className="flex-1">
                <FieldLabel htmlFor="transfer-dest-amount">
                  {t("transferModal.fields.destinationAmount.label")}
                </FieldLabel>
                <Input
                  id="transfer-dest-amount"
                  type="number"
                  step="any"
                  min="0"
                  readOnly={!isCrossCurrency}
                  {...register("destinationAmount", {
                    required: tv("amountRequired"),
                    valueAsNumber: true,
                    min: { value: 0.01, message: tv("amountPositive") },
                  })}
                />
                <FieldError errors={[errors.destinationAmount]} />
              </Field>
            </Stack>

            {isCrossCurrency && (
              <Field>
                <FieldLabel htmlFor="transfer-exchange-rate">
                  {t("transferModal.fields.exchangeRate.label")}
                </FieldLabel>
                <Input
                  id="transfer-exchange-rate"
                  type="number"
                  step="any"
                  min="0"
                  {...register("exchangeRate", {
                    required: t("validation.exchangeRateRequired"),
                    valueAsNumber: true,
                    min: { value: 0.00000001, message: t("validation.exchangeRateRequired") },
                  })}
                />
                <FieldError errors={[errors.exchangeRate]} />
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor="transfer-fee">
                {t("transferModal.fields.transactionFee.label")}
              </FieldLabel>
              <Input
                id="transfer-fee"
                type="number"
                step="any"
                min="0"
                {...register("transactionFee", {
                  valueAsNumber: true,
                  min: { value: 0, message: t("validation.feeNonNegative") },
                  validate: (value) => {
                    const fee = Number(value) || 0;
                    const source = Number(sourceAmount) || 0;
                    return fee < source || t("validation.feeLessThanSource");
                  },
                })}
              />
              <FieldError errors={[errors.transactionFee]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="transfer-date">
                {t("transferModal.fields.transferDate.label")}
              </FieldLabel>
              <Input
                id="transfer-date"
                type="date"
                {...register("transferDate", { required: t("validation.transferDateRequired") })}
              />
              <FieldError errors={[errors.transferDate]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="transfer-notes">
                {t("transferModal.fields.notes.label")}
              </FieldLabel>
              <Textarea id="transfer-notes" rows={3} {...register("notes")} />
            </Field>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {tc("actions.cancel")}
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="size-4 animate-spin" />}
                {isEditMode ? t("transferModal.submit.edit") : t("transferModal.submit.create")}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
