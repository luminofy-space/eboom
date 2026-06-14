"use client";

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
import dayjs from "dayjs";
import { MoreVertical, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { useWalletDetail } from "../hooks/useWalletDetail";

interface WalletPayment {
  id: number;
  expenseId: number;
  sourceWalletId: number;
  amount: string;
  dueDate: string | null;
  paidDate: string | null;
  notes: string | null;
  createdAt: string;
}

interface WalletPaymentsTableProps {
  walletId: number;
  currencySymbol?: string;
}

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

function getPaymentStatus(payment: WalletPayment): {
  label: string;
  variant: "default" | "secondary" | "outline" | "destructive";
} {
  if (payment.paidDate) {
    return { label: "Paid", variant: "default" };
  }
  if (payment.dueDate && dayjs(payment.dueDate).isBefore(dayjs(), "day")) {
    return { label: "Overdue", variant: "destructive" };
  }
  if (payment.dueDate && dayjs(payment.dueDate).isAfter(dayjs(), "day")) {
    return { label: "Due", variant: "secondary" };
  }
  return { label: "Pending", variant: "outline" };
}

function sortPayments(payments: WalletPayment[]): WalletPayment[] {
  return [...payments].sort((a, b) => {
    const dateA = a.paidDate ?? a.dueDate ?? a.createdAt;
    const dateB = b.paidDate ?? b.dueDate ?? b.createdAt;
    return dayjs(dateB).valueOf() - dayjs(dateA).valueOf();
  });
}

export function WalletPaymentsTable({
  walletId,
  currencySymbol,
}: WalletPaymentsTableProps) {
  const {payments: paymentsRes, isLoading, isError} = useWalletDetail(walletId);

  const payments = useMemo(
    () => sortPayments(paymentsRes ?? []),
    [paymentsRes]
  );

  const totalPaid = useMemo(
    () =>
      payments
        .filter((p) => p.paidDate)
        .reduce((sum, p) => sum + parseFloat(p.amount), 0),
    [payments]
  );

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
    <div className="flex flex-col gap-4 px-4 lg:px-6 pb-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Expense Payments</h2>
          <p className="text-muted-foreground text-sm">
            Outgoing transactions from this wallet
          </p>
        </div>
        {payments.length > 0 && (
          <p className="text-muted-foreground hidden text-sm tabular-nums sm:block">
            {payments.length} {payments.length === 1 ? "payment" : "payments"}
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[140px]">Amount</TableHead>
              <TableHead>Expense</TableHead>
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
                    No expense payments yet. Create a new expense to track outgoing payments.
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
                      <span>Expense #{payment.expenseId}</span>
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
                          <DropdownMenuItem variant="destructive" disabled>
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
  );
}