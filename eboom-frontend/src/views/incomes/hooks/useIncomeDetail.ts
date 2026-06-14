"use client";

import API_ROUTES from "@/src/api/urls";
import useQueryApi from "@/src/api/useQuery";
import { useMemo } from "react";
import type { IncomeEntry } from "../component/IncomeEntriesTable";
import { Income } from "@backend/db/schema";

export function useIncomeDetail(incomeId: number) {
  const { data: incomeRes, isLoading: isLoadingIncome, isError: isIncomeError } =
    useQueryApi<{
      income: Income;
    }>(API_ROUTES.INCOMES_GET(incomeId), {
      queryKey: ["income", incomeId],
      enabled: !!incomeId,
    });

  const {
    data: entriesRes,
    isLoading: isLoadingEntries,
    isError: isEntriesError,
  } = useQueryApi<{ entries: IncomeEntry[] }>(
    API_ROUTES.INCOME_ENTRIES_LIST(incomeId),
    {
      queryKey: ["income-entries", incomeId],
      enabled: !!incomeId,
    }
  );

  const { data: currenciesRes } = useQueryApi<{
    currencies?: { id: number; code: string; symbol: string }[];
  }>(API_ROUTES.CURRENCIES_METADATA, {
    queryKey: ["currencies"],
  });

  const currencySymbol = useMemo(() => {
    const currencyId = incomeRes?.income?.currencyId;
    if (!currencyId) return undefined;
    return currenciesRes?.currencies?.find((c) => c.id === currencyId)?.symbol;
  }, [incomeRes?.income?.currencyId, currenciesRes?.currencies]);

  return {
    income: incomeRes?.income,
    entries: entriesRes?.entries ?? [],
    currencySymbol,
    isLoading: isLoadingIncome || isLoadingEntries,
    isError: isIncomeError || isEntriesError,
  };
}
