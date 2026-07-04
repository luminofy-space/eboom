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
import { NewIncomeEntryModal } from "@/src/views/incomes/component/NewIncomeEntryModal";
import { useWalletDetail } from "../hooks/useWalletDetail";
import type { WalletEntry } from "../utils/utils";
import { useTranslation } from "react-i18next";
import { useCanvasPermissions } from "@/src/hooks/useCanvasPermissions";
import type { TFunction } from "i18next";
import { formatAmount, formatDate } from "@/src/i18n/formatters";

interface WalletEntriesTableProps {
  walletId: number;
  walletName?: string;
  currencySymbol?: string;
}

function getEntryStatus(entry: WalletEntry, t: TFunction<"wallets">): {
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

function sortEntries(entries: WalletEntry[]): WalletEntry[] {
  return [...entries].sort((a, b) => {
    const dateA = a.receivedDate ?? a.expectedDate ?? a.createdAt;
    const dateB = b.receivedDate ?? b.expectedDate ?? b.createdAt;
    return dayjs(dateB).valueOf() - dayjs(dateA).valueOf();
  });
}

export function WalletEntriesTable({
  walletId,
  walletName,
  currencySymbol,
}: WalletEntriesTableProps) {
  const { t } = useTranslation("wallets");
  const { t: tc } = useTranslation("common");
  const { canEdit } = useCanvasPermissions();
  const emDash = tc("empty.emDash");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WalletEntry | null>(null);
  const { entries: entriesRes, isLoading, isError } = useWalletDetail(walletId);

  const entries = useMemo(() => sortEntries(entriesRes ?? []), [entriesRes]);

  const totalReceived = useMemo(
    () =>
      entries
        .filter((e) => e.receivedDate)
        .reduce((sum, e) => sum + parseFloat(e.amount), 0),
    [entries]
  );

  const columns: DataTableColumn<WalletEntry>[] = useMemo(
    () => [
      {
        id: "amount",
        header: t("entriesTable.headers.amount"),
        headerClassName: "w-[140px]",
        cellClassName: "font-medium tabular-nums",
        cell: (entry) => formatAmount(entry.amount, currencySymbol, emDash),
      },
      {
        id: "income",
        header: t("entriesTable.headers.income"),
        cell: (entry) => (
          <TableEntityCell
            name={entry.incomeName ?? t("entriesTable.fallbackIncomeName", { incomeId: entry.incomeId })}
            caption={entry.categoryName}
          />
        ),
      },
      {
        id: "expected",
        header: t("entriesTable.headers.expected"),
        cellClassName: "text-muted-foreground",
        cell: (entry) => formatDate(entry.expectedDate, { fallback: emDash }),
      },
      {
        id: "received",
        header: t("entriesTable.headers.received"),
        cellClassName: "text-muted-foreground",
        cell: (entry) => formatDate(entry.receivedDate, { fallback: emDash }),
      },
      {
        id: "status",
        header: t("entriesTable.headers.status"),
        cell: (entry) => {
          const status = getEntryStatus(entry, t);
          return <TransactionStatusChip status={status.status} label={status.label} />;
        },
      },
      {
        id: "notes",
        header: t("entriesTable.headers.notes"),
        headerClassName: "hidden md:table-cell",
        cellClassName: tableNotesCellClassName,
        cell: (entry) => <TableNotesCell notes={entry.notes} emptyLabel={emDash} />,
      },
    ],
    [t, currencySymbol, emDash]
  );

  return (
    <>
      <DataTableSection
        title={t("entriesTable.title")}
        subtitle={t("entriesTable.subtitle")}
        count={
          entries.length > 0
            ? t("entriesTable.count", {
                count: entries.length,
                unit: entries.length === 1 ? tc("plurals.entry") : tc("plurals.entries"),
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
              {t("entriesTable.createEntry")}
            </Button>
          ) : undefined
        }
        isLoading={isLoading}
        isError={isError}
        errorMessage={t("entriesTable.loadError")}
        columns={columns}
        data={entries}
        getRowKey={(entry) => entry.id}
        emptyMessage={t("entriesTable.empty")}
        showActions={canEdit}
        actions={{
          onEdit: (entry) => {
            setEditingEntry(entry);
            setModalOpen(true);
          },
          onDelete: () => undefined,
          deleteDisabled: true,
        }}
        footer={
          <TableRow>
            <TableCell className="font-semibold tabular-nums">
              {formatAmount(totalReceived, currencySymbol, emDash)}
            </TableCell>
            <TableCell colSpan={6} className="text-muted-foreground">
              {t("entriesTable.footer.totalReceived")}
            </TableCell>
          </TableRow>
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
        fixedDestinationWalletId={walletId}
        walletName={walletName}
        extraInvalidateKeys={[["wallet-entries", walletId], ["wallet", walletId]]}
      />
    </>
  );
}
