"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import { useContext } from "react";
import { AuthContext } from "@/src/components/AuthProvider";
import { snakeToCamel } from "@/src/api/utils";
import { buildUrlWithParams } from "@/src/api/buildUrlWithParams";
import { resolveApiUrl } from "@/src/api/resolveApiUrl";
import { useCallback, useEffect, useRef } from "react";
import type { PaginatedResponse } from "@/src/types/pagination";

interface UseInfiniteListOptions {
  queryKey: unknown[];
  enabled?: boolean;
  limit?: number;
  search?: string;
}

export function useInfiniteList<T>(
  baseUrl: string,
  options: UseInfiniteListOptions
) {
  const { queryKey, enabled = true, limit = 20, search = "" } = options;
  const authContext = useContext(AuthContext);
  const accessToken = authContext?.accessToken ?? null;

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const query = useInfiniteQuery<PaginatedResponse<T>>({
    queryKey: [...queryKey, search],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const url = buildUrlWithParams(baseUrl, {
        page: pageParam as number,
        limit,
        search,
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
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.total / lastPage.limit);
      if (lastPage.page < totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: enabled && !!baseUrl,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const { fetchNextPage, hasNextPage, isFetchingNextPage } = query;

  // Intersection observer for infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);

  const setSentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (node) {
        observerRef.current = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          },
          { threshold: 0.1 }
        );
        observerRef.current.observe(node);
      }

      sentinelRef.current = node;
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Flatten all pages into a single items array
  const items: T[] = query.data?.pages.flatMap((page) => page.items) ?? [];

  return {
    items,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isFetchingNextPage,
    hasNextPage: hasNextPage ?? false,
    sentinelRef: setSentinelRef,
    refetch: query.refetch,
  };
}
