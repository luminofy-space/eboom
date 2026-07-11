"use client";

import { keepPreviousData } from "@tanstack/react-query";
import useQueryApi from "@/src/api/useQuery";
import { useMemo, useState } from "react";
import { buildUrlWithParams } from "@/src/api/buildUrlWithParams";
import type { PaginatedResponse } from "@/src/types/pagination";
import type { ListQueryFilters } from "@/src/hooks/useInfiniteList";

interface UsePaginatedListOptions {
  queryKey: unknown[];
  enabled?: boolean;
  limit?: number;
  search?: string;
  filters?: ListQueryFilters;
}

function buildResetKey(
  search: string,
  filters: ListQueryFilters,
  limit: number
): string {
  return [
    search,
    filters.categoryId ?? "",
    filters.currencyId ?? "",
    filters.isRecurring ?? "",
    limit,
  ].join("|");
}

export function usePaginatedList<T>(
  baseUrl: string,
  options: UsePaginatedListOptions
) {
  const { queryKey, enabled = true, limit = 20, search = "", filters = {} } = options;
  const resetKey = buildResetKey(search, filters, limit);

  const [pageState, setPageState] = useState({ resetKey, page: 1 });

  if (pageState.resetKey !== resetKey) {
    setPageState({ resetKey, page: 1 });
  }

  const setPage = (next: number | ((prev: number) => number)) => {
    setPageState((prev) => ({
      resetKey: prev.resetKey,
      page: typeof next === "function" ? next(prev.page) : next,
    }));
  };

  const page = pageState.page;

  const url = useMemo(
    () =>
      buildUrlWithParams(baseUrl, {
        page,
        limit,
        search,
        categoryId: filters.categoryId,
        currencyId: filters.currencyId,
        isRecurring:
          filters.isRecurring !== undefined ? String(filters.isRecurring) : undefined,
      }),
    [baseUrl, page, limit, search, filters.categoryId, filters.currencyId, filters.isRecurring]
  );

  const query = useQueryApi<PaginatedResponse<T>>(url, {
    queryKey: [...queryKey, "paginated", page, limit, search, filters],
    enabled: enabled && !!baseUrl,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });

  const data = query.data;
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (total > 0 && pageState.page > totalPages) {
    setPageState({ resetKey: pageState.resetKey, page: totalPages });
  }

  return {
    items: data?.items ?? [],
    total,
    page,
    limit,
    totalPages,
    setPage,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isPlaceholderData: query.isPlaceholderData,
    refetch: query.refetch,
  };
}
