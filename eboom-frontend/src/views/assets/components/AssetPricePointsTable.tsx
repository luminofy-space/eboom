"use client";

import {
  DataTableSection,
  TableNotesCell,
  tableNotesCellClassName,
  type DataTableColumn,
} from "@/src/components/data-table";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/src/components/ConfirmDeleteDialog";
import API_ROUTES from "@/src/api/urls";
import { useMutationApi } from "@/src/api/useMutation";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useCanvasPermissions } from "@/src/hooks/useCanvasPermissions";
import { formatDate, formatMoney } from "@/src/i18n/formatters";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AssetPricePoint } from "../hooks/useAssetDetail";
import { NewPricePointModal } from "./NewPricePointModal";

interface AssetPricePointsTableProps {
  assetId: number;
  pricePoints: AssetPricePoint[];
  currencySymbol?: string;
  isLoading?: boolean;
  isError?: boolean;
}

export function AssetPricePointsTable({
  assetId,
  pricePoints,
  currencySymbol,
  isLoading,
  isError,
}: AssetPricePointsTableProps) {
  const { t } = useTranslation("assets");
  const { t: tc } = useTranslation("common");
  const { canEdit } = useCanvasPermissions();
  const { canvas } = useCanvas();
  const queryClient = useQueryClient();
  const emDash = tc("empty.emDash");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AssetPricePoint | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const sorted = useMemo(
    () =>
      [...pricePoints].sort(
        (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
      ),
    [pricePoints]
  );

  const { mutate: deletePoint, isPending: isDeleting } = useMutationApi(
    (id: number) => API_ROUTES.ASSET_PRICE_POINTS_DELETE(canvas!, assetId, id),
    {
      method: "delete",
      successKey: "success.asset.pricePointDeleted",
      onSuccess: () => {
        setDeleteId(null);
        queryClient.invalidateQueries({ queryKey: ["asset", canvas, assetId] });
        queryClient.invalidateQueries({ queryKey: ["asset-price-points", canvas, assetId] });
        queryClient.invalidateQueries({ queryKey: ["asset-valuation-series", canvas, assetId] });
        queryClient.invalidateQueries({ queryKey: ["assets", canvas] });
      },
    }
  );

  const columns: DataTableColumn<AssetPricePoint>[] = useMemo(
    () => [
      {
        id: "unitPrice",
        header: t("pricePointsTable.headers.unitPrice"),
        cellClassName: "font-medium tabular-nums",
        cell: (row) => formatMoney(row.unitPrice, currencySymbol),
      },
      {
        id: "date",
        header: t("pricePointsTable.headers.date"),
        cellClassName: "text-muted-foreground",
        cell: (row) => formatDate(row.recordedAt, { fallback: emDash }),
      },
      {
        id: "notes",
        header: t("pricePointsTable.headers.notes"),
        headerClassName: "hidden md:table-cell",
        cellClassName: tableNotesCellClassName,
        cell: (row) => <TableNotesCell notes={row.notes} emptyLabel={emDash} />,
      },
    ],
    [t, currencySymbol, emDash]
  );

  return (
    <>
      <DataTableSection
        title={t("pricePointsTable.title")}
        headerAction={
          canEdit ? (
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <Plus className="size-4" />
              {t("pricePointsTable.add")}
            </Button>
          ) : undefined
        }
        isLoading={isLoading}
        isError={isError}
        errorMessage={t("detail.loadError")}
        columns={columns}
        data={sorted}
        getRowKey={(row) => row.id}
        emptyMessage={t("pricePointsTable.empty")}
        showActions={canEdit}
        actions={{
          onEdit: (row) => {
            setEditing(row);
            setModalOpen(true);
          },
          onDelete: (row) => setDeleteId(row.id),
        }}
      />

      <NewPricePointModal
        assetId={assetId}
        open={modalOpen}
        onOpenChange={setModalOpen}
        editingPricePoint={editing}
      />

      <ConfirmDeleteDialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        onConfirm={() => {
          if (deleteId !== null) deletePoint(deleteId);
        }}
        isDeleting={isDeleting}
      />
    </>
  );
}
