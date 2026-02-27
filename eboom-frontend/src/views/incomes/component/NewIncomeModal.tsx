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
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  currency: string;
  amount: number;
  incomeResourceCategoryId: number | null;
  description: string;
  isRecurring: boolean;
  recurrencePattern: RecurrencePattern;
  photo: File | null;
}

const defaultValues: IncomeFormData = {
  name: "",
  currency: "",
  amount: 0,
  incomeResourceCategoryId: null,
  description: "",
  isRecurring: false,
  recurrencePattern: DEFAULT_RECURRENCE_PATTERN,
  photo: null,
};

export function NewIncomeModal() {
  const dispatch = useAppDispatch();
  const { open, mode, editingItem } = useAppSelector(selectIncomeModal);
  const isEdit = mode === "edit";

  const { register, handleSubmit, control, reset, watch, formState: { isValid } } = useForm<IncomeFormData>({
    defaultValues,
  });

  const isRecurring = watch("isRecurring");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: currenciesRes, isLoading: isLoadingCurr } = useQueryApi<{
    currencies?: { name: string; code: string }[];
  }>(
    API_ROUTES.CURRENCIES_METADATA,
    {
      queryKey: ["currencies"],
      hasToken: true,
      enabled: open,
    }
  );

  const { data: resourceRes, isLoading: isLoadingRes } = useQueryApi<{
    categories?: { id: number; name: string; code: string }[];
  }>(
    API_ROUTES.INCOME_CATEGORIES,
    {
      queryKey: ["income-categories"],
      hasToken: true,
      enabled: open,
    }
  );

  const currencyItems =
    currenciesRes?.currencies?.map((c) => c.code).filter(Boolean) ?? [];

  const resourceCategories = resourceRes?.categories ?? [];
  const resourceNames = resourceCategories.map((c) => c.name);
  const resourceNameToId = (name: string) =>
    resourceCategories.find((c) => c.name === name)?.id ?? null;
  const resourceIdToName = (id: number | null) =>
    id !== null ? resourceCategories.find((c) => c.id === id)?.name ?? "" : "";

  const currencyDisplayName = (code: string) =>
    currenciesRes?.currencies?.find((c) => c.code === code)?.name ?? code;

  const { canvas } = useCanvas();

  const { mutateAsync: createIncome } = useMutationApi(
    API_ROUTES.CANVASES_INCOME_RESOURCES_CREATE(canvas ?? -1),
    {
      method: "post",
      hasToken: true,
    }
  );

  const { mutateAsync: updateIncome } = useMutationApi(
    editingItem ? API_ROUTES.INCOME_RESOURCES_UPDATE(editingItem.id) : "",
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
        currency: editingItem.currency ?? "",
        amount: editingItem.amount ?? 0,
        incomeResourceCategoryId: editingItem.incomeResourceCategoryId ?? null,
        isRecurring: editingItem.isRecurring ?? false,
        recurrencePattern:
          (editingItem.recurrencePattern as RecurrencePattern) ?? DEFAULT_RECURRENCE_PATTERN,
        description: editingItem.description ?? "",
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
        currency: formData.currency,
        amount: Number(formData.amount),
        isRecurring: formData.isRecurring,
        incomeResourceCategoryId: formData.incomeResourceCategoryId ?? undefined,
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
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Income" : "Add New Income"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update the details of your income source."
                : "Enter the details below to track your income from various sources and assets. Keep your finances organized."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-row gap-5">
            <div className="w-1/2 flex flex-col gap-1">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...register("name", { required: true })}
              />
            </div>
            <div className="w-1/2 flex flex-col gap-1">
              <Label htmlFor="currency">Currency</Label>
              <Controller
                name="currency"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Combobox
                    items={currencyItems}
                    value={field.value}
                    id="currency"
                    disabled={isLoadingCurr}
                    onValueChange={(val) => field.onChange(val ?? "")}
                  >
                    <ComboboxInput placeholder="Select a currency" />
                    <ComboboxContent className="z-[80]">
                      <ComboboxEmpty>No items found.</ComboboxEmpty>
                      <ComboboxCollection>
                        {(item) => (
                          <ComboboxItem key={item} value={item}>
                            {currencyDisplayName(item)}
                          </ComboboxItem>
                        )}
                      </ComboboxCollection>
                    </ComboboxContent>
                  </Combobox>
                )}
              />
            </div>
          </div>
          <div className="flex flex-row gap-5">
            <div className="w-1/2 flex flex-col gap-1">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                {...register("amount", { required: true, valueAsNumber: true })}
              />
            </div>
            <div className="w-1/2 flex flex-col gap-1">
              <Label htmlFor="income-resource">Income Resource</Label>
              <Controller
                name="incomeResourceCategoryId"
                control={control}
                render={({ field }) => (
                  <Combobox
                    id="income-resource"
                    items={resourceNames}
                    value={resourceIdToName(field.value)}
                    disabled={isLoadingRes}
                    onValueChange={(val) =>
                      field.onChange(val ? resourceNameToId(val) : null)
                    }
                  >
                    <ComboboxInput placeholder="Select a Resource" />
                    <ComboboxContent className="z-[80]">
                      <ComboboxEmpty>No items found.</ComboboxEmpty>
                      <ComboboxCollection>
                        {(name) => (
                          <ComboboxItem key={name} value={name}>
                            {name}
                          </ComboboxItem>
                        )}
                      </ComboboxCollection>
                    </ComboboxContent>
                  </Combobox>
                )}
              />
            </div>
          </div>
          <div className="flex flex-row gap-5">
            <div className="w-full flex flex-col gap-1">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                {...register("description")}
              />
            </div>
          </div>
          <div className="flex flex-row gap-5">
            <div className="w-full flex flex-col gap-1">
              <Label htmlFor="photo">Photo</Label>
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
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
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
                <Label htmlFor="isRecurrent">Recurring</Label>
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
              disabled={!isValid}
              type="submit"
            >
              {isEdit ? "Save changes" : "Create Income"}
            </Button>
          </DialogFooter>
      </form>
        </DialogContent>
    </Dialog>
  );
}
