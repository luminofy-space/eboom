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
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface ExpenseFormData {
  name: string;
  expenseCategoryId: number | null;
  currencyId: number | null;
  description: string;
  isRecurring: boolean;
  recurrencePattern: RecurrencePattern;
  photo: File | null;
}

const defaultValues: ExpenseFormData = {
  name: "",
  expenseCategoryId: null,
  currencyId: null,
  description: "",
  isRecurring: false,
  recurrencePattern: DEFAULT_RECURRENCE_PATTERN,
  photo: null,
};

export function NewExpenseModal() {
  const dispatch = useAppDispatch();
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
        description: editingItem.description ?? "",
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
        description: formData.description,
        isRecurring: formData.isRecurring,
        recurrencePattern: formData.isRecurring ? formData.recurrencePattern : null,
        photoUrl: formData.photo ? URL.createObjectURL(formData.photo) : null,
      };

      if (isEdit) {
        await updateExpense(data);
      } else {
        await createExpense(data);
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
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Expense" : "Add New Expense"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update the details of your expense."
                : "Enter the details below to track a new expense. Keep your spending organized and on budget."}
            </DialogDescription>
          </DialogHeader>

          {/* Row 1: Name + Category */}
          <div className="flex flex-row gap-5">
            <div className="w-1/2 flex flex-col gap-1">
              <Label htmlFor="expense-name">Name</Label>
              <Input
                id="expense-name"
                placeholder="e.g. Monthly Rent"
                {...register("name", { required: true })}
              />
            </div>
            <div className="w-1/2 flex flex-col gap-1">
              <Label htmlFor="expense-category">Expense Category</Label>
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
                    <ComboboxInput placeholder="Select a category" />
                    <ComboboxContent className="z-[80]">
                      <ComboboxEmpty>No categories found.</ComboboxEmpty>
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
            </div>
          </div>

          {/* Row 2: Currency */}
          <div className="flex flex-row gap-5">
            <div className="w-1/2 flex flex-col gap-1">
              <Label htmlFor="expense-currency">Currency</Label>
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
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-row gap-5">
            <div className="w-full flex flex-col gap-1">
              <Label htmlFor="expense-description">Description</Label>
              <Input
                id="expense-description"
                placeholder="Optional notes about this expense"
                {...register("description")}
              />
            </div>
          </div>

          {/* Photo */}
          <div className="flex flex-row gap-5">
            <div className="w-full flex flex-col gap-1">
              <Label htmlFor="expense-photo">Photo</Label>
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
            </div>
          </div>

          {/* Recurring */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
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
                <Label htmlFor="expense-recurring">Recurring</Label>
              </Field>
            </div>
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
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              disabled={!name || !expenseCategoryId || currencyId === null}
              type="submit"
            >
              {isEdit ? "Save changes" : "Create Expense"}
            </Button>
          </DialogFooter>
      </form>
        </DialogContent>
    </Dialog>
  );
}
