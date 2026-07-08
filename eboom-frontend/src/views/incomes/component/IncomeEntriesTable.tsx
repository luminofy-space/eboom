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
import { useIncomeDetail } from "../hooks/useIncomeDetail";
import { TransactionStatusChip, type TransactionStatus } from "@/src/components/TransactionStatusChip";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { NewIncomeEntryModal } from "./NewIncomeEntryModal";
import { useTranslation } from "react-i18next";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useCanvasPermissions } from "@/src/hooks/useCanvasPermissions";
import type { TFunction } from "i18next";
import { formatAmount, formatDate } from "@/src/i18n/formatters";

interface WalletCategory {
  id: number;
  name: string;
}

interface DestinationWallet {
  id: number;
  name: string;
  category?: WalletCategory | null;
}

export interface IncomeEntry {
  id: number;
  incomeId: number;
  destinationWalletId: number;
  amount: string;
  expectedDate: string | null;
  receivedDate: string | null;
  notes: string | null;
  createdAt: string;
  destinationWallet: DestinationWallet | null;
}

interface IncomeEntriesTableProps {
  incomeId: number;
}

function getEntryStatus(entry: IncomeEntry, t: TFunction<"incomes">): {
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

function sortEntries(entries: IncomeEntry[]): IncomeEntry[] {
  return [...entries].sort((a, b) => {
    const dateA = a.receivedDate ?? a.expectedDate ?? a.createdAt;
    const dateB = b.receivedDate ?? b.expectedDate ?? b.createdAt;
    return dayjs(dateB).valueOf() - dayjs(dateA).valueOf();
  });
}

export function IncomeEntriesTable({ incomeId }: IncomeEntriesTableProps) {
  const { t } = useTranslation("incomes");
  const { t: tc } = useTranslation("common");
  const { canvas } = useCanvas();
  const { canEdit } = useCanvasPermissions();
  const emDash = tc("empty.emDash");
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<IncomeEntry | null>(null);

  const {
    income,
    entries: rawEntries,
    currencySymbol,
    isLoading,
    isError,
  } = useIncomeDetail(incomeId);

  const { mutate: deleteEntry, isPending: isDeleting } = useMutationApi(
    (id: number) => API_ROUTES.INCOME_ENTRIES_DELETE(canvas!, id),
    {
      method: "delete",
      successKey: "success.income.entryDeleted",
      invalidateQueries: false,
      onSuccess: () => {
        setDeleteId(null);
        queryClient.invalidateQueries({ queryKey: ["income-entries", canvas, incomeId] });
        queryClient.invalidateQueries({ queryKey: ["notifications", "overdue"] });
      },
    }
  );

  const entries = useMemo(() => sortEntries(rawEntries), [rawEntries]);

  const totalReceived = useMemo(
    () =>
      entries
        .filter((e) => e.receivedDate)
        .reduce((sum, e) => sum + parseFloat(e.amount), 0),
    [entries]
  );

  const columns: DataTableColumn<IncomeEntry>[] = useMemo(
    () => [
      {
        id: "amount",
        header: t("entriesTable.headers.amount"),
        headerClassName: "w-[140px]",
        cellClassName: "font-medium tabular-nums",
        cell: (entry) => formatAmount(entry.amount, currencySymbol, emDash),
      },
      {
        id: "wallet",
        header: t("entriesTable.headers.wallet"),
        cell: (entry) => (
          <TableEntityCell
            name={entry.destinationWallet?.name ?? emDash}
            caption={entry.destinationWallet?.category?.name}
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
        subtitle={income?.name ? t("entriesTable.subtitle", { incomeName: income.name }) : undefined}
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
          onDelete: (entry) => setDeleteId(entry.id),
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

      <ConfirmDeleteDialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        onConfirm={() => {
          if (deleteId !== null) deleteEntry(deleteId);
        }}
        isDeleting={isDeleting}
      />

      <NewIncomeEntryModal
        incomeId={incomeId}
        entryId={editingEntry?.id}
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingEntry(null);
        }}
        defaultWalletId={income?.defaultWalletId ?? income?.defaultWallet?.id}
        incomeName={income?.name}
      />
    </>
  );
}
