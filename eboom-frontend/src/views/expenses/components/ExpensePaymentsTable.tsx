"use client";

import API_ROUTES from "@/src/api/urls";
import { useMutationApi } from "@/src/api/useMutation";
import { ConfirmDeleteDialog } from "@/src/components/ConfirmDeleteDialog";
import {
  DataTableSection,
  TableEntityCell,
  TableNotesCell,
  tableNotesCellClassName,
  type DataTableColumn,
} from "@/src/components/data-table";
import { useExpenseDetail } from "../hooks/useExpenseDetail";
import { TransactionStatusChip, type TransactionStatus } from "@/src/components/TransactionStatusChip";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { NewExpensePaymentModal } from "./NewExpensePaymentModal";
import { useTranslation } from "react-i18next";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useCanvasPermissions } from "@/src/hooks/useCanvasPermissions";
import type { TFunction } from "i18next";
import { formatAmount, formatDate } from "@/src/i18n/formatters";

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

function getPaymentStatus(payment: ExpensePayment, t: TFunction<"expenses">): {
  label: string;
  status: TransactionStatus;
} {
  if (payment.paidDate) {
    return { label: t("status.paid"), status: "paid" };
  }
  if (payment.dueDate && dayjs(payment.dueDate).isAfter(dayjs(), "day")) {
    return { label: t("status.due"), status: "due" };
  }
  return { label: t("status.unpaid"), status: "unpaid" };
}

function sortPayments(payments: ExpensePayment[]): ExpensePayment[] {
  return [...payments].sort((a, b) => {
    const dateA = a.paidDate ?? a.dueDate ?? a.createdAt;
    const dateB = b.paidDate ?? b.dueDate ?? b.createdAt;
    return dayjs(dateB).valueOf() - dayjs(dateA).valueOf();
  });
}

export function ExpensePaymentsTable({ expenseId }: ExpensePaymentsTableProps) {
  const { t } = useTranslation("expenses");
  const { t: tc } = useTranslation("common");
  const { canvas } = useCanvas();
  const { canEdit } = useCanvasPermissions();
  const emDash = tc("empty.emDash");
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<ExpensePayment | null>(null);

  const {
    expense,
    payments: rawPayments,
    currencySymbol,
    isLoading,
    isError,
  } = useExpenseDetail(expenseId);

  const { mutate: deletePayment, isPending: isDeleting } = useMutationApi(
    (id: number) => API_ROUTES.EXPENSE_PAYMENTS_DELETE(canvas!, id),
    {
      method: "delete",
      successKey: "success.expense.paymentDeleted",
      invalidateQueries: false,
      onSuccess: () => {
        setDeleteId(null);
        queryClient.invalidateQueries({ queryKey: ["expense-payments", canvas, expenseId] });
        queryClient.invalidateQueries({ queryKey: ["notifications", "overdue"] });
      },
    }
  );

  const payments = useMemo(() => sortPayments(rawPayments), [rawPayments]);

  const totalPaid = useMemo(
    () =>
      payments
        .filter((p) => p.paidDate)
        .reduce((sum, p) => sum + parseFloat(p.amount), 0),
    [payments]
  );

  const columns: DataTableColumn<ExpensePayment>[] = useMemo(
    () => [
      {
        id: "amount",
        header: t("paymentsTable.headers.amount"),
        headerClassName: "w-[140px]",
        cellClassName: "font-medium tabular-nums",
        cell: (payment) => formatAmount(payment.amount, currencySymbol, emDash),
      },
      {
        id: "wallet",
        header: t("paymentsTable.headers.wallet"),
        cell: (payment) => (
          <TableEntityCell
            name={payment.sourceWallet?.name ?? emDash}
            caption={payment.sourceWallet?.category?.name}
          />
        ),
      },
      {
        id: "due",
        header: t("paymentsTable.headers.due"),
        cellClassName: "text-muted-foreground",
        cell: (payment) => formatDate(payment.dueDate, { fallback: emDash }),
      },
      {
        id: "paid",
        header: t("paymentsTable.headers.paid"),
        cellClassName: "text-muted-foreground",
        cell: (payment) => formatDate(payment.paidDate, { fallback: emDash }),
      },
      {
        id: "status",
        header: t("paymentsTable.headers.status"),
        cell: (payment) => {
          const status = getPaymentStatus(payment, t);
          return <TransactionStatusChip status={status.status} label={status.label} />;
        },
      },
      {
        id: "notes",
        header: t("paymentsTable.headers.notes"),
        headerClassName: "hidden md:table-cell",
        cellClassName: tableNotesCellClassName,
        cell: (payment) => <TableNotesCell notes={payment.notes} emptyLabel={emDash} />,
      },
    ],
    [t, currencySymbol, emDash]
  );

  return (
    <>
      <DataTableSection
        title={t("paymentsTable.title")}
        subtitle={expense?.name ? t("paymentsTable.subtitle", { expenseName: expense.name }) : undefined}
        count={
          payments.length > 0
            ? t("paymentsTable.count", {
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
              {t("paymentsTable.createPayment")}
            </Button>
          ) : undefined
        }
        isLoading={isLoading}
        isError={isError}
        errorMessage={t("paymentsTable.loadError")}
        columns={columns}
        data={payments}
        getRowKey={(payment) => payment.id}
        emptyMessage={t("paymentsTable.empty")}
        showActions={canEdit}
        actions={{
          onEdit: (payment) => {
            setEditingPayment(payment);
            setModalOpen(true);
          },
          onDelete: (payment) => setDeleteId(payment.id),
        }}
        footer={
          <TableRow>
            <TableCell className="font-semibold tabular-nums">
              {formatAmount(totalPaid, currencySymbol, emDash)}
            </TableCell>
            <TableCell colSpan={6} className="text-muted-foreground">
              {t("paymentsTable.footer.totalPaid")}
            </TableCell>
          </TableRow>
        }
      />

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
        paymentId={editingPayment?.id}
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingPayment(null);
        }}
        defaultWalletId={expense?.defaultWalletId ?? expense?.defaultWallet?.id}
        expenseName={expense?.name}
      />
    </>
  );
}
