"use client";

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
import { useRef, useState } from "react";

interface NewIncomeModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function NewIncomeModal({ open, setOpen }: NewIncomeModalProps) {
  const { data: currenciesRes, isLoading: isLoadingCurr } = useQueryApi<{
    currencies?: { name: string; code: string }[];
  }>(
    API_ROUTES.CURRENCIES_METADATA,
    {
      queryKey: ["currencies"],
      hasToken: true,
    }
  );

  const { data: resourceRes, isLoading: isLoadingRes } = useQueryApi<{
    categories?: { id: number; name: string; code: string }[];
  }>(
    API_ROUTES.INCOME_CATEGORIES,
    {
      queryKey: ["income-categories"],
      hasToken: true,
    }
  );

  const currencyItems =
    currenciesRes?.currencies?.map((c) => c.code).filter(Boolean) ?? [];

  const resourceItems =
    resourceRes?.categories
      ?.map((c) => c.id)
      .filter((id): id is number => typeof id === "number") ?? [];
  const frequencyItems = [{name: "Daily", value: "d"}, {name: "Weekly", value: "w"}, {name: "Monthly", value: "m"}, {name: "Yearly", value: "y"}];
  const resourceDisplayName = (id: number | string) => {
    const parsed = typeof id === "number" ? id : Number(id);
    return resourceRes?.categories?.find((c) => c.id === parsed)?.name ?? `${id}`;
  };

  const currencyDisplayName = (code: string) =>
    currenciesRes?.currencies?.find((c) => c.code === code)?.name ?? code;

  const { canvas } = useCanvas();

  const { mutateAsync } = useMutationApi(
    API_ROUTES.CANVASES_INCOME_RESOURCES_CREATE(canvas ?? -1),
    {
      method: "post",
      // headers: {
      //   "Content-Type": "multipart/form-data",
      // },
      hasToken: true,
    }
  );

  const [isRecurrent, setIsRecurrent] = useState(false);
  const [name, setName] = useState("");
  const [currency, setCurr] = useState("");
  const [amount, setAmount] = useState(0);
  const [incomeResource, setIncomeResource] = useState<number | null>(null);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Create FormData with the image file
      const data = {
        name,
        currency,
        amount: Number(amount),
        isRecurrent,
        incomeResourceCategoryId: incomeResource ?? undefined,
        recurrenceFrequency,
        description,
        photoUrl: photo ? URL.createObjectURL(photo) : null,
      };

      // Send as JSON
      await mutateAsync(data);

      // Reset form and close dialog
      setName("");
      setCurr("");
      setAmount(0);
      setIncomeResource(null);
      setIsRecurrent(false);
      setRecurrenceFrequency("");
      setDescription('');
      setPhoto(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setOpen(false);
    } catch (error) {
      // Error is already handled by useMutationApi hook
      console.error("Error adding income:", error);
    }
  };

  // console.log(currencyItems, isLoadingCurr)

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
      <form onSubmit={handleSubmit}>
        <DialogContent className="w-full">
          <DialogHeader>
            <DialogTitle>Add New Income</DialogTitle>
            <DialogDescription>
              Enter the details below to track your income from various sources
              and assets. Keep your finances organized.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-row gap-5">
            <div className="w-1/2 flex flex-col gap-1">
              <Label htmlFor="name">Name</Label>
              <Input
                required
                id="name"
                name="name"
                onChange={(e) => {
                  setName(e.target.value);
                }}
              />
            </div>
            {/* todooooo: update this field to be autocomplete */}
            <div className="w-1/2 flex flex-col gap-1">
              <Label htmlFor="currency">Currency</Label>
              {/* <Input
                required
                id="currency"
                name="currency"
                onChange={(e) => {
                  setCurr(e.target.value);
                }}
              /> */}
              <Combobox
                items={currencyItems}
                value={currency}
                id="currency"
                disabled={isLoadingCurr}
                onValueChange={(val) => setCurr(val ?? "")}
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
            </div>
          </div>
          <div className="flex flex-row gap-5">
            <div className="w-1/2 flex flex-col gap-1">
              <Label htmlFor="amount">Amount</Label>
              <Input
                required
                id="amount"
                name="amount"
                type="number"
                onChange={(e) => {
                  setAmount(Number(e.target.value));
                }}
              />
            </div>
            <div className="w-1/2 flex flex-col gap-1">
              <Label htmlFor="income-resource">Income Resource</Label>
              <Combobox
                id="income-resource"
                items={resourceItems.map((id) => id.toString())}
                value={incomeResource !== null ? incomeResource.toString() : ""}
                disabled={isLoadingRes}
                onValueChange={(val) =>
                  setIncomeResource(val ? Number(val) : null)
                }
              >
                <ComboboxInput placeholder="Select a Resource" />
                <ComboboxContent className="z-[80]">
                  <ComboboxEmpty>No items found.</ComboboxEmpty>
                  <ComboboxCollection>
                    {(item) => (
                      <ComboboxItem key={item} value={item}>
                        {resourceDisplayName(item)}
                      </ComboboxItem>
                    )}
                  </ComboboxCollection>
                </ComboboxContent>
              </Combobox>
            </div>
          </div>
          <div className="flex flex-row gap-5 items-center">
            <div className="w-1/2 flex items-center gap-2">
              <Field orientation="horizontal" className="items-center">
                <Checkbox id="isRecurrent" name="isRecurrent" />
                <Label
                  htmlFor="isRecurrent"
                  onClick={() => {
                    setIsRecurrent((prev) => !prev);
                  }}
                >
                  Recurrent
                </Label>
              </Field>
            </div>
            {isRecurrent && (
                <div className="w-1/2 flex flex-col gap-1">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Combobox
                    id="frequency"
                    items={frequencyItems}
                    value={recurrenceFrequency}
                    onValueChange={(val) => setRecurrenceFrequency(val ?? "")}
                  >
                    <ComboboxInput placeholder="Select a Frequency" />
                    <ComboboxContent className="z-[80]">
                      <ComboboxEmpty>No items found.</ComboboxEmpty>
                      <ComboboxCollection>
                        {(item) => (
                          <ComboboxItem key={item.value} value={item.value}>
                            {item.name}
                          </ComboboxItem>
                        )}
                      </ComboboxCollection>
                    </ComboboxContent>
                  </Combobox>
                </div>
            )}
          </div>
          <div className="flex flex-row gap-5">
            <div className="w-full flex flex-col gap-1">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                onChange={(e) => {
                  setDescription(e.target.value);
                }}
              />
            </div>
          </div>
          <div className="flex flex-row gap-5">
            <div className="w-full flex flex-col gap-1">
              <Label htmlFor="photo-url">Photo</Label>
              <Input
                  ref={fileInputRef}
                  id="photo"
                  name="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="cursor-pointer"
                />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              disabled={!name || !currency || !amount}
              onClick={handleSubmit}
              type="submit"
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
