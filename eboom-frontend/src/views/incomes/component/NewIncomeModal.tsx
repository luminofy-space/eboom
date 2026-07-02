"use client";

import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { FormSubmitError } from "@/src/components/FormSubmitError";
import API_ROUTES from "@/src/api/urls";
import { useMutationApi } from "@/src/api/useMutation";
import useQueryApi from "@/src/api/useQuery";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useAppDispatch, useAppSelector } from "@/src/redux/store";
import { selectIncomeModal, closeIncomeModal } from "@/src/redux/incomeSlice";
import { fileToDataUrl, translateSubmitError, validateOptionalImage } from "@/src/utils/formUtils";
import { useEffect, useRef, useState } from "react";
import {
  RecurrencePatternPicker,
  DEFAULT_RECURRENCE_PATTERN,
  type RecurrencePattern,
} from "@/src/components/RecurrencePatternPicker";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface IncomeFormData {
  name: string;
  currencyId: number | null;
  amount?: number;
  incomeCategoryId: number | null;
  defaultWalletId: number | null;
  description: string;
  isRecurring: boolean;
  recurrencePattern: RecurrencePattern;
  photo: File | null;
}

const defaultValues: IncomeFormData = {
  name: "",
  currencyId: null,
  amount: undefined,
  incomeCategoryId: null,
  defaultWalletId: null,
  description: "",
  isRecurring: false,
  recurrencePattern: DEFAULT_RECURRENCE_PATTERN,
  photo: null,
};

interface NewIncomeModalProps {
  onCreateSuccess?: (entity: { id: number }) => void;
}

