"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Stack } from "@/components/ui/stack";
import { BanknoteArrowDown, BanknoteArrowUp } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CalendarCreateChoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dateLabel: string;
  onChooseIncomeEntry: () => void;
  onChooseExpensePayment: () => void;
}

export function CalendarCreateChoiceModal({
  open,
  onOpenChange,
  dateLabel,
  onChooseIncomeEntry,
  onChooseExpensePayment,
}: CalendarCreateChoiceModalProps) {
  const { t } = useTranslation("calendar");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("createChoiceTitle")}</DialogTitle>
          <DialogDescription>
            {t("createChoiceDescription", { date: dateLabel })}
          </DialogDescription>
        </DialogHeader>

        <Stack gap={2}>
          <Button
            type="button"
            variant="outline"
            className="h-auto justify-start gap-3 px-4 py-3"
            onClick={onChooseIncomeEntry}
          >
            <BanknoteArrowUp className="size-5 shrink-0 text-emerald-600" aria-hidden />
            <span className="text-left">
              <span className="block font-medium">{t("addIncomeEntry")}</span>
            </span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-auto justify-start gap-3 px-4 py-3"
            onClick={onChooseExpensePayment}
          >
            <BanknoteArrowDown className="size-5 shrink-0 text-red-600" aria-hidden />
            <span className="text-left">
              <span className="block font-medium">{t("addExpensePayment")}</span>
            </span>
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
