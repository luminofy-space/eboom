"use client";

import {
  DataTableSection,
  TableEntityCell,
  TableNotesCell,
  tableNotesCellClassName,
  type DataTableColumn,
} from "@/src/components/data-table";
import { TransactionStatusChip, type TransactionStatus } from "@/src/components/TransactionStatusChip";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import dayjs from "dayjs";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { NewExpensePaymentModal } from "@/src/views/expenses/components/NewExpensePaymentModal";
import { useWalletDetail } from "../hooks/useWalletDetail";
import type { WalletPayment } from "../utils/utils";
import { filterPaymentsByCurrency } from "../utils/currencyFilter";
import { useTranslation } from "react-i18next";
import { useCanvasPermissions } from "@/src/hooks/useCanvasPermissions";
import type { TFunction } from "i18next";
import { formatAmount, formatDate } from "@/src/i18n/formatters";

interface WalletPaymentsTableProps {
  walletId: number;
  walletName?: string;
  currencySymbol?: string;
  currencyCode?: string;
}

function getPaymentStatus(payment: WalletPayment, t: TFunction<"wallets">): {
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
  currencyCode,
}: WalletPaymentsTableProps) {
  const { t } = useTranslation("wallets");
  const { t: tc } = useTranslation("common");
  const { canEdit } = useCanvasPermissions();
  const emDash = tc("empty.emDash");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<WalletPayment | null>(null);
  const { payments: paymentsRes, isLoading, isError } = useWalletDetail(walletId);

  const payments = useMemo(
    () => sortPayments(filterPaymentsByCurrency(paymentsRes ?? [], currencyCode)),
    [paymentsRes, currencyCode]
  );

  const totalPaid = useMemo(
    () =>
      payments
        .filter((p) => p.paidDate)
        .reduce((sum, p) => sum + parseFloat(p.amount), 0),
    [payments]
  );

  const columns: DataTableColumn<WalletPayment>[] = useMemo(
    () => [
      {
        id: "amount",
        header: t("paymentsTable.headers.amount"),
        headerClassName: "w-[140px]",
        cellClassName: "font-medium tabular-nums",
        cell: (payment) =>
          formatAmount(payment.amount, payment.currencySymbol ?? currencySymbol, emDash),
      },
      {
        id: "expense",
        header: t("paymentsTable.headers.expense"),
        cell: (payment) => (
          <TableEntityCell
            name={
              payment.expenseName ??
              t("paymentsTable.fallbackExpenseName", { expenseId: payment.expenseId })
            }
            caption={payment.categoryName}
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
        subtitle={t("paymentsTable.subtitle")}
        containerClassName="pb-6"
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
          onDelete: () => undefined,
          deleteDisabled: true,
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

      <NewExpensePaymentModal
        expenseId={editingPayment?.expenseId}
        paymentId={editingPayment?.id}
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingPayment(null);
        }}
        fixedSourceWalletId={walletId}
        walletName={walletName}
        extraInvalidateKeys={[["wallet-payments", walletId], ["wallet", walletId]]}
      />
    </>
  );
}
