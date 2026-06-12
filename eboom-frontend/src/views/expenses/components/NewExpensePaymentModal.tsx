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

interface PaymentFormData {
  amount: number;
  sourceWalletId: number | null;
  dueDate: string;
  paidDate: string;
  notes: string;
}

const defaultValues: PaymentFormData = {
  amount: 0,
  sourceWalletId: null,
  dueDate: "",
  paidDate: "",
  notes: "",
};

interface NewExpensePaymentModalProps {
  expenseId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultWalletId?: number | null;
  expenseName?: string;
}

export function NewExpensePaymentModal({
  expenseId,
  open,
  onOpenChange,
  defaultWalletId,
  expenseName,
}: NewExpensePaymentModalProps) {
  const queryClient = useQueryClient();
  const { canvas } = useCanvas();

  const { register, handleSubmit, control, reset, watch } = useForm<PaymentFormData>({
    defaultValues,
  });

  const amount = watch("amount");
  const sourceWalletId = watch("sourceWalletId");

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

  const { mutateAsync: createPayment, isPending } = useMutationApi(
    API_ROUTES.EXPENSE_PAYMENTS_CREATE(expenseId),
    {
      method: "post",
      hasToken: true,
    }
  );

  useEffect(() => {
    if (open) {
      reset({
        ...defaultValues,
        sourceWalletId: defaultWalletId ?? null,
        paidDate: new Date().toISOString().slice(0, 10),
      });
    }
  }, [open, defaultWalletId, reset]);

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset(defaultValues);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (formData: PaymentFormData) => {
    try {
      await createPayment({
        sourceWalletId: formData.sourceWalletId,
        amount: Number(formData.amount),
        dueDate: formData.dueDate || null,
        paidDate: formData.paidDate || null,
        notes: formData.notes.trim() || null,
      });

      await queryClient.invalidateQueries({ queryKey: ["expense-payments", expenseId] });
      reset(defaultValues);
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating expense payment:", error);
    }
  };

  const isValid = amount > 0 && sourceWalletId !== null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Create Payment</DialogTitle>
            <DialogDescription>
              {expenseName
                ? `Record a payment made for ${expenseName}.`
                : "Record a payment made for this expense."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="payment-amount">Amount</Label>
              <Input
                id="payment-amount"
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                {...register("amount", { required: true, valueAsNumber: true, min: 0.01 })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="payment-wallet">Source Wallet</Label>
              <Controller
                name="sourceWalletId"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Combobox
                    id="payment-wallet"
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
                <Label htmlFor="payment-due-date">Due Date</Label>
                <Input
                  id="payment-due-date"
                  type="date"
                  {...register("dueDate")}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="payment-paid-date">Paid Date</Label>
                <Input
                  id="payment-paid-date"
                  type="date"
                  {...register("paidDate")}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="payment-notes">Notes</Label>
              <Textarea
                id="payment-notes"
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
              {isPending ? "Creating..." : "Create Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
