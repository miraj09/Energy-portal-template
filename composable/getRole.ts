"use client";

import { getDropdown } from "@/lib/actions/getDropdown";

export interface RoleOption {
  label: string;
  value: string;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
}

export interface RoleListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Role[];
}

// Add new interface for error handling
export interface RoleListResult {
  success: boolean;
  data?: RoleOption[];
  message?: string;
  errors?: unknown;
}

// Cache to store API responses
const roleCache = new Map<string, RoleOption[]>();

/**
 * Composable function to fetch role list with optional search parameter
 * @param search - Optional search term to filter roles
 * @returns Promise<RoleListResult> - Result with role options or error information
 */
export async function getRoleList(search?: string): Promise<RoleListResult> {
  try {
    // Only make API call if search term is provided and length is more than 2
    if (!search || search.trim().length < 3) {
      return {
        success: true,
        data: [],
      };
    }

    const searchKey = search.trim().toLowerCase();

    // Check cache first
    if (roleCache.has(searchKey)) {
      return {
        success: true,
        data: roleCache.get(searchKey) || [],
      };
    }

    // Construct endpoint with search parameter
    const endpoint = `/api/v1/auth/web/role-list/?search=${encodeURIComponent(
      search
    )}`;

    const response = await getDropdown(endpoint);

    if (!response.success) {
      console.error("Failed to fetch role list:", response.message);
      return {
        success: false,
        message: response.message || "Failed to fetch role list",
        errors: response.errors,
      };
    }

    // Handle the actual response structure
    const roleData = response.data as RoleListResponse;

    if (!roleData?.results || !Array.isArray(roleData.results)) {
      console.error("Invalid role list response structure");
      return {
        success: false,
        message: "Invalid response structure",
      };
    }

    // Transform role data to multi-select options format
    const roleOptions: RoleOption[] = roleData.results
      .filter((role: Role) => role.is_active) // Only include active roles
      .map((role: Role) => ({
        label: role.name,
        value: role.id.toString(),
      }));

    // Cache the results
    roleCache.set(searchKey, roleOptions);

    return {
      success: true,
      data: roleOptions,
    };
  } catch (error) {
    console.error("Error fetching role list:", error);
    return {
      success: false,
      message: "An error occurred while fetching roles",
      errors: error,
    };
  }
}

/**
 * Get cached results for a search term
 * @param search - Search term
 * @returns RoleOption[] - Cached results or empty array
 */
export function getCachedRoles(search?: string): RoleOption[] {
  if (!search || search.trim().length < 3) {
    return [];
  }
  const searchKey = search.trim().toLowerCase();
  return roleCache.get(searchKey) || [];
}

/**
 * Clear the role cache
 */
export function clearRoleCache(): void {
  roleCache.clear();
}

/**
 * Hook-like function to get all roles (no search filter)
 * @returns Promise<RoleListResult> - Result with role options or error information
 */
export async function getAllRoles(): Promise<RoleListResult> {
  return getRoleList();
}

/**
 * Hook-like function to search roles by name
 * @param searchTerm - Search term to filter roles by name
 * @returns Promise<RoleListResult> - Result with filtered role options or error information
 */
export async function searchRoles(searchTerm: string): Promise<RoleListResult> {
  return getRoleList(searchTerm);
}
