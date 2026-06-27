"use client";

import { Button } from "@/components/ui/button";
import { Stack } from "@/components/ui/stack";
import {
  BanknoteArrowDown,
  BanknoteArrowUp,
  LayoutTemplate,
  Maximize2,
  Wallet,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface WhiteboardToolbarProps {
  canEdit: boolean;
  onAddWallet: () => void;
  onAddIncome: () => void;
  onAddExpense: () => void;
  onAutoLayout: () => void;
  onFitView: () => void;
}

export function WhiteboardToolbar({
  canEdit,
  onAddWallet,
  onAddIncome,
  onAddExpense,
  onAutoLayout,
  onFitView,
}: WhiteboardToolbarProps) {
  const { t } = useTranslation("whiteboard");

  return (
    <div className="absolute left-3 top-3 z-10 rounded-lg border bg-background/95 p-2 shadow-sm backdrop-blur">
      <Stack direction="row" gap={2} className="flex-wrap">
        {canEdit ? (
          <>
            <Button size="sm" variant="outline" onClick={onAddWallet}>
              <Wallet className="mr-1.5 h-4 w-4" />
              {t("toolbar.addWallet")}
            </Button>
            <Button size="sm" variant="outline" onClick={onAddIncome}>
              <BanknoteArrowUp className="mr-1.5 h-4 w-4" />
              {t("toolbar.addIncome")}
            </Button>
            <Button size="sm" variant="outline" onClick={onAddExpense}>
              <BanknoteArrowDown className="mr-1.5 h-4 w-4" />
              {t("toolbar.addExpense")}
            </Button>
          </>
        ) : null}
        <Button size="sm" variant="ghost" onClick={onAutoLayout}>
          <LayoutTemplate className="mr-1.5 h-4 w-4" />
          {t("toolbar.autoLayout")}
        </Button>
        <Button size="sm" variant="ghost" onClick={onFitView}>
          <Maximize2 className="mr-1.5 h-4 w-4" />
          {t("toolbar.fitView")}
        </Button>
      </Stack>
    </div>
  );
}
