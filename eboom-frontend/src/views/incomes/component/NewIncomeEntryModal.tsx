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
import { Textarea } from "@/components/ui/textarea";
import API_ROUTES from "@/src/api/urls";
import { useMutationApi } from "@/src/api/useMutation";
import useQueryApi from "@/src/api/useQuery";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

interface EntryFormData {
  amount: number;
  destinationWalletId: number | null;
  expectedDate: string;
  receivedDate: string;
  notes: string;
}

const defaultValues: EntryFormData = {
  amount: 0,
  destinationWalletId: null,
  expectedDate: "",
  receivedDate: "",
  notes: "",
};

interface NewIncomeEntryModalProps {
  incomeId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultWalletId?: number | null;
  incomeName?: string;
}

export function NewIncomeEntryModal({
  incomeId,
  open,
  onOpenChange,
  defaultWalletId,
  incomeName,
}: NewIncomeEntryModalProps) {
  const queryClient = useQueryClient();
  const { canvas } = useCanvas();

  const { register, handleSubmit, control, reset, watch } = useForm<EntryFormData>({
    defaultValues,
  });

  const amount = watch("amount");
  const destinationWalletId = watch("destinationWalletId");

  const { data: walletsRes, isLoading: isLoadingWallets } = useQueryApi<{
    wallets?: { id: number; name: string }[];
  }>(canvas ? API_ROUTES.CANVASES_WALLETS_LIST(canvas) : "", {
    queryKey: ["wallets", canvas],
    hasToken: true,
    enabled: open && !!canvas,
  });

  const wallets = walletsRes?.wallets ?? [];
  const walletNames = wallets.map((w) => w.name);
  const walletNameToId = (name: string) =>
    wallets.find((w) => w.name === name)?.id ?? null;
  const walletIdToName = (id: number | null) =>
    id !== null ? wallets.find((w) => w.id === id)?.name ?? "" : "";

  const { mutateAsync: createEntry, isPending } = useMutationApi(
    API_ROUTES.INCOME_ENTRIES_CREATE(incomeId),
    {
      method: "post",
      hasToken: true,
    }
  );

  useEffect(() => {
    if (open) {
      reset({
        ...defaultValues,
        destinationWalletId: defaultWalletId ?? null,
        receivedDate: new Date().toISOString().slice(0, 10),
      });
    }
  }, [open, defaultWalletId, reset]);

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset(defaultValues);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (formData: EntryFormData) => {
    try {
      await createEntry({
        destinationWalletId: formData.destinationWalletId,
        amount: Number(formData.amount),
        expectedDate: formData.expectedDate || null,
        receivedDate: formData.receivedDate || null,
        notes: formData.notes.trim() || null,
      });

      await queryClient.invalidateQueries({ queryKey: ["income-entries", incomeId] });
      reset(defaultValues);
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating income entry:", error);
    }
  };

  const isValid = amount > 0 && destinationWalletId !== null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Create Entry</DialogTitle>
            <DialogDescription>
              {incomeName
                ? `Record a payment received for ${incomeName}.`
                : "Record a payment received for this income source."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="entry-amount">Amount</Label>
              <Input
                id="entry-amount"
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                {...register("amount", { required: true, valueAsNumber: true, min: 0.01 })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="entry-wallet">Destination Wallet</Label>
              <Controller
                name="destinationWalletId"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Combobox
                    id="entry-wallet"
                    items={walletNames}
                    value={walletIdToName(field.value)}
                    disabled={isLoadingWallets}
                    onValueChange={(val) =>
                      field.onChange(val ? walletNameToId(val) : null)
                    }
                  >
                    <ComboboxInput placeholder="Select a wallet" />
                    <ComboboxContent className="z-[80]">
                      <ComboboxEmpty>No wallets found.</ComboboxEmpty>
                      <ComboboxCollection>
                        {(walletName) => (
                          <ComboboxItem key={walletName} value={walletName}>
                            {walletName}
                          </ComboboxItem>
                        )}
                      </ComboboxCollection>
                    </ComboboxContent>
                  </Combobox>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="entry-expected-date">Expected Date</Label>
                <Input
                  id="entry-expected-date"
                  type="date"
                  {...register("expectedDate")}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="entry-received-date">Received Date</Label>
                <Input
                  id="entry-received-date"
                  type="date"
                  {...register("receivedDate")}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="entry-notes">Notes</Label>
              <Textarea
                id="entry-notes"
                placeholder="Optional notes about this payment"
                rows={3}
                {...register("notes")}
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending || !isValid}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isPending ? "Creating..." : "Create Entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
