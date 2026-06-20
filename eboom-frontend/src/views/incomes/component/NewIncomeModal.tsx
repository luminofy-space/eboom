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
import { selectIncomeModal, closeIncomeModal } from "@/src/redux/incomeSlice";
import { useEffect, useRef } from "react";
import {
  RecurrencePatternPicker,
  DEFAULT_RECURRENCE_PATTERN,
  type RecurrencePattern,
} from "@/src/components/RecurrencePatternPicker";

interface IncomeFormData {
  name: string;
  currencyId: number | null;
  amount: number;
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
  amount: 0,
  incomeCategoryId: null,
  defaultWalletId: null,
  description: "",
  isRecurring: false,
  recurrencePattern: DEFAULT_RECURRENCE_PATTERN,
  photo: null,
};

export function NewIncomeModal() {
  const dispatch = useAppDispatch();
  const { open, mode, editingItem } = useAppSelector(selectIncomeModal);
  const isEdit = mode === "edit";

  const { register, handleSubmit, control, reset, watch } = useForm<IncomeFormData>({
    defaultValues,
  });

  const isRecurring = watch("isRecurring");
  const name = watch("name");
  const currencyId = watch("currencyId");
  const incomeCategoryId = watch("incomeCategoryId");
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

  const { canvas } = useCanvas();

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

  const { mutateAsync: createIncome } = useMutationApi(
    API_ROUTES.CANVASES_INCOMES_CREATE(canvas ?? -1),
    {
      method: "post",
      hasToken: true,
    }
  );

  const { mutateAsync: updateIncome } = useMutationApi(
    editingItem ? API_ROUTES.INCOMES_UPDATE(editingItem.id) : "",
    {
      method: "put",
      hasToken: true,
    }
  );

  useEffect(() => {
    if (open && isEdit && editingItem) {
      reset({
        name: editingItem.name ?? "",
        currencyId: editingItem.currencyId ?? editingItem.currency?.id ?? null,
        amount: editingItem.amount ?? 0,
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
  }, [open, isEdit, editingItem, reset]);

  const handleClose = (openState: boolean) => {
    if (!openState) {
      dispatch(closeIncomeModal());
      reset(defaultValues);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const onSubmit = async (formData: IncomeFormData) => {
    try {
      const data = {
        name: formData.name,
        currencyId: formData.currencyId,
        amount: Number(formData.amount),
        isRecurring: formData.isRecurring,
        incomeCategoryId: formData.incomeCategoryId ?? undefined,
        defaultWalletId: formData.defaultWalletId,
        recurrencePattern: formData.isRecurring ? formData.recurrencePattern : null,
        description: formData.description,
        photoUrl: formData.photo ? URL.createObjectURL(formData.photo) : null,
      };

      if (isEdit) {
        await updateIncome(data);
      } else {
        await createIncome(data);
      }

      reset(defaultValues);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      dispatch(closeIncomeModal());
    } catch (error) {
      console.error("Error saving income:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="w-full">
      <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup className="gap-4">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Income" : "Add New Income"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update the details of your income source."
                : "Enter the details below to track your income from various sources. Keep your finances organized."}
            </DialogDescription>
          </DialogHeader>
          <Stack direction="row" gap={5}>
            <Field className="flex-1">
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                {...register("name", { required: true })}
              />
            </Field>
            <Field className="flex-1">
              <FieldLabel htmlFor="currency">Currency</FieldLabel>
              <Controller
                name="currencyId"
                control={control}
                rules={{ required: true }}
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
                    <ComboboxInput placeholder="Select a currency" />
                    <ComboboxContent className="z-[80]">
                      <ComboboxEmpty>No items found.</ComboboxEmpty>
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
          </Stack>
          <Stack direction="row" gap={5}>
            <Field className="flex-1">
              <FieldLabel htmlFor="amount">Amount</FieldLabel>
              <Input
                id="amount"
                type="number"
                {...register("amount", { required: true, valueAsNumber: true })}
              />
            </Field>
            <Field className="flex-1">
              <FieldLabel htmlFor="income-category">Income Category</FieldLabel>
              <Controller
                name="incomeCategoryId"
                control={control}
                rules={{ required: true }}
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
                    <ComboboxInput placeholder="Select a category" />
                    <ComboboxContent className="z-[80]">
                      <ComboboxEmpty>No items found.</ComboboxEmpty>
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
          <Field>
            <FieldLabel htmlFor="default-wallet">Default Wallet (optional)</FieldLabel>
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
                  <ComboboxInput placeholder={isLoadingWallets ? "Loading wallets..." : "Select a default wallet"} />
                  <ComboboxContent className="z-[80]">
                    <ComboboxEmpty>No wallets found.</ComboboxEmpty>
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
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Input
              id="description"
              {...register("description")}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="photo">Photo</FieldLabel>
            <Controller
              name="photo"
              control={control}
              render={({ field }) => (
                <Input
                  ref={fileInputRef}
                  id="photo"
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
                    id="isRecurrent"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(!!checked)}
                  />
                )}
              />
              <FieldLabel htmlFor="isRecurrent">Recurring</FieldLabel>
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
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              disabled={!name || currencyId === null || !incomeCategoryId}
              type="submit"
            >
              {isEdit ? "Save changes" : "Create Income"}
            </Button>
          </DialogFooter>
          </FieldGroup>
      </form>
        </DialogContent>
    </Dialog>
  );
}
