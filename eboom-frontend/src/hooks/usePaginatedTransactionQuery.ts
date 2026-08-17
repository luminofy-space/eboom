"use client";

import { keepPreviousData } from "@tanstack/react-query";
import useQueryApi from "@/src/api/useQuery";
import { buildUrlWithParams } from "@/src/api/buildUrlWithParams";
import { useMemo, useState } from "react";
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
  const [requestedPage, setRequestedPage] = useState(1);

  // knownTotal is the total from the last resolved fetch. We use it (rather
  // than this render's own query.data, which doesn't exist yet since the
  // query below is what produces it) to clamp the page we're about to
  // request, mirroring the previous effect's behavior without the extra
  // unbatched render.
  const [knownTotal, setKnownTotal] = useState(0);
  const knownTotalPages = Math.max(1, Math.ceil(knownTotal / pageSize));
  const page = knownTotal > 0 ? Math.min(requestedPage, knownTotalPages) : requestedPage;

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
  // Adjust state during render (React-sanctioned pattern) rather than in an
  // effect: once the fresh total is known, keep it in sync for the next
  // render's clamp calculation above.
  if (total !== knownTotal) {
    setKnownTotal(total);
  }

  const rawItems = query.data?.[options.itemsKey];
  const items = (Array.isArray(rawItems) ? rawItems : []) as TItem[];

  return {
    items,
    data: query.data,
    total,
    page,
    pageSize,
    totalPages,
    setPage: setRequestedPage,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
}
