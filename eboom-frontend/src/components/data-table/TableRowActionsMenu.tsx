"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface TableRowActionsMenuProps {
  onEdit?: () => void;
  onDelete?: () => void;
  deleteDisabled?: boolean;
}

export function TableRowActionsMenu({
  onEdit,
  onDelete,
  deleteDisabled = false,
}: TableRowActionsMenuProps) {
  const { t } = useTranslation("common");

  if (!onEdit && !onDelete) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground size-8">
          <MoreVertical className="size-4" />
          <span className="sr-only">{t("actions.openMenu")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onEdit && (
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="size-4" />
            {t("actions.edit")}
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem variant="destructive" disabled={deleteDisabled} onClick={onDelete}>
            <Trash2 className="size-4" />
            {t("actions.delete")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
