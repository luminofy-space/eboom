"use client";

import { ExpensePaymentsChart } from "./components/ExpensePaymentsChart";
import { ExpensePaymentsTable } from "./components/ExpensePaymentsTable";
import { ExpenseSummaryCards } from "./components/ExpenseSummaryCards";
import { useExpenseDetail } from "./hooks/useExpenseDetail";
import { Container } from "@/components/ui/container";

interface Props {
  id: number;
}

export default function ExpenseDetailPage({ id }: Props) {
  const { payments, currencySymbol, isLoading } = useExpenseDetail(id);

  return (
    <>
      <Container>
        <ExpensePaymentsChart
          payments={payments}
          currencySymbol={currencySymbol}
          isLoading={isLoading}
        />
      </Container>
      <ExpenseSummaryCards
        payments={payments}
        currencySymbol={currencySymbol}
        isLoading={isLoading}
      />
      <ExpensePaymentsTable expenseId={id} />
    </>
  );
}
