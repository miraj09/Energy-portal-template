import { cache } from "react";
import { buildUrl, isAuthFailure, parseResponse } from "@/lib/utils/apiUtils";
import { getAuthHeaders } from "@/lib/utils/authUtils";
import { createSessionExpiredError } from "@/lib/constants/authErrors";

export type PermissionDescriptor = {
  section: string;
  action: string;
};

export async function fetchData(
  endpoint: string,
  options: RequestInit = {},
  config: RequestInit = {},
  perm: PermissionDescriptor | null = null
): Promise<Record<string, unknown>> {
  const { headers: customHeaders = {}, ...restOptions } = {
    ...options,
    ...config,
  };

  if (perm) {
    const { ensurePermission } = await import("@/lib/permissions/permissionUtils");
    await ensurePermission(perm.section, perm.action);
  }

  const url = buildUrl(endpoint);
  const authHeaders = await getAuthHeaders();

  const fetchOptions: RequestInit = {
    ...restOptions,
    headers: {
      "Content-Type": "application/json",
      ...(customHeaders as Record<string, string>),
      ...authHeaders,
    },
  };

  let response = await fetch(url, fetchOptions);

  if (await isAuthFailure(response)) {
    const newHeaders = await getAuthHeaders(true);
    if (!newHeaders.Authorization) {
      throw createSessionExpiredError();
    }

    fetchOptions.headers = {
      ...(fetchOptions.headers as Record<string, string>),
      ...newHeaders,
    };
    response = await fetch(url, fetchOptions);
  }

  return parseResponse(response);
}

export async function getResource(
  endpoint: string,
  options: RequestInit = {},
  perm: PermissionDescriptor | null = null
): Promise<Record<string, unknown>> {
  return fetchData(endpoint, options, {}, perm);
}

export const getCachedResource = cache(
  async (
    endpoint: string,
    options: RequestInit = {},
    perm: PermissionDescriptor | null = null
  ) => getResource(endpoint, { ...options, cache: "force-cache" }, perm)
);
