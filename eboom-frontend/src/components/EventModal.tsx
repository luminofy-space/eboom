"use client";

import { NewIncomeEntryModal } from "@/src/views/incomes/component/NewIncomeEntryModal";
import { NewExpensePaymentModal } from "@/src/views/expenses/components/NewExpensePaymentModal";
import { NewTransferModal } from "@/src/views/wallets/components/NewTransferModal";
import { GoalFormModal } from "@/src/views/budget-planning/components/GoalFormModal";
import { useCanvas } from "@/src/hooks/useCanvas";
import type { CalendarEvent } from "@/src/hooks/useCalendarData";

interface EventModalProps {
  event: CalendarEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventModal({ event, open, onOpenChange }: EventModalProps) {
  const { canvas } = useCanvas();
  const dateKey = event.date.slice(0, 10);
  const amount = Number(event.amount) || undefined;
  const isExistingRecord = !event.isPredicted && event.entryId != null;

  if (event.type === "goal" && canvas) {
    return (
      <GoalFormModal
        open={open}
        onOpenChange={onOpenChange}
        canvasId={canvas}
        goalId={event.entityId}
        extraInvalidateKeys={[["calendar"]]}
      />
    );
  }

  if (event.type === "income") {
    return (
      <NewIncomeEntryModal
        incomeId={event.entityId}
        entryId={isExistingRecord ? event.entryId : undefined}
        open={open}
        onOpenChange={onOpenChange}
        incomeName={event.info}
        defaultExpectedDate={isExistingRecord ? undefined : dateKey}
        defaultAmount={isExistingRecord ? undefined : amount}
        extraInvalidateKeys={[["calendar"]]}
      />
    );
  }

  if (event.type === "expense") {
    return (
      <NewExpensePaymentModal
        expenseId={event.entityId}
        paymentId={isExistingRecord ? event.entryId : undefined}
        open={open}
        onOpenChange={onOpenChange}
        expenseName={event.info}
        defaultDueDate={isExistingRecord ? undefined : dateKey}
        defaultAmount={isExistingRecord ? undefined : amount}
        extraInvalidateKeys={[["calendar"]]}
      />
    );
  }

  return (
    <NewTransferModal
      transferId={isExistingRecord ? event.entryId : undefined}
      open={open}
      onOpenChange={onOpenChange}
      extraInvalidateKeys={[["calendar"]]}
    />
  );
}
