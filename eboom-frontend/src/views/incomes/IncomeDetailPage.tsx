"use client";

import { IncomeEntriesChart } from "./component/IncomeEntriesChart";
import { IncomeEntriesTable } from "./component/IncomeEntriesTable";
import { IncomeSummaryCards } from "./component/IncomeSummaryCards";
import { useIncomeDetail } from "./hooks/useIncomeDetail";

interface Props {
  id: number;
}

export default function IncomeDetailPage({ id }: Props) {
  const { entries, currencySymbol, isLoading } = useIncomeDetail(id);

  return (
    <>
      <div className="px-4 lg:px-6">
        <IncomeEntriesChart
          entries={entries}
          currencySymbol={currencySymbol}
          isLoading={isLoading}
        />
      </div>
      <IncomeSummaryCards
        entries={entries}
        currencySymbol={currencySymbol}
        isLoading={isLoading}
      />
      <IncomeEntriesTable incomeId={id} />
    </>
  );
}
