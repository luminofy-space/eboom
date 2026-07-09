"use client";

import {
  DataTableSection,
  TableNotesCell,
  tableNotesCellClassName,
  type DataTableColumn,
} from "@/src/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteDialog } from "@/src/components/ConfirmDeleteDialog";
import API_ROUTES from "@/src/api/urls";
import { useMutationApi } from "@/src/api/useMutation";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useCanvasPermissions } from "@/src/hooks/useCanvasPermissions";
import { formatAmount, formatDate, formatMoney } from "@/src/i18n/formatters";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AssetVolume } from "../hooks/useAssetDetail";
import { NewAssetVolumeModal } from "./NewAssetVolumeModal";

interface AssetVolumesTableProps {
  assetId: number;
  volumes: AssetVolume[];
  currencySymbol?: string;
  isLoading?: boolean;
  isError?: boolean;
}

export function AssetVolumesTable({
  assetId,
  volumes,
  currencySymbol,
  isLoading,
  isError,
}: AssetVolumesTableProps) {
  const { t } = useTranslation("assets");
  const { t: tc } = useTranslation("common");
  const { canEdit } = useCanvasPermissions();
  const { canvas } = useCanvas();
  const queryClient = useQueryClient();
  const emDash = tc("empty.emDash");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AssetVolume | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const sorted = useMemo(
    () =>
      [...volumes].sort(
        (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
      ),
    [volumes]
  );

  const { mutate: deleteVolume, isPending: isDeleting } = useMutationApi(
    (id: number) => API_ROUTES.ASSET_VOLUMES_DELETE(canvas!, assetId, id),
    {
      method: "delete",
      successKey: "success.asset.volumeDeleted",
      onSuccess: () => {
        setDeleteId(null);
        queryClient.invalidateQueries({ queryKey: ["asset", canvas, assetId] });
        queryClient.invalidateQueries({ queryKey: ["asset-volumes", canvas, assetId] });
        queryClient.invalidateQueries({ queryKey: ["asset-valuation-series", canvas, assetId] });
        queryClient.invalidateQueries({ queryKey: ["assets", canvas] });
      },
    }
  );

  const columns: DataTableColumn<AssetVolume>[] = useMemo(
    () => [
      {
        id: "type",
        header: t("volumesTable.headers.type"),
        cell: (row) => {
          const isBuy = Number(row.quantity) > 0;
          return (
            <Badge variant={isBuy ? "secondary" : "outline"}>
              {isBuy ? t("volumesTable.buy") : t("volumesTable.sell")}
            </Badge>
          );
        },
      },
      {
        id: "quantity",
        header: t("volumesTable.headers.quantity"),
        cellClassName: "font-medium tabular-nums",
        cell: (row) => formatAmount(String(Math.abs(Number(row.quantity))), undefined, emDash),
      },
      {
        id: "unitPrice",
        header: t("volumesTable.headers.unitPrice"),
        cellClassName: "tabular-nums",
        cell: (row) => formatMoney(row.unitPrice, currencySymbol),
      },
      {
        id: "total",
        header: t("volumesTable.headers.total"),
        cellClassName: "tabular-nums",
        cell: (row) =>
          formatMoney(
            String(Math.abs(Number(row.quantity)) * Number(row.unitPrice)),
            currencySymbol
          ),
      },
      {
        id: "date",
        header: t("volumesTable.headers.date"),
        cellClassName: "text-muted-foreground",
        cell: (row) => formatDate(row.recordedAt, { fallback: emDash }),
      },
      {
        id: "notes",
        header: t("volumesTable.headers.notes"),
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
        title={t("volumesTable.title")}
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
              {t("volumesTable.add")}
            </Button>
          ) : undefined
        }
        isLoading={isLoading}
        isError={isError}
        errorMessage={t("detail.loadError")}
        columns={columns}
        data={sorted}
        getRowKey={(row) => row.id}
        emptyMessage={t("volumesTable.empty")}
        showActions={canEdit}
        actions={{
          onEdit: (row) => {
            setEditing(row);
            setModalOpen(true);
          },
          onDelete: (row) => setDeleteId(row.id),
        }}
      />

      <NewAssetVolumeModal
        assetId={assetId}
        open={modalOpen}
        onOpenChange={setModalOpen}
        editingVolume={editing}
      />

      <ConfirmDeleteDialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        onConfirm={() => {
          if (deleteId !== null) deleteVolume(deleteId);
        }}
        isDeleting={isDeleting}
      />
    </>
  );
}
