import { buildUrl, isAuthFailure, parseResponse } from "@/lib/utils/apiUtils";
import { getAuthHeaders } from "@/lib/utils/authUtils";
import { CURRENT_USER_PERMISSIONS_REVALIDATE_TAG } from "@/lib/constants/revalidateTags";
import { createSessionExpiredError, isSessionExpired } from "@/lib/constants/authErrors";

export type PermissionMap = Record<string, Set<string>>;

type RawSection = {
  slug?: string;
  permissions?: Array<{ code?: string }>;
};

export function transformPermissionsData(rawResults: RawSection[], outputFormat: "set" | "array" = "set") {
  const transformedPermissions: Record<string, Set<string> | string[]> = {};

  if (Array.isArray(rawResults)) {
    rawResults.forEach((section) => {
      if (section.slug && section.permissions) {
        const permissionCodes = section.permissions
          .map((perm) => perm.code)
          .filter((code): code is string => Boolean(code));

        transformedPermissions[section.slug] =
          outputFormat === "set" ? new Set(permissionCodes) : permissionCodes;
      }
    });
  }

  return transformedPermissions;
}

const USER_PERMISSIONS_ENDPOINT = "api/v1/auth/web/user-permissions-section-wise/";

export async function loadUserPermissions(): Promise<PermissionMap> {
  try {
    const url = buildUrl(USER_PERMISSIONS_ENDPOINT);
    const headers = await getAuthHeaders();

    if (!headers.Authorization) return {};

    let response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      next: { tags: [CURRENT_USER_PERMISSIONS_REVALIDATE_TAG] },
    });

    if (await isAuthFailure(response)) {
      const newHeaders = await getAuthHeaders(true);
      if (!newHeaders.Authorization) throw createSessionExpiredError();

      response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...newHeaders,
        },
        next: { tags: [CURRENT_USER_PERMISSIONS_REVALIDATE_TAG] },
      });
    }

    const json = await parseResponse(response);
    const rawData = (json.data ?? json) as { results?: RawSection[] } | RawSection[];
    const results = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData.results)
      ? rawData.results
      : [];

    return transformPermissionsData(results, "set") as PermissionMap;
  } catch (error) {
    if (isSessionExpired(error)) throw error;
    return {};
  }
}

export async function hasPermission(section: string, action: string): Promise<boolean> {
  const permissions = await loadUserPermissions();
  return permissions?.[section]?.has(action) ?? false;
}

export async function ensurePermission(section: string, action: string): Promise<void> {
  const allowed = await hasPermission(section, action);
  if (!allowed) {
    throw {
      status: 403,
      message: "You don't have permission for this action.",
    };
  }
}
