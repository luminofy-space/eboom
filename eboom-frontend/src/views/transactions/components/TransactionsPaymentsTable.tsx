"use client";

import Link from "next/link";
import { TransactionStatusChip, type TransactionStatus } from "@/src/components/TransactionStatusChip";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Container } from "@/components/ui/container";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useCanvasPermissions } from "@/src/hooks/useCanvasPermissions";
import { formatAmount, formatDate } from "@/src/i18n/formatters";
import { NewExpensePaymentModal } from "@/src/views/expenses/components/NewExpensePaymentModal";
import dayjs from "dayjs";
import { MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import type { CanvasTransactionsExpensePayment } from "../types";

interface TransactionsPaymentsTableProps {
  payments: CanvasTransactionsExpensePayment[];
}

function getPaymentStatus(payment: CanvasTransactionsExpensePayment, t: TFunction<"wallets">): {
  label: string;
  status: TransactionStatus;
} {
  if (payment.paidDate) {
    return { label: t("status.paid"), status: "paid" };
  }
  if (payment.dueDate && dayjs(payment.dueDate).isBefore(dayjs(), "day")) {
    return { label: t("status.overdue"), status: "overdue" };
  }
  if (payment.dueDate && dayjs(payment.dueDate).isAfter(dayjs(), "day")) {
    return { label: t("status.due"), status: "due" };
  }
  return { label: t("status.pending"), status: "pending" };
}

function sortPayments(
  payments: CanvasTransactionsExpensePayment[]
): CanvasTransactionsExpensePayment[] {
  return [...payments].sort((a, b) => {
    const dateA = a.paidDate ?? a.dueDate ?? a.createdAt;
    const dateB = b.paidDate ?? b.dueDate ?? b.createdAt;
    return dayjs(dateB).valueOf() - dayjs(dateA).valueOf();
  });
}

export function TransactionsPaymentsTable({ payments: paymentsProp }: TransactionsPaymentsTableProps) {
  const { t } = useTranslation("transactions");
  const { t: tw } = useTranslation("wallets");
  const { t: tc } = useTranslation("common");
  const { canvas } = useCanvas();
  const { canEdit } = useCanvasPermissions();
  const router = useRouter();
  const emDash = tc("empty.emDash");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<CanvasTransactionsExpensePayment | null>(null);

  const payments = useMemo(() => sortPayments(paymentsProp), [paymentsProp]);

  const invalidateKeys = useMemo(
    () =>
      canvas
        ? [
            ["canvas-transactions", canvas],
            ["canvas-summary", canvas],
          ]
        : [],
    [canvas]
  );

  return (
    <>
      <Container className="pb-6">
        <Stack gap={4}>
          <Stack direction="row" align="center" justify="between" gap={4}>
            <div>
              <Typography variant="heading">{t("payments.title")}</Typography>
              <Typography variant="muted-sm">{t("payments.subtitle")}</Typography>
            </div>
            <Stack direction="row" align="center" gap={3}>
              {payments.length > 0 && (
                <Typography variant="count" className="hidden sm:block">
                  {t("payments.count", {
                    count: payments.length,
                    unit: payments.length === 1 ? tc("plurals.payment") : tc("plurals.payments"),
                  })}
                </Typography>
              )}
              {canEdit && (
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingPayment(null);
                    setModalOpen(true);
                  }}
                >
                  <Plus className="size-4" />
                  {t("payments.createPayment")}
                </Button>
              )}
            </Stack>
          </Stack>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[140px]">{tw("paymentsTable.headers.amount")}</TableHead>
                  <TableHead>{tw("paymentsTable.headers.expense")}</TableHead>
                  <TableHead>{t("columns.wallet")}</TableHead>
                  <TableHead>{tw("paymentsTable.headers.due")}</TableHead>
                  <TableHead>{tw("paymentsTable.headers.paid")}</TableHead>
                  <TableHead>{tw("paymentsTable.headers.status")}</TableHead>
                  <TableHead className="hidden md:table-cell">{tw("paymentsTable.headers.notes")}</TableHead>
                  {canEdit && <TableHead className="w-10" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canEdit ? 8 : 7} className="h-24 text-center">
                      <p className="text-muted-foreground">{t("payments.empty")}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => {
                    const status = getPaymentStatus(payment, tw);
                    return (
                      <TableRow
                        key={payment.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/expense/${payment.expenseId}`)}
                      >
                        <TableCell className="font-medium tabular-nums">
                          {formatAmount(payment.amount, payment.currencySymbol, emDash)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>
                              {payment.expenseName ??
                                t("payments.fallbackExpenseName", { expenseId: payment.expenseId })}
                            </span>
                            {payment.categoryName && (
                              <Typography variant="caption">{payment.categoryName}</Typography>
                            )}
                          </div>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Link
                            href={`/wallet/${payment.sourceWalletId}`}
                            className="text-primary hover:underline"
                          >
                            {payment.sourceWalletName}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(payment.dueDate, { fallback: emDash })}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(payment.paidDate, { fallback: emDash })}
                        </TableCell>
                        <TableCell>
                          <TransactionStatusChip status={status.status} label={status.label} />
                        </TableCell>
                        <TableCell className="hidden max-w-[200px] truncate md:table-cell">
                          {payment.notes ? (
                            <span title={payment.notes}>{payment.notes}</span>
                          ) : (
                            <span className="text-muted-foreground">{emDash}</span>
                          )}
                        </TableCell>
                        {canEdit && (
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground size-8"
                                >
                                  <MoreVertical className="size-4" />
                                  <span className="sr-only">{tc("actions.openMenu")}</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingPayment(payment);
                                    setModalOpen(true);
                                  }}
                                >
                                  <Pencil className="size-4" />
                                  {tc("actions.edit")}
                                </DropdownMenuItem>
                                <DropdownMenuItem variant="destructive" disabled>
                                  <Trash2 className="size-4" />
                                  {tc("actions.delete")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Stack>
      </Container>

      <NewExpensePaymentModal
        expenseId={editingPayment?.expenseId}
        paymentId={editingPayment?.id}
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingPayment(null);
        }}
        extraInvalidateKeys={invalidateKeys}
      />
    </>
  );
}
