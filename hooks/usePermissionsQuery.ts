"use client";

import { useQuery } from "@tanstack/react-query";

export const USER_PERMISSIONS_QUERY_KEY = ["user-permissions"] as const;

export type SerializedPermissionMap = Record<string, string[]>;

async function fetchUserPermissions(): Promise<SerializedPermissionMap> {
  const response = await fetch("/api/user-permissions");
  if (!response.ok) {
    throw new Error(`Failed to load permissions (HTTP ${response.status})`);
  }

  const json = (await response.json()) as {
    success?: boolean;
    data?: SerializedPermissionMap;
  };

  return json.data ?? {};
}

/**
 * Cached user permissions from `/api/user-permissions`.
 * staleTime 10 minutes so navigations do not re-hit the backend every time.
 */
export function usePermissionsQuery() {
  return useQuery({
    queryKey: USER_PERMISSIONS_QUERY_KEY,
    queryFn: fetchUserPermissions,
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
