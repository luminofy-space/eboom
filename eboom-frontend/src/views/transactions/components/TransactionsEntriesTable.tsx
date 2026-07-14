"use client";

import Link from "next/link";
import {
  DataTableSection,
  TableEntityCell,
  TableNotesCell,
  tableNotesCellClassName,
  type DataTableColumn,
} from "@/src/components/data-table";
import { ListPagination } from "@/src/components/list/ListPagination";
import { TransactionStatusChip, type TransactionStatus } from "@/src/components/TransactionStatusChip";
import { Button } from "@/components/ui/button";
import API_ROUTES from "@/src/api/urls";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useCanvasPermissions } from "@/src/hooks/useCanvasPermissions";
import { usePaginatedTransactionQuery } from "@/src/hooks/usePaginatedTransactionQuery";
import { formatAmount, formatDate } from "@/src/i18n/formatters";
import { NewIncomeEntryModal } from "@/src/views/incomes/component/NewIncomeEntryModal";
import dayjs from "dayjs";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import type { PaginatedCanvasIncomeEntriesResponse } from "@/src/types/pagination";
import type { CanvasTransactionsIncomeEntry } from "@/src/types/transactions";

function getEntryStatus(entry: CanvasTransactionsIncomeEntry, t: TFunction<"wallets">): {
  label: string;
  status: TransactionStatus;
} {
  if (entry.receivedDate) {
    return { label: t("status.received"), status: "received" };
  }
  if (entry.expectedDate && dayjs(entry.expectedDate).isAfter(dayjs(), "day")) {
    return { label: t("status.expected"), status: "expected" };
  }
  return { label: t("status.pending"), status: "pending" };
}

export function TransactionsEntriesTable() {
  const { t } = useTranslation("transactions");
  const { t: tw } = useTranslation("wallets");
  const { t: tc } = useTranslation("common");
  const { canvas } = useCanvas();
  const { canEdit } = useCanvasPermissions();
  const router = useRouter();
  const emDash = tc("empty.emDash");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CanvasTransactionsIncomeEntry | null>(null);

  const {
    items: entries,
    total,
    page,
    pageSize,
    totalPages,
    setPage,
    isLoading,
    isFetching,
    isError,
  } = usePaginatedTransactionQuery<
    PaginatedCanvasIncomeEntriesResponse<CanvasTransactionsIncomeEntry>,
    CanvasTransactionsIncomeEntry
  >({
    baseUrl: canvas ? API_ROUTES.CANVAS_TRANSACTIONS(canvas) : "",
    queryKey: ["canvas-transactions", canvas, "incomeEntries"],
    enabled: !!canvas,
    itemsKey: "incomeEntries",
    extraParams: { type: "incomeEntries" },
  });

  const invalidateKeys = useMemo(
    () =>
      canvas
        ? [
            ["canvas-transactions", canvas, "incomeEntries"],
            ["canvas-summary", canvas],
          ]
        : [],
    [canvas]
  );

  const columns: DataTableColumn<CanvasTransactionsIncomeEntry>[] = useMemo(
    () => [
      {
        id: "amount",
        header: tw("entriesTable.headers.amount"),
        headerClassName: "w-[140px]",
        cellClassName: "font-medium tabular-nums",
        cell: (entry) => formatAmount(entry.amount, entry.currencySymbol, emDash),
      },
      {
        id: "income",
        header: tw("entriesTable.headers.income"),
        cell: (entry) => (
          <TableEntityCell
            name={
              entry.incomeName ?? t("entries.fallbackIncomeName", { incomeId: entry.incomeId })
            }
            caption={entry.categoryName}
          />
        ),
      },
      {
        id: "wallet",
        header: t("columns.wallet"),
        stopRowClick: true,
        cell: (entry) => (
          <Link
            href={`/wallet/${entry.destinationWalletId}`}
            className="text-primary hover:underline"
          >
            {entry.destinationWalletName}
          </Link>
        ),
      },
      {
        id: "expected",
        header: tw("entriesTable.headers.expected"),
        cellClassName: "text-muted-foreground",
        cell: (entry) => formatDate(entry.expectedDate, { fallback: emDash }),
      },
      {
        id: "received",
        header: tw("entriesTable.headers.received"),
        cellClassName: "text-muted-foreground",
        cell: (entry) => formatDate(entry.receivedDate, { fallback: emDash }),
      },
      {
        id: "status",
        header: tw("entriesTable.headers.status"),
        cell: (entry) => {
          const status = getEntryStatus(entry, tw);
          return <TransactionStatusChip status={status.status} label={status.label} />;
        },
      },
      {
        id: "notes",
        header: tw("entriesTable.headers.notes"),
        headerClassName: "hidden md:table-cell",
        cellClassName: tableNotesCellClassName,
        cell: (entry) => <TableNotesCell notes={entry.notes} emptyLabel={emDash} />,
      },
    ],
    [t, tw, emDash]
  );

  return (
    <>
      <DataTableSection
        title={t("entries.title")}
        subtitle={t("entries.subtitle")}
        count={
          total > 0
            ? t("entries.count", {
                count: total,
                unit: total === 1 ? tc("plurals.entry") : tc("plurals.entries"),
              })
            : undefined
        }
        headerAction={
          canEdit ? (
            <Button
              size="sm"
              onClick={() => {
                setEditingEntry(null);
                setModalOpen(true);
              }}
            >
              <Plus className="size-4" />
              {t("entries.createEntry")}
            </Button>
          ) : undefined
        }
        isLoading={isLoading}
        isError={isError}
        errorMessage={t("entries.loadError")}
        columns={columns}
        data={entries}
        getRowKey={(entry) => entry.id}
        emptyMessage={t("entries.empty")}
        onRowClick={(entry) => router.push(`/income/${entry.incomeId}`)}
        showActions={canEdit}
        actions={{
          onEdit: (entry) => {
            setEditingEntry(entry);
            setModalOpen(true);
          },
          onDelete: () => undefined,
          deleteDisabled: true,
        }}
        pagination={
          <ListPagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
            isFetching={isFetching}
          />
        }
      />

      <NewIncomeEntryModal
        incomeId={editingEntry?.incomeId}
        entryId={editingEntry?.id}
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingEntry(null);
        }}
        extraInvalidateKeys={invalidateKeys}
      />
    </>
  );
}
