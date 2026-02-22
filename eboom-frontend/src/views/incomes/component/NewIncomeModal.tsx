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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import API_ROUTES from "@/src/api/urls";
import { useMutationApi } from "@/src/api/useMutation";
import useQueryApi from "@/src/api/useQuery";
import GroupSelect, {
  TItem,
} from "@/src/components/groupe-select/GroupeSelect";
import { useState } from "react";

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

  const currencyItems =
    currenciesRes?.currencies?.map((c) => c.code).filter(Boolean) ?? [];

  const currencyDisplayName = (code: string) =>
    currenciesRes?.currencies?.find((c) => c.code === code)?.name ?? code;

  const { mutateAsync } = useMutationApi(
    API_ROUTES.INCOME_BASE,
    {
      method: "post",
      // headers: {
      //   "Content-Type": "multipart/form-data",
      // },
      hasToken: true,
    }
  );

  const [type, setType] = useState("o");
  const [name, setName] = useState("");
  const [currency, setCurr] = useState("");
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState<string | undefined>();


  const handleSelectType = (item: TItem) => {
    setType(item.key);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Create FormData with the image file
      const data = {
        name,
        currency,
        amount: Number(amount), // Ensure it's a number
        date: date || new Date().toISOString().split('T')[0], // Provide default if empty
        type
      };

      // Send as JSON
      await mutateAsync(data);

      // Reset form and close dialog
      setName("");
      setCurr("");
      setAmount(0);
      setDate(undefined);
      setType("o");
      setOpen(false);
    } catch (error) {
      // Error is already handled by useMutationApi hook
      console.error("Error adding income:", error);
    }
  };

  const items: TItem[] = [
    {
      key: "o",
      title: "One-time",
    },
    {
      key: "m",
      title: "Monthly",
    },
  ];

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
              <Label htmlFor="date">Date</Label>
              <Input
                required
                id="date"
                name="date"
                type="date"
                onChange={(e) => {
                  setDate(e.target.value);
                }}
              />
            </div>
          </div>
          <div className="flex flex-row gap-5">
            <GroupSelect
              items={items}
              handleSelect={handleSelectType}
              value={type}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              disabled={!name || !currency || !amount || !date}
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
