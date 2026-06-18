"use server";

import { getResource } from "@/lib/baseQueries";
import type { RoleRecord } from "@/lib/types/role";

export async function getRole(id: number) {
  try {
    if (!id) return { success: false, message: "Role ID is required" };

    const response = await getResource(`api/v1/auth/web/role/${id}/`);
    const data = (response.data || response) as RoleRecord & {
      permissions?: RoleRecord["role_permissions"];
      role_permissions?: RoleRecord["role_permissions"];
    };

    const normalized: RoleRecord = {
      ...data,
      permissions_details: data.permissions_details || data.role_permissions || data.permissions || [],
    };

    return {
      success: true,
      data: normalized,
    };
  } catch (error) {
    const typedError = error as { status?: number; message?: string };
    if (typedError.status === 404) return { success: false, message: "Role not found" };
    return { success: false, message: typedError.message || "Failed to fetch role data" };
  }
}
