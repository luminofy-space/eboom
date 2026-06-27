"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ConfirmRemoveMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  memberName: string;
  isRemoving?: boolean;
}

export function ConfirmRemoveMemberDialog({
  open,
  onOpenChange,
  onConfirm,
  memberName,
  isRemoving = false,
}: ConfirmRemoveMemberDialogProps) {
  const { t } = useTranslation("canvas-members");
  const { t: tc } = useTranslation("common");

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("members.removeConfirm.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("members.removeConfirm.description", { name: memberName })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRemoving}>{tc("actions.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isRemoving}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isRemoving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isRemoving ? t("members.removeConfirm.removing") : t("members.removeMember")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
