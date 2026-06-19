"use client";

import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Stack } from "@/components/ui/stack";
import API_ROUTES from "@/src/api/urls";
import { useMutationApi } from "@/src/api/useMutation";
import useQueryApi from "@/src/api/useQuery";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useAppDispatch, useAppSelector } from "@/src/redux/store";
import { selectExpenseModal, closeExpenseModal } from "@/src/redux/expenseSlice";
import { useEffect, useRef } from "react";
import {
  RecurrencePatternPicker,
  DEFAULT_RECURRENCE_PATTERN,
  type RecurrencePattern,
} from "@/src/components/RecurrencePatternPicker";
import { useTranslation } from "react-i18next";

interface ExpenseFormData {
  name: string;
  expenseCategoryId: number | null;
  currencyId: number | null;
  defaultWalletId: number | null;
  description: string;
  isRecurring: boolean;
  recurrencePattern: RecurrencePattern;
  photo: File | null;
}

const defaultValues: ExpenseFormData = {
  name: "",
  expenseCategoryId: null,
  currencyId: null,
  defaultWalletId: null,
  description: "",
  isRecurring: false,
  recurrencePattern: DEFAULT_RECURRENCE_PATTERN,
  photo: null,
};

interface NewExpenseModalProps {
  onCreateSuccess?: (entity: { id: number }) => void;
}

