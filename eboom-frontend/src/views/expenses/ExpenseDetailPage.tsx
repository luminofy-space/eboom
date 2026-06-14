"use client";

import { ExpensePaymentsChart } from "./components/ExpensePaymentsChart";
import { ExpensePaymentsTable } from "./components/ExpensePaymentsTable";
import { ExpenseSummaryCards } from "./components/ExpenseSummaryCards";
import { useExpenseDetail } from "./hooks/useExpenseDetail";

interface Props {
  id: number;
}

export default function ExpenseDetailPage({ id }: Props) {
  const { payments, currencySymbol, isLoading } = useExpenseDetail(id);

  return (
    <>
      <div className="px-4 lg:px-6">
        <ExpensePaymentsChart
          payments={payments}
          currencySymbol={currencySymbol}
          isLoading={isLoading}
        />
      </div>
      <ExpenseSummaryCards
        payments={payments}
        currencySymbol={currencySymbol}
        isLoading={isLoading}
      />
      <ExpensePaymentsTable expenseId={id} />
    </>
  );
}
