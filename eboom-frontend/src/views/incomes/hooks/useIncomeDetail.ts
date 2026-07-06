"use client";

import API_ROUTES from "@/src/api/urls";
import useQueryApi from "@/src/api/useQuery";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useMemo } from "react";
import type { IncomeEntry } from "../component/IncomeEntriesTable";
import { Income } from "@backend/db/schema";

export type IncomeDetail = Income & {
  defaultWallet?: { id: number; name: string } | null;
  category?: { id: number; name: string } | null;
  currency?: { id: number; code: string; name: string; symbol: string } | null;
};

interface UseIncomeDetailOptions {
  enabled?: boolean;
}

export function useIncomeDetail(
  incomeId: number,
  options?: UseIncomeDetailOptions
) {
  const { canvas } = useCanvas();
  const enabled = (options?.enabled ?? true) && !!canvas && !!incomeId;

  const { data: incomeRes, isLoading: isLoadingIncome, isError: isIncomeError } =
    useQueryApi<{
      income: IncomeDetail;
    }>(canvas ? API_ROUTES.INCOMES_GET(canvas, incomeId) : "", {
      queryKey: ["income", canvas, incomeId],
      enabled,
    });

  const {
    data: entriesRes,
    isLoading: isLoadingEntries,
    isError: isEntriesError,
  } = useQueryApi<{ entries: IncomeEntry[] }>(
    canvas ? API_ROUTES.INCOME_ENTRIES_LIST(canvas, incomeId) : "",
    {
      queryKey: ["income-entries", canvas, incomeId],
      enabled,
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
