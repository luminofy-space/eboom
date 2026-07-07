"use client";

import {
  BanknoteArrowDown,
  BanknoteArrowUp,
  ExternalLink,
  Pencil,
  Trash2,
  Wallet,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { WhiteboardContextMenuState } from "@/src/types/whiteboard";
import { parseEntityNodeId } from "./utils/graphBuilder";

interface WhiteboardContextMenuProps {
  menu: WhiteboardContextMenuState | null;
  canEdit: boolean;
  onClose: () => void;
  onAddWallet: () => void;
  onAddIncome: () => void;
  onAddExpense: () => void;
  onEditNode: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onOpenDetail: (nodeId: string) => void;
}

export function WhiteboardContextMenu({
  menu,
  canEdit,
  onClose,
  onAddWallet,
  onAddIncome,
  onAddExpense,
  onEditNode,
  onDeleteNode,
  onOpenDetail,
}: WhiteboardContextMenuProps) {
  const { t } = useTranslation("whiteboard");

  if (!menu) return null;

  const parsed = menu.kind === "node" && menu.nodeId ? parseEntityNodeId(menu.nodeId) : null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} onContextMenu={(e) => e.preventDefault()} />
      <div
        className="fixed z-50 min-w-[180px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        style={{ left: menu.x, top: menu.y }}
      >
        {menu.kind === "pane" && canEdit ? (
          <>
            <button
              type="button"
              className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
              onClick={() => {
                onAddWallet();
                onClose();
              }}
            >
              <Wallet className="mr-2 h-4 w-4" />
              {t("contextMenu.addWallet")}
            </button>
            <button
              type="button"
              className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
              onClick={() => {
                onAddIncome();
                onClose();
              }}
            >
              <BanknoteArrowUp className="mr-2 h-4 w-4" />
              {t("contextMenu.addIncome")}
            </button>
            <button
              type="button"
              className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
              onClick={() => {
                onAddExpense();
                onClose();
              }}
            >
              <BanknoteArrowDown className="mr-2 h-4 w-4" />
              {t("contextMenu.addExpense")}
            </button>
          </>
        ) : null}

        {menu.kind === "node" && menu.nodeId ? (
          <>
            {parsed ? (
              <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                {t(`nodeTypes.${parsed.type}`)}
              </p>
            ) : null}
            <button
              type="button"
              className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
              onClick={() => {
                onOpenDetail(menu.nodeId!);
                onClose();
              }}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              {t("contextMenu.openDetail")}
            </button>
            {canEdit ? (
              <>
                <button
                  type="button"
                  className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                  onClick={() => {
                    onEditNode(menu.nodeId!);
                    onClose();
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  {t("contextMenu.edit")}
                </button>
                <button
                  type="button"
                  className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-accent"
                  onClick={() => {
                    onDeleteNode(menu.nodeId!);
                    onClose();
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("contextMenu.delete")}
                </button>
              </>
            ) : null}
          </>
        ) : null}
      </div>
    </>
  );
}
