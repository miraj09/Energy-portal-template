"use server";

import { buildUrl, isAuthFailure, parseResponse } from "@/lib/utils/apiUtils";
import { getAuthHeaders } from "@/lib/utils/authUtils";
import { createSessionExpiredError } from "@/lib/constants/authErrors";
import type { PermissionDescriptor } from "@/lib/baseQueries";

type MutateOptions = {
  method?: string;
  body?: unknown;
  headers?: HeadersInit;
};

async function mutateData(
  endpoint: string,
  options: MutateOptions,
  config: MutateOptions = {},
  perm: PermissionDescriptor | null = null
): Promise<Record<string, unknown>> {
  const { method, body, headers = {} } = { ...options, ...config };

  if (perm) {
    const { ensurePermission } = await import("@/lib/permissions/permissionUtils");
    await ensurePermission(perm.section, perm.action);
  }

  const url = buildUrl(endpoint);
  const authHeaders = await getAuthHeaders();

  const fetchOptions: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(headers as Record<string, string>),
      ...authHeaders,
    },
    cache: "no-store",
  };

  if (body !== undefined) {
    fetchOptions.body = JSON.stringify(body);
  }

  let response = await fetch(url, fetchOptions);

  if (await isAuthFailure(response)) {
    const newAuthHeaders = await getAuthHeaders(true);
    if (!newAuthHeaders.Authorization) {
      throw createSessionExpiredError();
    }

    fetchOptions.headers = {
      ...(fetchOptions.headers as Record<string, string>),
      ...newAuthHeaders,
    };
    response = await fetch(url, fetchOptions);
  }

  return parseResponse(response);
}

export async function createResource(
  endpoint: string,
  data: unknown,
  perm: PermissionDescriptor | null = null
): Promise<Record<string, unknown>> {
  return mutateData(endpoint, { method: "POST", body: data }, {}, perm);
}

export async function patchResource(
  endpoint: string,
  data: unknown,
  perm: PermissionDescriptor | null = null
): Promise<Record<string, unknown>> {
  return mutateData(endpoint, { method: "PATCH", body: data }, {}, perm);
}

export async function deleteResource(
  endpoint: string,
  perm: PermissionDescriptor | null = null
): Promise<Record<string, unknown>> {
  return mutateData(endpoint, { method: "DELETE" }, {}, perm);
}
