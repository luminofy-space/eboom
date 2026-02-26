"use client";

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
import { useRef, useState } from "react";
import {
  RecurrencePatternPicker,
  DEFAULT_RECURRENCE_PATTERN,
  type RecurrencePattern,
} from "@/src/components/RecurrencePatternPicker";

interface NewExpenseModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function NewExpenseModal({ open, setOpen }: NewExpenseModalProps) {
  const { canvas } = useCanvas();
  console.log(canvas)

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
  const categoryNameToId = (name: string) =>
    categories.find((c) => c.name === name)?.id ?? null;
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

  console.log(canvas)

  // Mutation
  const { mutateAsync } = useMutationApi(
    API_ROUTES.CANVASES_EXPENSES_CREATE(canvas ?? -1),
    {
      method: "post",
      hasToken: true,
    }
  );

  // Form state
  const [name, setName] = useState("");
  const [expenseCategoryId, setExpenseCategoryId] = useState<number | null>(null);
  const [currencyId, setCurrencyId] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern>(
    DEFAULT_RECURRENCE_PATTERN
  );
  const [photo, setPhoto] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('here')
    e.preventDefault();

    try {
      const data = {
        name,
        expenseCategoryId,
        currencyId,
        description,
        isRecurring,
        recurrencePattern: isRecurring ? recurrencePattern : null,
        photoUrl: photo ? URL.createObjectURL(photo) : null,
      };

      await mutateAsync(data);

      // Reset form
      setName("");
      setExpenseCategoryId(null);
      setCurrencyId(null);
      setDescription("");
      setIsRecurring(false);
      setRecurrencePattern(DEFAULT_RECURRENCE_PATTERN);
      setPhoto(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setOpen(false);
    } catch (error) {
      console.error("Error creating expense:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
        <DialogContent className="w-full">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
            <DialogDescription>
              Enter the details below to track a new expense. Keep your spending
              organized and on budget.
            </DialogDescription>
          </DialogHeader>

          {/* Row 1: Name + Category */}
          <div className="flex flex-row gap-5">
            <div className="w-1/2 flex flex-col gap-1">
              <Label htmlFor="expense-name">Name</Label>
              <Input
                required
                id="expense-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Monthly Rent"
              />
            </div>
            <div className="w-1/2 flex flex-col gap-1">
              <Label htmlFor="expense-category">Expense Category</Label>
              <Combobox
                id="expense-category"
                items={categoryNames}
                value={categoryIdToName(expenseCategoryId)}
                disabled={isLoadingCategories}
                onValueChange={(val) =>
                  setExpenseCategoryId(val ? categoryNameToId(val) : null)
                }
              >
                <ComboboxInput placeholder="Select a category" />
                <ComboboxContent className="z-[80]">
                  <ComboboxEmpty>No categories found.</ComboboxEmpty>
                  <ComboboxCollection>
                    {(name) => (
                      <ComboboxItem key={name} value={name}>
                        {name}
                      </ComboboxItem>
                    )}
                  </ComboboxCollection>
                </ComboboxContent>
              </Combobox>
            </div>
          </div>

          {/* Row 2: Currency */}
          <div className="flex flex-row gap-5">
            <div className="w-1/2 flex flex-col gap-1">
              <Label htmlFor="expense-currency">Currency</Label>
              <Combobox
                items={currencyLabels}
                value={currencyIdToLabel(currencyId)}
                id="expense-currency"
                disabled={isLoadingCurr}
                onValueChange={(val) =>
                  setCurrencyId(val ? currencyLabelToId(val) : null)
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
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-row gap-5">
            <div className="w-full flex flex-col gap-1">
              <Label htmlFor="expense-description">Description</Label>
              <Input
                id="expense-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional notes about this expense"
              />
            </div>
          </div>

          {/* Photo */}
          <div className="flex flex-row gap-5">
            <div className="w-full flex flex-col gap-1">
              <Label htmlFor="expense-photo">Photo</Label>
              <Input
                ref={fileInputRef}
                id="expense-photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="cursor-pointer"
              />
            </div>
          </div>

          {/* Recurring */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Field orientation="horizontal" className="items-center">
                <Checkbox
                  id="expense-recurring"
                  checked={isRecurring}
                  onCheckedChange={(checked) => setIsRecurring(!!checked)}
                />
                <Label htmlFor="expense-recurring">Recurring</Label>
              </Field>
            </div>
            {isRecurring && (
              <RecurrencePatternPicker
                value={recurrencePattern}
                onChange={setRecurrencePattern}
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
              Create Expense
            </Button>
          </DialogFooter>
      </form>
        </DialogContent>
    </Dialog>
  );
}