export function NewExpenseModal({ onCreateSuccess }: NewExpenseModalProps) {
  const dispatch = useAppDispatch();
  const { t } = useTranslation("expenses");
  const { t: tc } = useTranslation("common");
  const { open, mode, editingItem } = useAppSelector(selectExpenseModal);
  const isEdit = mode === "edit";
  const { canvas } = useCanvas();

  const { register, handleSubmit, control, reset, watch } = useForm<ExpenseFormData>({
    defaultValues,
  });

  const isRecurring = watch("isRecurring");
  const name = watch("name");
  const expenseCategoryId = watch("expenseCategoryId");
  const currencyId = watch("currencyId");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch expense categories
  const { data: categoriesRes, isLoading: isLoadingCategories } = useQueryApi<{
    categories?: { id: number; name: string }[];
  }>(API_ROUTES.EXPENSE_CATEGORIES, {
    queryKey: ["expense-categories"],
    hasToken: true,
    enabled: open,
  });

  // Fetch currencies
  const { data: currenciesRes, isLoading: isLoadingCurr } = useQueryApi<{
    currencies?: { id: number; name: string; code: string }[];
  }>(API_ROUTES.CURRENCIES_METADATA, {
    queryKey: ["currencies"],
    hasToken: true,
    enabled: open,
  });

  const categories = categoriesRes?.categories ?? [];
  const categoryNames = categories.map((c) => c.name);
  const categoryNameToId = (catName: string) =>
    categories.find((c) => c.name === catName)?.id ?? null;
  const categoryIdToName = (id: number | null) =>
    id !== null ? categories.find((c) => c.id === id)?.name ?? "" : "";

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

  // Mutations
  const { mutateAsync: createExpense } = useMutationApi(
    API_ROUTES.CANVASES_EXPENSES_CREATE(canvas ?? -1),
    {
      method: "post",
      hasToken: true,
    }
  );

  const { mutateAsync: updateExpense } = useMutationApi(
    editingItem ? API_ROUTES.EXPENSES_UPDATE(editingItem.id) : "",
    {
      method: "put",
      hasToken: true,
    }
  );

  // Populate form when editing, reset when creating
  useEffect(() => {
    if (open && isEdit && editingItem) {
      reset({
        name: editingItem.name ?? "",
        expenseCategoryId: editingItem.expenseCategoryId ?? null,
        currencyId: editingItem.currencyId ?? null,
        defaultWalletId: editingItem.defaultWalletId ?? editingItem.defaultWallet?.id ?? null,
        description: typeof editingItem.description === "string" ? editingItem.description : "",
        isRecurring: editingItem.isRecurring ?? false,
        recurrencePattern:
          (editingItem.recurrencePattern as RecurrencePattern) ?? DEFAULT_RECURRENCE_PATTERN,
        photo: null,
      });
    } else if (open && !isEdit) {
      reset(defaultValues);
    }
  }, [open, isEdit, editingItem, reset]);

  const handleClose = (openState: boolean) => {
    if (!openState) {
      dispatch(closeExpenseModal());
      reset(defaultValues);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const onSubmit = async (formData: ExpenseFormData) => {
    try {
      const data = {
        name: formData.name,
        expenseCategoryId: formData.expenseCategoryId,
        currencyId: formData.currencyId,
        defaultWalletId: formData.defaultWalletId,
        description: formData.description,
        isRecurring: formData.isRecurring,
        recurrencePattern: formData.isRecurring ? formData.recurrencePattern : null,
        photoUrl: formData.photo ? URL.createObjectURL(formData.photo) : null,
      };

      if (isEdit) {
        await updateExpense(data);
      } else {
        const response = await createExpense(data);
        const expenseId = (response as { expense?: { id: number } })?.expense?.id;
        if (typeof expenseId === "number") {
          onCreateSuccess?.({ id: expenseId });
        }
      }

      reset(defaultValues);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      dispatch(closeExpenseModal());
    } catch (error) {
      console.error("Error saving expense:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="w-full">
      <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup className="gap-4">
          <DialogHeader>
            <DialogTitle>{isEdit ? t("modal.edit.title") : t("modal.create.title")}</DialogTitle>
            <DialogDescription>
              {isEdit ? t("modal.edit.description") : t("modal.create.description")}
            </DialogDescription>
          </DialogHeader>

          <Stack direction="row" gap={5}>
            <Field className="flex-1">
              <FieldLabel htmlFor="expense-name">{t("modal.fields.name.label")}</FieldLabel>
              <Input
                id="expense-name"
                placeholder={t("modal.fields.name.placeholder")}
                {...register("name", { required: true })}
              />
            </Field>
            <Field className="flex-1">
              <FieldLabel htmlFor="expense-category">{t("modal.fields.expenseCategory.label")}</FieldLabel>
              <Controller
                name="expenseCategoryId"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Combobox
                    id="expense-category"
                    items={categoryNames}
                    value={categoryIdToName(field.value)}
                    disabled={isLoadingCategories}
                    onValueChange={(val) =>
                      field.onChange(val ? categoryNameToId(val) : null)
                    }
                  >
                    <ComboboxInput placeholder={tc("placeholders.selectCategory")} />
                    <ComboboxContent className="z-[80]">
                      <ComboboxEmpty>{tc("empty.noCategoriesFound")}</ComboboxEmpty>
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
            </Field>
          </Stack>

          <Stack direction="row" gap={5}>
            <Field className="flex-1">
              <FieldLabel htmlFor="expense-currency">{t("modal.fields.currency.label")}</FieldLabel>
              <Controller
                name="currencyId"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Combobox
                    items={currencyLabels}
                    value={currencyIdToLabel(field.value)}
                    id="expense-currency"
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
            </Field>
            <Field className="flex-1">
              <FieldLabel htmlFor="expense-default-wallet">{t("modal.fields.defaultWallet.label")}</FieldLabel>
              <Controller
                name="defaultWalletId"
                control={control}
                render={({ field }) => (
                  <Combobox
                    id="expense-default-wallet"
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
          </Stack>

          <Field>
            <FieldLabel htmlFor="expense-description">{t("modal.fields.description.label")}</FieldLabel>
            <Input
              id="expense-description"
              placeholder={t("modal.fields.description.placeholder")}
              {...register("description")}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="expense-photo">{t("modal.fields.photo.label")}</FieldLabel>
            <Controller
              name="photo"
              control={control}
              render={({ field }) => (
                <Input
                  ref={fileInputRef}
                  id="expense-photo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    field.onChange(file);
                  }}
                  className="cursor-pointer"
                />
              )}
            />
          </Field>

          <Stack gap={3}>
            <Field orientation="horizontal" className="items-center">
              <Controller
                name="isRecurring"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="expense-recurring"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(!!checked)}
                  />
                )}
              />
              <FieldLabel htmlFor="expense-recurring">{t("modal.fields.recurring.label")}</FieldLabel>
            </Field>
            {isRecurring && (
              <Controller
                name="recurrencePattern"
                control={control}
                render={({ field }) => (
                  <RecurrencePatternPicker
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            )}
          </Stack>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{tc("actions.cancel")}</Button>
            </DialogClose>
            <Button
              disabled={!name || !expenseCategoryId || currencyId === null}
              type="submit"
            >
              {isEdit ? t("modal.submit.edit") : t("modal.submit.create")}
            </Button>
          </DialogFooter>
          </FieldGroup>
      </form>
        </DialogContent>
    </Dialog>
  );
}
