"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import axios from "@/src/api/axiosTypes";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/src/components/AuthProvider";
import { snakeToCamel } from "@/src/api/utils";
import { buildUrlWithParams } from "@/src/api/buildUrlWithParams";
import { resolveApiUrl } from "@/src/api/resolveApiUrl";
import type { PaginatedResponse } from "@/src/types/pagination";
import type { ListQueryFilters } from "@/src/hooks/useInfiniteList";

interface UsePaginatedListOptions {
  queryKey: unknown[];
  enabled?: boolean;
  limit?: number;
  search?: string;
  filters?: ListQueryFilters;
}

export function usePaginatedList<T>(
  baseUrl: string,
  options: UsePaginatedListOptions
) {
  const { queryKey, enabled = true, limit = 20, search = "", filters = {} } = options;
  const authContext = useContext(AuthContext);
  const accessToken = authContext?.accessToken ?? null;
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [search, filters.categoryId, filters.currencyId, filters.isRecurring, limit]);

  const query = useQuery<PaginatedResponse<T>>({
    queryKey: [...queryKey, "paginated", page, limit, search, filters],
    queryFn: async () => {
      const url = buildUrlWithParams(baseUrl, {
        page,
        limit,
        search,
        categoryId: filters.categoryId,
        currencyId: filters.currencyId,
        isRecurring:
          filters.isRecurring !== undefined ? String(filters.isRecurring) : undefined,
      });

      const headers: Record<string, string> = {};
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      try {
        const res = await axios.get(resolveApiUrl(url), { headers });
        return snakeToCamel(res.data) as PaginatedResponse<T>;
      } catch (err: unknown) {
        const axiosErr = err as { response?: { status?: number } };
        if (axiosErr.response?.status === 401 || axiosErr.response?.status === 403) {
          authContext?.signOut();
        }
        throw err;
      }
    },
    enabled: enabled && !!baseUrl,
    staleTime: 0,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });

  const data = query.data;
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    if (page > totalPages && total > 0) {
      setPage(totalPages);
    }
  }, [page, totalPages, total]);

  return {
    items: data?.items ?? [],
    total,
    page,
    limit,
    totalPages,
    setPage,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}
