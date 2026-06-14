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
import { Container } from "@/components/ui/container";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
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
import { MoreVertical, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { NewExpensePaymentModal } from "@/src/views/expenses/components/NewExpensePaymentModal";
import { useWalletDetail } from "../hooks/useWalletDetail";
import type { WalletPayment } from "../utils/utils";

interface WalletPaymentsTableProps {
  walletId: number;
  walletName?: string;
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
  walletName,
  currencySymbol,
}: WalletPaymentsTableProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const { payments: paymentsRes, isLoading, isError } = useWalletDetail(walletId);

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
      <Container>
        <Stack gap={4}>
          <Skeleton className="h-7 w-48" />
          <div className="overflow-hidden rounded-lg border">
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        </Stack>
      </Container>
    );
  }

  if (isError) {
    return (
      <Container>
        <Typography variant="muted-sm">
          Failed to load expense payments. Please try again.
        </Typography>
      </Container>
    );
  }

  return (
    <>
      <Container className="pb-6">
        <Stack gap={4}>
        <Stack direction="row" align="center" justify="between" gap={4}>
          <div>
            <Typography variant="heading">Expense Payments</Typography>
            <Typography variant="muted-sm">
              Outgoing transactions from this wallet
            </Typography>
          </div>
          <Stack direction="row" align="center" gap={3}>
            {payments.length > 0 && (
              <Typography variant="count" className="hidden sm:block">
                {payments.length} {payments.length === 1 ? "payment" : "payments"}
              </Typography>
            )}
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Create Payment
            </Button>
          </Stack>
        </Stack>

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
                    No expense payments yet. Create a payment to record outgoing funds.
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
                        <span>{payment.expenseName ?? `Expense #${payment.expenseId}`}</span>
                        {payment.categoryName && (
                          <Typography variant="caption">{payment.categoryName}</Typography>
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
        </Stack>
      </Container>

      <NewExpensePaymentModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        fixedSourceWalletId={walletId}
        walletName={walletName}
        extraInvalidateKeys={[["wallet-payments", walletId], ["wallet", walletId]]}
      />
    </>
  );
}