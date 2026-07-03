"use client";

import Link from "next/link";
import {
  DataTableSection,
  TableEntityCell,
  TableNotesCell,
  tableNotesCellClassName,
  type DataTableColumn,
} from "@/src/components/data-table";
import { TransactionStatusChip, type TransactionStatus } from "@/src/components/TransactionStatusChip";
import { Button } from "@/components/ui/button";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useCanvasPermissions } from "@/src/hooks/useCanvasPermissions";
import { formatAmount, formatDate } from "@/src/i18n/formatters";
import { NewExpensePaymentModal } from "@/src/views/expenses/components/NewExpensePaymentModal";
import dayjs from "dayjs";
import { Plus } from "lucide-react";
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

  const columns: DataTableColumn<CanvasTransactionsExpensePayment>[] = useMemo(
    () => [
      {
        id: "amount",
        header: tw("paymentsTable.headers.amount"),
        headerClassName: "w-[140px]",
        cellClassName: "font-medium tabular-nums",
        cell: (payment) => formatAmount(payment.amount, payment.currencySymbol, emDash),
      },
      {
        id: "expense",
        header: tw("paymentsTable.headers.expense"),
        cell: (payment) => (
          <TableEntityCell
            name={
              payment.expenseName ??
              t("payments.fallbackExpenseName", { expenseId: payment.expenseId })
            }
            caption={payment.categoryName}
          />
        ),
      },
      {
        id: "wallet",
        header: t("columns.wallet"),
        stopRowClick: true,
        cell: (payment) => (
          <Link
            href={`/wallet/${payment.sourceWalletId}`}
            className="text-primary hover:underline"
          >
            {payment.sourceWalletName}
          </Link>
        ),
      },
      {
        id: "due",
        header: tw("paymentsTable.headers.due"),
        cellClassName: "text-muted-foreground",
        cell: (payment) => formatDate(payment.dueDate, { fallback: emDash }),
      },
      {
        id: "paid",
        header: tw("paymentsTable.headers.paid"),
        cellClassName: "text-muted-foreground",
        cell: (payment) => formatDate(payment.paidDate, { fallback: emDash }),
      },
      {
        id: "status",
        header: tw("paymentsTable.headers.status"),
        cell: (payment) => {
          const status = getPaymentStatus(payment, tw);
          return <TransactionStatusChip status={status.status} label={status.label} />;
        },
      },
      {
        id: "notes",
        header: tw("paymentsTable.headers.notes"),
        headerClassName: "hidden md:table-cell",
        cellClassName: tableNotesCellClassName,
        cell: (payment) => <TableNotesCell notes={payment.notes} emptyLabel={emDash} />,
      },
    ],
    [t, tw, emDash]
  );

  return (
    <>
      <DataTableSection
        title={t("payments.title")}
        subtitle={t("payments.subtitle")}
        containerClassName="pb-6"
        count={
          payments.length > 0
            ? t("payments.count", {
                count: payments.length,
                unit: payments.length === 1 ? tc("plurals.payment") : tc("plurals.payments"),
              })
            : undefined
        }
        headerAction={
          canEdit ? (
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
          ) : undefined
        }
        columns={columns}
        data={payments}
        getRowKey={(payment) => payment.id}
        emptyMessage={t("payments.empty")}
        onRowClick={(payment) => router.push(`/expense/${payment.expenseId}`)}
        showActions={canEdit}
        actions={{
          onEdit: (payment) => {
            setEditingPayment(payment);
            setModalOpen(true);
          },
          onDelete: () => undefined,
          deleteDisabled: true,
        }}
      />

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
