"use client";

import API_ROUTES from "@/src/api/urls";
import useQueryApi from "@/src/api/useQuery";

export type ListEntityType = "incomes" | "expenses" | "wallets" | "assets";

const CATEGORY_ROUTES: Record<ListEntityType, string> = {
  incomes: API_ROUTES.INCOME_CATEGORIES,
  expenses: API_ROUTES.EXPENSE_CATEGORIES,
  wallets: API_ROUTES.WALLET_CATEGORIES,
  assets: API_ROUTES.ASSET_CATEGORIES,
};

const CATEGORY_QUERY_KEYS: Record<ListEntityType, string> = {
  incomes: "income-categories",
  expenses: "expense-categories",
  wallets: "wallet-categories",
  assets: "asset-categories",
};

export interface FilterOption {
  id: number;
  name: string;
}

export function useListFilterOptions(entityType: ListEntityType) {
  const showCurrency =
    entityType === "incomes" || entityType === "expenses" || entityType === "assets";
  const showRecurring = entityType === "incomes" || entityType === "expenses";

  const { data: categoriesRes } = useQueryApi<{ categories?: FilterOption[] }>(
    CATEGORY_ROUTES[entityType],
    {
      queryKey: [CATEGORY_QUERY_KEYS[entityType]],
      hasToken: true,
    }
  );

  const { data: currenciesRes } = useQueryApi<{
    currencies?: { id: number; name: string; code: string }[];
  }>(API_ROUTES.CURRENCIES_METADATA, {
    queryKey: ["currencies"],
    hasToken: true,
    enabled: showCurrency,
  });

  return {
    categories: categoriesRes?.categories ?? [],
    currencies: currenciesRes?.currencies ?? [],
    showCurrency,
    showRecurring,
  };
}
