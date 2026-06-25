"use client";

import { NewIncomeEntryModal } from "@/src/views/incomes/component/NewIncomeEntryModal";
import { NewExpensePaymentModal } from "@/src/views/expenses/components/NewExpensePaymentModal";
import type { CalendarEvent } from "@/src/hooks/useCalendarData";

interface EventModalProps {
  event: CalendarEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventModal({ event, open, onOpenChange }: EventModalProps) {
  const dateKey = event.date.slice(0, 10);
  const amount = Number(event.amount) || undefined;

  if (event.type === "income") {
    return (
      <NewIncomeEntryModal
        incomeId={event.entityId}
        open={open}
        onOpenChange={onOpenChange}
        incomeName={event.info}
        defaultExpectedDate={dateKey}
        defaultAmount={amount}
        extraInvalidateKeys={[["calendar"]]}
      />
    );
  }

  return (
    <NewExpensePaymentModal
      expenseId={event.entityId}
      open={open}
      onOpenChange={onOpenChange}
      expenseName={event.info}
      defaultDueDate={dateKey}
      defaultAmount={amount}
      extraInvalidateKeys={[["calendar"]]}
    />
  );
}
