"use client";

import { useEffect } from "react";
import {
  keepPreviousData,
  useQuery,
  type QueryKey,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type {
  TableDataResponse,
  TableDataResult,
  TableFilters,
} from "@/composable/getTableData";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export type PaginatedTableFetcher<T> = (
  filters: TableFilters
) => Promise<TableDataResult<T>>;

type UsePaginatedTableQueryOptions<T> = {
  /** Stable resource key, e.g. "submitted-sales" — used for cache + invalidation. */
  resource: string;
  fetcher: PaginatedTableFetcher<T>;
  page: number;
  pageSize: number;
  /** Live search input; only the debounced value enters the query key. */
  search: string;
  filters?: TableFilters;
  debounceMs?: number;
  enabled?: boolean;
  /** Extra segments for queryKey when the same resource has variants (e.g. LOA tab). */
  extraKey?: QueryKey;
};

function isAuthFailure(result: TableDataResult<unknown>): boolean {
  if (
    result.message?.toLowerCase().includes("authentication") ||
    result.message?.toLowerCase().includes("token")
  ) {
    return true;
  }
  const errors = result.errors as
    | { authError?: boolean; status?: number }
    | undefined;
  return Boolean(errors?.authError || errors?.status === 401);
}

/**
 * Cached paginated list query with debounced search.
 * Uses keepPreviousData so page changes do not flash empty rows.
 */
export function usePaginatedTableQuery<T>({
  resource,
  fetcher,
  page,
  pageSize,
  search,
  filters = {},
  debounceMs = 400,
  enabled = true,
  extraKey = [],
}: UsePaginatedTableQueryOptions<T>) {
  const router = useRouter();
  const debouncedSearch = useDebouncedValue(search, debounceMs);

  const query = useQuery({
    queryKey: [
      resource,
      page,
      pageSize,
      debouncedSearch,
      filters,
      ...extraKey,
    ],
    queryFn: async (): Promise<TableDataResponse<T>> => {
      const result = await fetcher({
        page,
        page_size: pageSize,
        search: debouncedSearch,
        ...filters,
      });

      if (!result.success || !result.data) {
        if (isAuthFailure(result)) {
          router.push("/login");
        }
        throw new Error(result.message || `Failed to fetch ${resource}`);
      }

      return result.data;
    },
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (query.isError && query.error) {
      toast.error(
        query.error instanceof Error
          ? query.error.message
          : `Failed to fetch ${resource}`
      );
    }
  }, [query.isError, query.error, resource]);

  return {
    ...query,
    results: query.data?.results ?? [],
    totalItems: query.data?.count ?? 0,
    debouncedSearch,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
  };
}
