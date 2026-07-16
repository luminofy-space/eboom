"use client";

import { keepPreviousData } from "@tanstack/react-query";
import useQueryApi from "@/src/api/useQuery";
import { buildUrlWithParams } from "@/src/api/buildUrlWithParams";
import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/src/redux/store";
import { selectListPageSize } from "@/src/redux/searchSlice";

interface UsePaginatedTransactionQueryOptions<TResponse> {
  baseUrl: string;
  queryKey: unknown[];
  enabled?: boolean;
  itemsKey: keyof TResponse;
  extraParams?: Record<string, string | number | undefined>;
}

export function usePaginatedTransactionQuery<
  TResponse extends { total: number },
  TItem,
>(options: UsePaginatedTransactionQueryOptions<TResponse>) {
  const pageSize = useAppSelector(selectListPageSize);
  const [page, setPage] = useState(1);

  const extraParamsKey = useMemo(
    () => JSON.stringify(options.extraParams ?? {}),
    [options.extraParams]
  );

  const url = useMemo(
    () =>
      buildUrlWithParams(options.baseUrl, {
        page,
        limit: pageSize,
        ...options.extraParams,
      }),
    [options.baseUrl, page, pageSize, extraParamsKey, options.extraParams]
  );

  const query = useQueryApi<TResponse>(url, {
    queryKey: [...options.queryKey, "paginated", page, pageSize, extraParamsKey],
    enabled: (options.enabled ?? true) && !!options.baseUrl,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    hasToken: true,
  });

  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (total > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [total, page, totalPages]);

  const rawItems = query.data?.[options.itemsKey];
  const items = (Array.isArray(rawItems) ? rawItems : []) as TItem[];

  return {
    items,
    data: query.data,
    total,
    page,
    pageSize,
    totalPages,
    setPage,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
}
