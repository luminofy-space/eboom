"use client";

import { IncomeEntriesChart } from "./component/IncomeEntriesChart";
import { IncomeEntriesTable } from "./component/IncomeEntriesTable";
import { IncomeSummaryCards } from "./component/IncomeSummaryCards";
import { useIncomeDetail } from "./hooks/useIncomeDetail";
import { Container } from "@/components/ui/container";

interface Props {
  id: number;
}

export default function IncomeDetailPage({ id }: Props) {
  const { entries, currencySymbol, isLoading } = useIncomeDetail(id);

  return (
    <>
      <Container>
        <IncomeEntriesChart
          entries={entries}
          currencySymbol={currencySymbol}
          isLoading={isLoading}
        />
      </Container>
      <IncomeSummaryCards
        entries={entries}
        currencySymbol={currencySymbol}
        isLoading={isLoading}
      />
      <IncomeEntriesTable incomeId={id} />
    </>
  );
}