export function NewIncomeModal({ onCreateSuccess }: NewIncomeModalProps) {
  const dispatch = useAppDispatch();
  const { t } = useTranslation("incomes");
  const { t: tc } = useTranslation("common");
  const { t: tv } = useTranslation("validation");
  const { open, mode, editingItem } = useAppSelector(selectIncomeModal);
  const isEdit = mode === "edit";
  const { canvas } = useCanvas();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<IncomeFormData>({
    defaultValues,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const isRecurring = watch("isRecurring");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: currenciesRes, isLoading: isLoadingCurr } = useQueryApi<{
    currencies?: { id: number; name: string; code: string }[];
  }>(
    API_ROUTES.CURRENCIES_METADATA,
    {
      queryKey: ["currencies"],
      hasToken: true,
      enabled: open,
    }
  );

  const { data: categoriesRes, isLoading: isLoadingCategories } = useQueryApi<{
    categories?: { id: number; name: string }[];
  }>(
    API_ROUTES.INCOME_CATEGORIES,
    {
      queryKey: ["income-categories"],
      hasToken: true,
      enabled: open,
    }
  );

  const { data: walletsRes, isLoading: isLoadingWallets } = useQueryApi<{
    wallets?: { id: number; name: string; category?: { name: string } | null }[];
  }>(
    canvas ? `${API_ROUTES.CANVASES_WALLETS_LIST(canvas)}?limit=100` : "",
    {
      queryKey: ["wallets", canvas, "all"],
      hasToken: true,
      enabled: open && !!canvas,
    }
  );

  const currencies = currenciesRes?.currencies ?? [];
  const currencyLabels = currencies.map((c) => `${c.code} – ${c.name}`);
  const currencyIdToLabel = (id: number | null) => {
    if (id === null) return "";
    const c = currencies.find((cur) => cur.id === id);
    return c ? `${c.code} – ${c.name}` : "";
  };
  const currencyLabelToId = (label: string) => {
    const code = label.split(" – ")[0];
    return currencies.find((c) => c.code === code)?.id ?? null;
  };

  const incomeCategories = categoriesRes?.categories ?? [];
  const categoryNames = incomeCategories.map((c) => c.name);
  const categoryNameToId = (catName: string) =>
    incomeCategories.find((c) => c.name === catName)?.id ?? null;
  const categoryIdToName = (id: number | null) =>
    id !== null ? incomeCategories.find((c) => c.id === id)?.name ?? "" : "";

  const wallets = walletsRes?.wallets ?? [];
  const walletLabels = wallets.map((w) => {
    const categorySuffix = w.category?.name ? ` (${w.category.name})` : "";
    return `${w.name}${categorySuffix} – #${w.id}`;
  });
  const walletLabelToId = (label: string) => {
    const idMatch = label.match(/#(\d+)$/);
    return idMatch ? Number(idMatch[1]) : null;
  };
  const walletIdToLabel = (id: number | null) => {
    if (id === null) return "";
    const wallet = wallets.find((w) => w.id === id);
    if (!wallet) return "";
    const categorySuffix = wallet.category?.name ? ` (${wallet.category.name})` : "";
    return `${wallet.name}${categorySuffix} – #${wallet.id}`;
  };

  const { mutateAsync: createIncome, isPending: isCreating } = useMutationApi(
    API_ROUTES.CANVASES_INCOMES_CREATE(canvas ?? -1),
    {
      method: "post",
      hasToken: true,
    }
  );

  const { mutateAsync: updateIncome, isPending: isUpdating } = useMutationApi(
    editingItem ? API_ROUTES.INCOMES_UPDATE(editingItem.id) : "",
    {
      method: "put",
      hasToken: true,
    }
  );

  const isSaving = isCreating || isUpdating || isSubmitting;

  useEffect(() => {
    if (open && isEdit && editingItem) {
      reset({
        name: editingItem.name ?? "",
        currencyId: editingItem.currencyId ?? editingItem.currency?.id ?? null,
        amount: editingItem.amount ? Number(editingItem.amount) : undefined,
        incomeCategoryId: editingItem.incomeCategoryId ?? null,
        defaultWalletId: editingItem.defaultWalletId ?? editingItem.defaultWallet?.id ?? null,
        isRecurring: editingItem.isRecurring ?? false,
        recurrencePattern:
          (editingItem.recurrencePattern as RecurrencePattern) ?? DEFAULT_RECURRENCE_PATTERN,
        description: typeof editingItem.description === "string" ? editingItem.description : "",
        photo: null,
      });
    } else if (open && !isEdit) {
      reset(defaultValues);
    }
    if (open) {
      setSubmitError(null);
    }
  }, [open, isEdit, editingItem, reset]);

  const handleClose = (openState: boolean) => {
    if (!openState) {
      dispatch(closeIncomeModal());
      reset(defaultValues);
      setSubmitError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const onSubmit = async (formData: IncomeFormData) => {
    setSubmitError(null);

    if (!canvas) {
      setSubmitError(tv("noCanvas"));
      return;
    }

    try {
      const data = {
        name: formData.name.trim(),
        currencyId: formData.currencyId,
        amount: Number(formData.amount),
        isRecurring: formData.isRecurring,
        incomeCategoryId: formData.incomeCategoryId ?? undefined,
        defaultWalletId: formData.defaultWalletId,
        recurrencePattern: formData.isRecurring ? formData.recurrencePattern : null,
        description: formData.description.trim(),
        ...(formData.photo
          ? { photoUrl: await fileToDataUrl(formData.photo) }
          : {}),
      };

      if (isEdit) {
        await updateIncome(data);
      } else {
        const response = await createIncome(data);
        const incomeId = (response as { income?: { id: number } })?.income?.id;
        if (typeof incomeId === "number") {
          onCreateSuccess?.({ id: incomeId });
        }
      }

      reset(defaultValues);
      setSubmitError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      dispatch(closeIncomeModal());
    } catch (error) {
      setSubmitError(translateSubmitError(error, tv("incomeSaveFailed"), tv));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="w-full">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup className="gap-4">
          <DialogHeader>
            <DialogTitle>{isEdit ? t("modal.edit.title") : t("modal.create.title")}</DialogTitle>
            <DialogDescription>
              {isEdit ? t("modal.edit.description") : t("modal.create.description")}
            </DialogDescription>
          </DialogHeader>

          <FormSubmitError message={submitError} />

          <Stack direction="row" gap={5}>
            <Field className="flex-1">
              <FieldLabel htmlFor="name">{t("modal.fields.name.label")}</FieldLabel>
              <Input
                id="name"
                aria-invalid={!!errors.name}
                {...register("name", {
                  required: tv("nameRequired"),
                  maxLength: {
                    value: 255,
                    message: tv("nameMaxLength"),
                  },
                  validate: (value) =>
                    value.trim().length > 0 || tv("nameRequired"),
                })}
              />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field className="flex-1">
              <FieldLabel htmlFor="currency">{t("modal.fields.currency.label")}</FieldLabel>
              <Controller
                name="currencyId"
                control={control}
                rules={{
                  validate: (value) => value !== null || tv("currencyRequired"),
                }}
                render={({ field }) => (
                  <Combobox
                    items={currencyLabels}
                    value={currencyIdToLabel(field.value)}
                    id="currency"
                    disabled={isLoadingCurr}
                    onValueChange={(val) =>
                      field.onChange(val ? currencyLabelToId(val) : null)
                    }
                  >
                    <ComboboxInput placeholder={tc("placeholders.selectCurrency")} />
                    <ComboboxContent className="z-[80]">
                      <ComboboxEmpty>{tc("empty.noItemsFound")}</ComboboxEmpty>
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
              <FieldError errors={[errors.currencyId]} />
            </Field>
          </Stack>
          <Stack direction="row" gap={5}>
            <Field className="flex-1">
              <FieldLabel htmlFor="amount">{t("modal.fields.amount.label")}</FieldLabel>
              <NumberInput
                id="amount"
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
                    (!Number.isNaN(value) && value && value > 0) || tv("amountPositive"),
                })}
              />
              <FieldError errors={[errors.amount]} />
            </Field>
            <Field className="flex-1">
              <FieldLabel htmlFor="income-category">{t("modal.fields.incomeCategory.label")}</FieldLabel>
              <Controller
                name="incomeCategoryId"
                control={control}
                rules={{
                  validate: (value) => value !== null || tv("categoryRequired"),
                }}
                render={({ field }) => (
                  <Combobox
                    id="income-category"
                    items={categoryNames}
                    value={categoryIdToName(field.value)}
                    disabled={isLoadingCategories}
                    onValueChange={(val) =>
                      field.onChange(val ? categoryNameToId(val) : null)
                    }
                  >
                    <ComboboxInput placeholder={tc("placeholders.selectCategory")} />
                    <ComboboxContent className="z-[80]">
                      <ComboboxEmpty>{tc("empty.noItemsFound")}</ComboboxEmpty>
                      <ComboboxCollection>
                        {(catName) => (
                          <ComboboxItem key={catName} value={catName}>
                            {catName}
                          </ComboboxItem>
                        )}
                      </ComboboxCollection>
                    </ComboboxContent>
                  </Combobox>
                )}
              />
              <FieldError errors={[errors.incomeCategoryId]} />
            </Field>
          </Stack>
          <Field>
            <FieldLabel htmlFor="default-wallet">{t("modal.fields.defaultWallet.label")}</FieldLabel>
            <Controller
              name="defaultWalletId"
              control={control}
              render={({ field }) => (
                <Combobox
                  id="default-wallet"
                  items={walletLabels}
                  value={walletIdToLabel(field.value)}
                  disabled={isLoadingWallets}
                  onValueChange={(val) =>
                    field.onChange(val ? walletLabelToId(val) : null)
                  }
                >
                  <ComboboxInput placeholder={isLoadingWallets ? tc("loading.wallets") : t("modal.fields.defaultWallet.placeholder")} />
                  <ComboboxContent className="z-[80]">
                    <ComboboxEmpty>{tc("empty.noWalletsFound")}</ComboboxEmpty>
                    <ComboboxCollection>
                      {(walletLabel) => (
                        <ComboboxItem key={walletLabel} value={walletLabel}>
                          {walletLabel}
                        </ComboboxItem>
                      )}
                    </ComboboxCollection>
                  </ComboboxContent>
                </Combobox>
              )}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="description">{t("modal.fields.description.label")}</FieldLabel>
            <Input
              id="description"
              {...register("description")}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="photo">{t("modal.fields.photo.label")}</FieldLabel>
            <Controller
              name="photo"
              control={control}
              rules={{
                validate: (file) =>
                  validateOptionalImage(file, {
                    invalidType: tv("imageInvalidType"),
                    tooLarge: tv("imageTooLarge"),
                  }),
              }}
              render={({ field }) => (
                <Input
                  ref={fileInputRef}
                  id="photo"
                  type="file"
                  accept="image/*"
                  aria-invalid={!!errors.photo}
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    field.onChange(file);
                  }}
                  className="cursor-pointer"
                />
              )}
            />
            <FieldError errors={[errors.photo]} />
          </Field>
          <Stack gap={3}>
            <Field orientation="horizontal" className="items-center">
              <Controller
                name="isRecurring"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="isRecurrent"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(!!checked)}
                  />
                )}
              />
              <FieldLabel htmlFor="isRecurrent">{t("modal.fields.recurring.label")}</FieldLabel>
            </Field>
            {isRecurring && (
              <Controller
                name="recurrencePattern"
                control={control}
                rules={{
                  validate: (pattern, formValues) => {
                    if (!formValues.isRecurring) return true;
                    if (pattern.interval < 1) return tv("recurrenceInterval");
                    if (
                      pattern.frequency === "weekly" &&
                      (!pattern.daysOfWeek || pattern.daysOfWeek.length === 0)
                    ) {
                      return tv("recurrenceWeeklyDays");
                    }
                    return true;
                  },
                }}
                render={({ field }) => (
                  <RecurrencePatternPicker
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            )}
            {isRecurring && <FieldError errors={[errors.recurrencePattern]} />}
          </Stack>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSaving}>
                {tc("actions.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="size-4 animate-spin" />}
              {isSaving
                ? isEdit
                  ? tc("actions.saving")
                  : tc("actions.creating")
                : isEdit
                  ? t("modal.submit.edit")
                  : t("modal.submit.create")}
            </Button>
          </DialogFooter>
          </FieldGroup>
      </form>
        </DialogContent>
    </Dialog>
  );
}
