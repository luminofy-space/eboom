"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { DataTable, type DataTableColumn } from "@/src/components/data-table";
import { Typography } from "@/components/ui/typography";
import { formatRelativeTime, formatMoney } from "@/src/i18n/formatters";
import type { ListEntityType } from "@/src/hooks/useListFilterOptions";
import type { IncomeItem } from "@/src/redux/incomeSlice";
import type { ExpenseItem } from "@/src/redux/expenseSlice";
import type { WalletItem } from "@/src/redux/walletSlice";
import type { AssetItem } from "@/src/redux/assetSlice";

type EntityItem = IncomeItem | ExpenseItem | WalletItem | AssetItem;

interface EntityListTableProps<T extends EntityItem> {
  entityType: ListEntityType;
  items: T[];
  canEdit: boolean;
  onRowClick: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
}

function CellText({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="muted-sm" className="font-medium">
      {children}
    </Typography>
  );
}

function CellMuted({ children }: { children: React.ReactNode }) {
  return <Typography variant="muted-sm">{children}</Typography>;
}

export function EntityListTable<T extends EntityItem>({
  entityType,
  items,
  canEdit,
  onRowClick,
  onEdit,
  onDelete,
}: EntityListTableProps<T>) {
  const { t } = useTranslation("common");

  const columns: DataTableColumn<T>[] = useMemo(() => {
    const nameColumn: DataTableColumn<T> = {
      id: "name",
      header: t("list.table.name"),
      cell: (row) => <CellText>{row.name}</CellText>,
    };

    const categoryColumn: DataTableColumn<T> = {
      id: "category",
      header: t("list.table.category"),
      cell: (row) => (
        <CellMuted>
          {"category" in row && row.category?.name
            ? row.category.name
            : t("empty.emDash")}
        </CellMuted>
      ),
    };

    const lastModifiedColumn: DataTableColumn<T> = {
      id: "lastModified",
      header: t("list.table.lastModified"),
      cell: (row) => (
        <CellMuted>
          {row.lastModifiedAt
            ? formatRelativeTime(row.lastModifiedAt)
            : t("empty.emDash")}
        </CellMuted>
      ),
    };

    if (entityType === "wallets") {
      return [nameColumn, categoryColumn, lastModifiedColumn];
    }

    if (entityType === "assets") {
      return [
        nameColumn,
        categoryColumn,
        {
          id: "value",
          header: t("list.table.value"),
          cell: (row) => {
            const asset = row as AssetItem;
            return (
              <CellMuted>
                {formatMoney(asset.currentHoldingValue ?? "0", asset.currency?.symbol)}
              </CellMuted>
            );
          },
        },
        {
          id: "currency",
          header: t("list.table.currency"),
          cell: (row) => {
            const asset = row as AssetItem;
            return (
              <CellMuted>
                {asset.currency?.code ?? t("empty.emDash")}
              </CellMuted>
            );
          },
        },
        lastModifiedColumn,
      ];
    }

    const recurringColumn: DataTableColumn<T> = {
      id: "recurring",
      header: t("list.table.recurring"),
      cell: (row) => {
        const item = row as IncomeItem | ExpenseItem;
        return (
          <CellMuted>
            {item.isRecurring ? t("list.filters.recurringYes") : t("list.filters.recurringNo")}
          </CellMuted>
        );
      },
    };

    const currencyColumn: DataTableColumn<T> = {
      id: "currency",
      header: t("list.table.currency"),
      cell: (row) => {
        const item = row as IncomeItem | ExpenseItem;
        return (
          <CellMuted>
            {item.currency?.code ?? t("empty.emDash")}
          </CellMuted>
        );
      },
    };

    const walletColumn: DataTableColumn<T> = {
      id: "wallet",
      header: t("list.table.wallet"),
      cell: (row) => {
        const item = row as IncomeItem | ExpenseItem;
        return (
          <CellMuted>
            {item.defaultWallet?.name ?? t("empty.emDash")}
          </CellMuted>
        );
      },
    };

    return [nameColumn, categoryColumn, currencyColumn, recurringColumn, walletColumn, lastModifiedColumn];
  }, [entityType, t]);

  return (
    <DataTable
      columns={columns}
      data={items}
      getRowKey={(row) => row.id}
      emptyMessage={t("empty.noItemsFound")}
      showActions={canEdit}
      actions={{
        onEdit: onEdit ? (row) => onEdit(row) : undefined,
        onDelete: onDelete ? (row) => onDelete(row) : undefined,
      }}
      onRowClick={onRowClick}
    />
  );
}
