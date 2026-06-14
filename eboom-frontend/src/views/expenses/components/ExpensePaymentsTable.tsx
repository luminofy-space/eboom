"use client";

import API_ROUTES from "@/src/api/urls";
import useQueryApi from "@/src/api/useQuery";
import { ConfirmDeleteDialog } from "@/src/components/ConfirmDeleteDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import dayjs from "dayjs";
import { MoreVertical, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { NewExpensePaymentModal } from "./NewExpensePaymentModal";

interface WalletCategory {
  id: number;
  name: string;
}

interface SourceWallet {
  id: number;
  name: string;
  category?: WalletCategory | null;
}

export interface ExpensePayment {
  id: number;
  expenseId: number;
  sourceWalletId: number;
  amount: string;
  dueDate: string | null;
  paidDate: string | null;
  notes: string | null;
  createdAt: string;
  sourceWallet: SourceWallet | null;
}

interface ExpensePaymentsTableProps {
  expenseId: number;
}

const hasWindow = typeof window !== "undefined";

function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  return dayjs(date).format("MMM D, YYYY");
}

function formatAmount(amount: string | number, symbol?: string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (Number.isNaN(num)) return "—";
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  }).format(num);
  return symbol ? `${symbol}${formatted}` : formatted;
}

function getPaymentStatus(payment: ExpensePayment): {
  label: string;
  variant: "default" | "secondary" | "outline";
} {
  if (payment.paidDate) {
    return { label: "Paid", variant: "default" };
  }
  if (payment.dueDate && dayjs(payment.dueDate).isAfter(dayjs(), "day")) {
    return { label: "Due", variant: "secondary" };
  }
  return { label: "Unpaid", variant: "outline" };
}

function sortPayments(payments: ExpensePayment[]): ExpensePayment[] {
  return [...payments].sort((a, b) => {
    const dateA = a.paidDate ?? a.dueDate ?? a.createdAt;
    const dateB = b.paidDate ?? b.dueDate ?? b.createdAt;
    return dayjs(dateB).valueOf() - dayjs(dateA).valueOf();
  });
}

export function ExpensePaymentsTable({ expenseId }: ExpensePaymentsTableProps) {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: expenseRes, isLoading: isLoadingExpense } = useQueryApi<{
    expense: {
      id: number;
      name: string;
      currencyId: number;
      defaultWalletId: number | null;
      defaultWallet?: { id: number; name: string } | null;
      currency?: { id: number; symbol: string } | null;
    };
  }>(API_ROUTES.EXPENSES_GET(expenseId), {
    queryKey: ["expense", expenseId],
    enabled: !!expenseId,
  });

  const { data: currenciesRes } = useQueryApi<{
    currencies?: { id: number; code: string; symbol: string }[];
  }>(API_ROUTES.CURRENCIES_METADATA, {
    queryKey: ["currencies"],
  });

  const {
    data: paymentsRes,
    isLoading: isLoadingPayments,
    isError,
  } = useQueryApi<{ payments: ExpensePayment[] }>(
    API_ROUTES.EXPENSE_PAYMENTS_LIST(expenseId),
    {
      queryKey: ["expense-payments", expenseId],
      enabled: !!expenseId,
    }
  );

  const { mutate: deletePayment, isPending: isDeleting } = useMutation({
    mutationFn: async (id: number) => {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}${API_ROUTES.EXPENSE_PAYMENTS_DELETE(id)}`;
      const token = hasWindow ? window.localStorage.getItem("accessToken") : null;
      await axios.delete(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    },
    onSuccess: () => {
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["expense-payments", expenseId] });
    },
  });

  const currencySymbol = useMemo(() => {
    const fromExpense = expenseRes?.expense?.currency?.symbol;
    if (fromExpense) return fromExpense;

    const currencyId = expenseRes?.expense?.currencyId;
    if (!currencyId) return undefined;
    return currenciesRes?.currencies?.find((c) => c.id === currencyId)?.symbol;
  }, [
    expenseRes?.expense?.currency?.symbol,
    expenseRes?.expense?.currencyId,
    currenciesRes?.currencies,
  ]);

  const payments = useMemo(
    () => sortPayments(paymentsRes?.payments ?? []),
    [paymentsRes?.payments]
  );

  const totalPaid = useMemo(
    () =>
      payments
        .filter((p) => p.paidDate)
        .reduce((sum, p) => sum + parseFloat(p.amount), 0),
    [payments]
  );

  const isLoading = isLoadingExpense || isLoadingPayments;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <Skeleton className="h-7 w-48" />
        <div className="overflow-hidden rounded-lg border">
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="px-4 lg:px-6">
        <p className="text-muted-foreground text-sm">
          Failed to load expense payments. Please try again.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Payments</h2>
            {expenseRes?.expense?.name && (
              <p className="text-muted-foreground text-sm">
                Payment history for {expenseRes.expense.name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {payments.length > 0 && (
              <p className="text-muted-foreground hidden text-sm tabular-nums sm:block">
                {payments.length} {payments.length === 1 ? "payment" : "payments"}
              </p>
            )}
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Create Payment
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[140px]">Amount</TableHead>
                <TableHead>Wallet</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Notes</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <p className="text-muted-foreground">
                      No payments yet. Record a payment to track expenses paid.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => {
                  const status = getPaymentStatus(payment);
                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium tabular-nums">
                        {formatAmount(payment.amount, currencySymbol)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{payment.sourceWallet?.name ?? "—"}</span>
                          {payment.sourceWallet?.category?.name && (
                            <span className="text-muted-foreground text-xs">
                              {payment.sourceWallet.category.name}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(payment.dueDate)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(payment.paidDate)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="hidden max-w-[200px] truncate md:table-cell">
                        {payment.notes ? (
                          <span title={payment.notes}>{payment.notes}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground size-8"
                            >
                              <MoreVertical className="size-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteId(payment.id)}
                            >
                              <Trash2 className="size-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
            {payments.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell className="font-semibold tabular-nums">
                    {formatAmount(totalPaid, currencySymbol)}
                  </TableCell>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    Total paid
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
      </div>

      <ConfirmDeleteDialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        onConfirm={() => {
          if (deleteId !== null) deletePayment(deleteId);
        }}
        isDeleting={isDeleting}
      />

      <NewExpensePaymentModal
        expenseId={expenseId}
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultWalletId={
          expenseRes?.expense?.defaultWalletId ??
          expenseRes?.expense?.defaultWallet?.id
        }
        expenseName={expenseRes?.expense?.name}
      />
    </>
  );
}
