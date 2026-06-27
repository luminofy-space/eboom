"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface ConfirmLeaveCanvasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canvasName: string;
  onConfirm: () => void;
  isLeaving?: boolean;
}

export function ConfirmLeaveCanvasDialog({
  open,
  onOpenChange,
  canvasName,
  onConfirm,
  isLeaving = false,
}: ConfirmLeaveCanvasDialogProps) {
  const { t } = useTranslation("canvas-members");
  const { t: tc } = useTranslation("common");
  const [confirmName, setConfirmName] = useState("");

  const matches = confirmName.trim() === canvasName;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setConfirmName("");
        onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("leave.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("leave.description", { name: canvasName })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input
          value={confirmName}
          onChange={(e) => setConfirmName(e.target.value)}
          placeholder={t("leave.placeholder")}
          disabled={isLeaving}
        />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLeaving}>{tc("actions.cancel")}</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={!matches || isLeaving}
            onClick={onConfirm}
          >
            {isLeaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("leave.confirm")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
